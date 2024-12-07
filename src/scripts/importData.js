// src/scripts/importData.js
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, writeBatch } from 'firebase/firestore';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Helper function to transform course data
const transformCourseData = (courseData, subject) => {
    // Extract number from class-number (e.g., "CS 100" -> 100)
    const classNumber = parseInt(courseData['class-number'].split(' ')[1]);

    // Extract credit hours from credits string (e.g., "1 Hour Hours." -> 1)
    const creditMatch = courseData.credits.match(/\d+/);
    const creditHours = creditMatch ? parseInt(creditMatch[0]) : 0;

    return {
        id: courseData['class-number'].replace(/\s+/g, ''),  // "CS 100" -> "CS100"
        classNumber: classNumber,                            // 100
        name: courseData['class-title'],
        description: courseData.description,
        creditHours: creditHours,                           // integer
        link: courseData.link,
        subject: subject.toLowerCase()                      // "cs", "math", "phys"
    };
};

// Import courses for a specific subject
const importSubjectCourses = async (coursesData, subject) => {
    try {
        const batch = writeBatch(db);
        const coursesRef = collection(db, 'courses');

        coursesData.forEach((course) => {
            const transformedCourse = transformCourseData(course, subject);
            const courseDoc = doc(coursesRef, transformedCourse.id);
            batch.set(courseDoc, transformedCourse);
        });

        await batch.commit();
        console.log(`${subject.toUpperCase()} courses imported successfully`);
    } catch (error) {
        console.error(`Error importing ${subject} courses:`, error);
        throw error;
    }
};

// Import degree requirements
const importDegreeRequirements = async () => {
    try {
        const csmReqs = JSON.parse(
            await readFile(resolve(__dirname, '../../../frontend/public/data/json/degree/csm_reqs.json'), 'utf8')
        );
        const physReqs = JSON.parse(
            await readFile(resolve(__dirname, '../../../frontend/public/data/json/degree/phys_reqs.json'), 'utf8')
        );

        const batch = writeBatch(db);
        const degreesRef = collection(db, 'degrees');

        // Store CS&Math requirements
        const csmDoc = doc(degreesRef, 'csm');
        batch.set(csmDoc, {
            id: 'csm',
            name: 'Computer Science & Mathematics',
            requirements: csmReqs
        });

        // Store Physics requirements
        const physDoc = doc(degreesRef, 'phys');
        batch.set(physDoc, {
            id: 'phys',
            name: 'Physics',
            requirements: physReqs
        });

        await batch.commit();
        console.log('Degree requirements imported successfully');
    } catch (error) {
        console.error('Error importing degree requirements:', error);
        throw error;
    }
};

// Create test user
const createTestUser = async () => {
    try {
        const testUser = {
            uid: 'test-user-123',
            username: 'Test User',
            degree: {
                program: 'Computer Science',
                startYear: 2024,
                anticipatedGraduation: 2028
            },
            semesters: [
                {
                    id: 'FALL2024',
                    name: 'Fall 2024',
                    courseIds: ['CS100', 'MATH241', 'PHYS211']
                },
                {
                    id: 'SPRING2025',
                    name: 'Spring 2025',
                    courseIds: ['CS128', 'MATH231', 'PHYS212']
                },
                {
                    id: 'FALL2025',
                    name: 'Fall 2025',
                    courseIds: []
                }
            ]
        };

        await setDoc(doc(db, 'users', testUser.uid), testUser);
        console.log('Test user created successfully');
    } catch (error) {
        console.error('Error creating test user:', error);
        throw error;
    }
};

// Main import function
const importAllData = async () => {
    try {
        // Read and parse course files
        const csCoursesData = JSON.parse(
            await readFile(resolve(__dirname, '../../../frontend/public/data/json/subject/cs_courses.json'), 'utf8')
        );
        const physCoursesData = JSON.parse(
            await readFile(resolve(__dirname, '../../../frontend/public/data/json/subject/phys_courses.json'), 'utf8')
        );
        const mathCoursesData = JSON.parse(
            await readFile(resolve(__dirname, '../../../frontend/public/data/json/subject/math_courses.json'), 'utf8')
        );

        console.log('Files read successfully');

        // Import courses for each subject
        await importSubjectCourses(csCoursesData, 'cs');
        await importSubjectCourses(physCoursesData, 'phys');
        await importSubjectCourses(mathCoursesData, 'math');

        // Import degree requirements
        // await importDegreeRequirements();

        // Create test user
        // await createTestUser();

        console.log('All data imported successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error importing data:', error);
        process.exit(1);
    }
};

// Run the import
importAllData();