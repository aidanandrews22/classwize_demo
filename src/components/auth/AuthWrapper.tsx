// src/components/auth/AuthWrapper.tsx
import React, { useEffect, useState } from 'react';
import { useUser, SignIn } from '@clerk/clerk-react';
import firebaseService from '../../services/firebase';

interface AuthWrapperProps {
    children: React.ReactNode;
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
    const { isSignedIn, user, isLoaded } = useUser();
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        const initializeUserData = async () => {
            if (!user) return;

            try {
                const existingUser = await firebaseService.getUserData(user.id);

                if (!existingUser) {
                    // Initialize new user in Firebase with completed field
                    await firebaseService.initializeUser(
                        user.id,
                        {
                            username: user.username || user.firstName || 'User',
                            degree: {
                                program: 'Computer Science',
                                startYear: new Date().getFullYear(),
                                anticipatedGraduation: new Date().getFullYear() + 4
                            },
                            semesters: [
                                {
                                    id: 'FALL2024',
                                    name: 'Fall 2024',
                                    courseIds: [],
                                    completed: false
                                },
                                {
                                    id: 'SPRING2025',
                                    name: 'Spring 2025',
                                    courseIds: [],
                                    completed: false
                                }
                            ]
                        }
                    );
                } else {
                    // Check if existing semesters need the completed field
                    const needsUpdate = existingUser.semesters.some(
                        semester => typeof semester.completed === 'undefined'
                    );

                    if (needsUpdate) {
                        // Add completed field to existing semesters
                        const updatedSemesters = existingUser.semesters.map(semester => ({
                            ...semester,
                            completed: false
                        }));

                        await firebaseService.updateUserSchedule(user.id, updatedSemesters);
                    }
                }

                setIsInitialized(true);
            } catch (error) {
                console.error('Error initializing user:', error);
            }
        };

        if (isSignedIn && !isInitialized) {
            initializeUserData();
        }
    }, [isSignedIn, user, isInitialized]);

    // Show loading state while Clerk is initializing
    if (!isLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl text-gray-600">Loading...</div>
            </div>
        );
    }

    // Show sign-in page if user is not signed in
    if (!isSignedIn) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <SignIn />
            </div>
        );
    }

    // Show loading state while Firebase is initializing
    if (!isInitialized) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl text-gray-600">Setting up your account...</div>
            </div>
        );
    }

    // Render the app once everything is initialized
    return <>{children}</>;
};

export default AuthWrapper;