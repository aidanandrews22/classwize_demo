// src/components/auth/AuthWrapper.tsx
import React, { useEffect, useState } from 'react';
import firebaseService from '../../services/firebase';

interface AuthWrapperProps {
    children: React.ReactNode;
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
    const [isInitialized, setIsInitialized] = useState(false);
    const testUserId = 'test-user-123';

    useEffect(() => {
        const initializeUserData = async () => {
            try {
                const existingUser = await firebaseService.getUserData(testUserId);

                if (!existingUser) {
                    // Initialize test user if it doesn't exist
                    await firebaseService.initializeUser(testUserId, {
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
                                courseIds: ['CS100', 'MATH241', 'PHYS211'],
                                completed: false
                            },
                            {
                                id: 'SPRING2025',
                                name: 'Spring 2025',
                                courseIds: ['CS128', 'MATH231', 'PHYS212'],
                                completed: false
                            },
                            {
                                id: 'FALL2025',
                                name: 'Fall 2025',
                                courseIds: [],
                                completed: false
                            }
                        ]
                    });
                }

                setIsInitialized(true);
            } catch (error) {
                console.error('Error initializing test user:', error);
            }
        };

        initializeUserData();
    }, []);

    if (!isInitialized) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl text-gray-600">Setting up demo account...</div>
            </div>
        );
    }

    return <>{children}</>;
};

export default AuthWrapper;