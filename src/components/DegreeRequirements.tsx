//src/components/DegreeRequirements.tsx
import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { DegreeProgram, DegreeRequirement } from '../types/courseTypes';
import firebaseService from '../services/firebase';

interface DegreeRequirementsProps {
    userId: string;
}

const DegreeRequirements: React.FC<DegreeRequirementsProps> = ({ userId }) => {
    const [requirements, setRequirements] = useState<DegreeProgram | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDegreeRequirements = async () => {
            try {
                // First get user's program from their profile
                const userData = await firebaseService.getUserData(userId);
                if (!userData) {
                    throw new Error('User data not found');
                }

                // Get the degree requirements for their program
                const degreeReqs = await firebaseService.getDegreeRequirements(userData.degree.program.toLowerCase().replace(/\s+/g, ''));
                setRequirements(degreeReqs);
            } catch (error) {
                console.error('Error loading degree requirements:', error);
            } finally {
                setLoading(false);
            }
        };

        loadDegreeRequirements();
    }, [userId]);

    if (loading) {
        return <div className="flex justify-center items-center h-64">Loading...</div>;
    }

    if (!requirements) {
        return <div>No degree requirements found.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-2xl font-semibold mb-2">{requirements.name}</h2>
                <p className="text-gray-600">
                    Total Credits Required: {requirements.total_hours_required}
                </p>
            </div>

            {requirements.requirements.map((req: DegreeRequirement, index: number) => (
                <Card key={index}>
                    <CardHeader>
                        <CardTitle className="flex justify-between">
                            <span>{req.category}</span>
                            {req.credit_hours && (
                                <span className="text-gray-600">
                                    {req.credit_hours} credits
                                </span>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {req.description && (
                            <p className="text-gray-700 mb-4">{req.description}</p>
                        )}
                        {req.courses && (
                            <div className="space-y-2">
                                {req.courses.map((course, courseIndex) => (
                                    <div
                                        key={courseIndex}
                                        className="flex justify-between items-center p-2 rounded hover:bg-gray-50"
                                    >
                                        <div>
                                            <span className="font-medium">{course.code}</span>
                                            <span className="mx-2">-</span>
                                            <span>{course.name}</span>
                                        </div>
                                        <span className="text-gray-600">{course.hours} credits</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

export default DegreeRequirements;