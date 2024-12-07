from transformers import AutoModelForCausalLM, AutoTokenizer
import torch
import json
import re
from bs4 import BeautifulSoup
import logging
import signal
import os
from typing import Tuple, List, Optional

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TimeoutError(Exception):
    pass

def timeout_handler(signum, frame):
    raise TimeoutError("LLM generation timed out")

class CourseParser:
    def __init__(self, checkpoint_file: str = 'checkpoint.json'):
        self.model = None
        self.tokenizer = None
        self.checkpoint_file = checkpoint_file
        
    def setup_model(self):
        if self.model is None or self.tokenizer is None:
            try:
                model_name = "meta-llama/Llama-2-7b-chat-hf"  # Updated model name
                self.tokenizer = AutoTokenizer.from_pretrained(model_name)
                self.tokenizer.pad_token = self.tokenizer.eos_token
                
                self.model = AutoModelForCausalLM.from_pretrained(
                    model_name,
                    torch_dtype=torch.float16,
                    device_map="auto"
                )
                logger.info("Model loaded successfully")
            except Exception as e:
                logger.error(f"Error setting up model: {str(e)}")
                raise

    def clean_json_string(self, json_str: str) -> Optional[dict]:
        """Clean and validate JSON string"""
        try:
            # Remove any trailing commas
            json_str = re.sub(r',\s*}', '}', json_str)
            json_str = re.sub(r',\s*]', ']', json_str)
            
            # Parse and return the JSON object
            parsed = json.loads(json_str)
            return parsed
        except Exception as e:
            logger.error(f"JSON cleaning error: {str(e)}")
            return None

    def process_with_llm(self, prompt: str, timeout_seconds: int = 30) -> Tuple[Optional[dict], Optional[str]]:
        signal.signal(signal.SIGALRM, timeout_handler)
        signal.alarm(timeout_seconds)
        
        try:
            if self.model is None or self.tokenizer is None:
                self.setup_model()
            
            system_prompt = """You are an assistant that extracts structured data from course descriptions.
Given a course title block and a course description block, extract the following information and output it in JSON format:

- title: The course title.
- code: The course code (e.g., 'CS 101').
- credits: The number of credit hours (as a number).
- description: The course description.
- prerequisites: Any prerequisites for the course.
- gen_ed: A list of general education requirements satisfied by the course.

Ensure that the JSON output is valid and properly formatted. If a field is missing, you can leave it empty or null. Do not include any additional text or explanation."""

            full_prompt = f"{system_prompt}\n\nCourse Title Block: {prompt}\n\nOutput:"
            
            inputs = self.tokenizer(
                full_prompt, 
                return_tensors="pt", 
                max_length=2048, 
                truncation=True,
                padding=True,
                return_attention_mask=True
            )
            
            inputs = {k: v.to(self.model.device) for k, v in inputs.items()}

            with torch.no_grad():
                outputs = self.model.generate(
                    input_ids=inputs['input_ids'],
                    attention_mask=inputs['attention_mask'],
                    max_length=512,
                    num_return_sequences=1,
                    temperature=0.7,
                    top_p=0.95,
                    do_sample=True,
                    pad_token_id=self.tokenizer.pad_token_id,
                    eos_token_id=self.tokenizer.eos_token_id,
                    num_beams=1
                )

            response = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
            
            # Extract JSON content
            try:
                json_match = re.search(r'\{.*\}', response, re.DOTALL)
                if json_match:
                    json_str = json_match.group()
                    parsed_json = self.clean_json_string(json_str)
                    if parsed_json:
                        return parsed_json, response
                logger.warning(f"No valid JSON found in response: {response[:200]}...")
                return None, response

            except Exception as e:
                logger.error(f"Error extracting JSON: {str(e)}")
                return None, response
        except TimeoutError:
            logger.warning("LLM generation timed out")
            return None, None
        except Exception as e:
            logger.error(f"Error in LLM processing: {str(e)}")
            return None, None
        finally:
            signal.alarm(0)

    def parse_course_blocks_batch(self, course_blocks: List, batch_size: int = 5) -> List[Tuple[dict, str]]:
        results = []
        total_blocks = len(course_blocks)
        
        for i in range(0, total_blocks, batch_size):
            batch = course_blocks[i:min(i + batch_size, total_blocks)]
            batch_results = []
            
            for block_idx, block in enumerate(batch, i + 1):
                try:
                    title_block = block.find('p', class_='courseblocktitle')
                    desc_block = block.find('p', class_='courseblockdesc')
                    
                    if not title_block or not desc_block:
                        continue
                        
                    title_text = title_block.get_text(separator=" ", strip=True)
                    desc_text = desc_block.get_text(separator=" ", strip=True)

                    # Combine title and description for the prompt
                    prompt = f"""{title_text}\n{desc_text}"""

                    logger.info(f"Processing course {block_idx}/{total_blocks}: {title_text[:50]}...")
                    
                    json_data, raw_response = self.process_with_llm(prompt)
                    if json_data:
                        batch_results.append((json_data, raw_response))
                        logger.info(f"Successfully processed course {block_idx}")
                    else:
                        logger.warning(f"Failed to get valid JSON for course {block_idx}")
                    
                except Exception as e:
                    logger.error(f"Error processing course block {block_idx}: {str(e)}")
                    continue
            
            results.extend(batch_results)
            torch.cuda.empty_cache()
            
            # Save checkpoint after each batch
            self.save_checkpoint(results)
            
        return results

    def save_checkpoint(self, processed_data: List[Tuple[dict, str]]):
        try:
            with open(self.checkpoint_file, 'w') as f:
                json.dump(processed_data, f)
            logger.info(f"Saved checkpoint with {len(processed_data)} processed courses")
        except Exception as e:
            logger.error(f"Error saving checkpoint: {str(e)}")

    def load_checkpoint(self) -> List[Tuple[dict, str]]:
        if os.path.exists(self.checkpoint_file):
            try:
                with open(self.checkpoint_file, 'r') as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Error loading checkpoint: {str(e)}")
        return []

def main():
    try:
        with open('cs_courses.html', 'r', encoding='utf-8') as f:
            html_content = f.read()

        parser = CourseParser()
        
        # Load existing progress
        processed_courses = parser.load_checkpoint()
        
        # Parse HTML
        soup = BeautifulSoup(html_content, 'html.parser')
        course_blocks = soup.find_all('div', class_='courseblock')
        
        # Process remaining courses
        if len(processed_courses) < len(course_blocks):
            remaining_blocks = course_blocks[len(processed_courses):]
            new_results = parser.parse_course_blocks_batch(remaining_blocks)
            processed_courses.extend(new_results)

        # Save final results
        if processed_courses:
            # Save processed JSON
            final_json = []
            for json_data, _ in processed_courses:
                final_json.append(json_data)

            with open('processed_courses.json', 'w') as f:
                json.dump(final_json, f, indent=2)
                logger.info(f"Successfully wrote {len(final_json)} courses to JSON file")

            # Save raw responses
            with open('raw_llm_responses.txt', 'w') as f:
                for _, raw_response in processed_courses:
                    f.write(f"{raw_response}\n\n{'='*80}\n\n")
                logger.info("Wrote raw responses to text file")

    except Exception as e:
        logger.error(f"Error in main execution: {str(e)}")
    finally:
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

if __name__ == "__main__":
    main()
