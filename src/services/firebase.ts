// src/services/firebase.ts
import { initializeApp } from 'firebase/app';
import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    collection,
    query,
    where,
    getDocs
} from 'firebase/firestore';
import { Course, DegreeProgram } from '../types/courseTypes';

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

interface UserData {
    username: string;
    degree: {
        program: string;
        startYear: number;
        anticipatedGraduation: number;
    };
    semesters: Array<{
        id: string;
        name: string;
        courseIds: string[];
        completed: boolean;
    }>;
}

const firebaseService = {
    initializeUser: async (userId: string, userData: UserData): Promise<void> => {
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, {
            uid: userId,
            ...userData
        });
    },

    getUserData: async (userId: string): Promise<UserData | null> => {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            return userSnap.data() as UserData;
        }
        return null;
    },

    updateUserDegree: async (
        userId: string,
        degreeData: {
            program: string;
            startYear: number;
            anticipatedGraduation: number;
        }
    ): Promise<void> => {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, { degree: degreeData });
    },


    // Course methods
    getAllCourses: async (): Promise<Course[]> => {
        const coursesRef = collection(db, 'courses');
        const snapshot = await getDocs(coursesRef);
        return snapshot.docs.map(doc => doc.data() as Course);
    },

    getCoursesBySubject: async (subject: string): Promise<Course[]> => {
        const coursesRef = collection(db, 'courses');
        const q = query(coursesRef, where('subject', '==', subject));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data() as Course);
    },

    getCourseById: async (courseId: string): Promise<Course | null> => {
        const courseRef = doc(db, 'courses', courseId);
        const courseSnap = await getDoc(courseRef);
        return courseSnap.exists() ? courseSnap.data() as Course : null;
    },

    // Degree methods
    getDegreeRequirements: async (programId: string): Promise<DegreeProgram | null> => {
        const degreeRef = doc(db, 'degrees', programId);
        const degreeSnap = await getDoc(degreeRef);
        return degreeSnap.exists() ? degreeSnap.data() as DegreeProgram : null;
    },

    getAllDegreePrograms: async (): Promise<DegreeProgram[]> => {
        const degreesRef = collection(db, 'degrees');
        const snapshot = await getDocs(degreesRef);
        return snapshot.docs.map(doc => doc.data() as DegreeProgram);
    },

    // Semester methods
    updateSemesterCourses: async (
        userId: string,
        semesterId: string,
        courseIds: string[]
    ): Promise<void> => {

    },

    // User schedule methods
    getUserSchedule: async (userId: string) => {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            const userData = userSnap.data();
            return userData.semesters;
        }
        return null;
    },

    updateUserSchedule: async (
        userId: string,
        semesters: Array<{
            id: string;
            name: string;
            courseIds: string[];
        }>
    ): Promise<void> => {

    },

    // Add this new function to update completed courses
    updateUserCompletedCourses: async (userId: string, completedCourseIds: string[]) => {

    },

    // Add this function to get completed courses
    getUserCompletedCourses: async (userId: string): Promise<string[]> => {
        try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
                return userDoc.data().completedCourses || [];
            }
            return [];
        } catch (error) {
            console.error('Error getting completed courses:', error);
            throw error;
        }
    }
};

export default firebaseService;