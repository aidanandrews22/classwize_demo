from bs4 import BeautifulSoup
import json
import re

def extract_credit_hours(text):
    match = re.search(r'credit:\s*(\d+(?:\s*to\s*\d+)?)\s*Hours?\.', text)
    return match.group(1) if match else None

def parse_prerequisites(prereq_text):
    prereq_structure = {
        "courses": [],  # For simple list of required courses
        "or_groups": [], # For "one of" type requirements
        "raw_text": prereq_text.strip()  # Store original text
    }
    
    # Check for "One of" pattern
    if "One of" in prereq_text:
        courses = re.findall(r'([A-Z]+)\s*(\d+)', prereq_text)
        prereq_structure["or_groups"].append([f"{subj} {num}" for subj, num in courses])
    
    # Check for "or" between two specific courses
    elif " or " in prereq_text:
        parts = prereq_text.split(" or ")
        or_group = []
        for part in parts:
            courses = re.findall(r'([A-Z]+)\s*(\d+)', part)
            or_group.extend([f"{subj} {num}" for subj, num in courses])
        if or_group:
            prereq_structure["or_groups"].append(or_group)
    
    # Simple list of courses
    else:
        courses = re.findall(r'([A-Z]+)\s*(\d+)', prereq_text)
        prereq_structure["courses"].extend([f"{subj} {num}" for subj, num in courses])
    
    return prereq_structure

def extract_course_info(block):
    course = {}
    
    # Get title block text
    title_block = block.find('p', class_='courseblocktitle').get_text()
    
    # Extract course subject and number
    course_match = re.search(r'(CS)\s*(\d+)', title_block)
    if course_match:
        course['subject'] = course_match.group(1)
        course['number'] = course_match.group(2)
    
    # Extract full title
    title_match = re.search(r'CS\s*\d+\s*(.*?)\s*credit:', title_block)
    course['title'] = title_match.group(1).strip() if title_match else ""
    
    # Extract credit hours
    course['credit_hours'] = extract_credit_hours(title_block)
    
    # Get description block
    desc_block = block.find('p', class_='courseblockdesc').get_text()
    
    # Initialize other fields
    course['prerequisites'] = {}
    course['corequisites'] = []
    course['same_as'] = []
    course['gen_ed'] = []
    course['credit_not_given'] = []
    course['description'] = ""
    course['other_info'] = ""
    
    # Process description block
    lines = desc_block.split('\n')
    current_text = ""
    
    for line in lines:
        line = line.strip()
        
        # Check for "Same as" courses
        if line.startswith('Same as'):
            courses = re.findall(r'([A-Z]+)\s*(\d+)', line)
            course['same_as'].extend([f"{subj} {num}" for subj, num in courses])
            continue
            
        # Check for prerequisites
        if 'Prerequisite:' in line:
            prereq_text = line.split('Prerequisite:')[1].strip()
            course['prerequisites'] = parse_prerequisites(prereq_text)
            continue
            
        # Check for credit not given
        if 'Credit is not given for' in line:
            not_given = re.findall(r'([A-Z]+)\s*(\d+)', line)
            course['credit_not_given'].extend([f"{subj} {num}" for subj, num in not_given])
            continue
            
        # Check for gen ed criteria
        if 'General Education Criteria for:' in line:
            gen_ed = line.replace('General Education Criteria for:', '').strip()
            course['gen_ed'].append(gen_ed)
            continue
            
        # Add to description if not caught by other categories
        if line:
            current_text += line + " "
    
    course['description'] = current_text.strip()
    
    return course

def create_course_database(html_content):
    soup = BeautifulSoup(html_content, 'html.parser')
    course_blocks = soup.find_all('div', class_='courseblock')
    
    courses = []
    for block in course_blocks:
        course_info = extract_course_info(block)
        courses.append(course_info)
    
    return courses

# Usage:
with open('cs_courses.html', 'r') as f:
    html_content = f.read()

course_database = create_course_database(html_content)

# Save to JSON file
with open('course_database.json', 'w') as f:
    json.dump(course_database, f, indent=2)