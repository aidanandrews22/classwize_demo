//src/components/DegreeTotals.tsx
import React from 'react';
import { Course } from '../types/courseTypes';

interface DegreeTotalsProps {
    courses: { [id: string]: Course };
    semesters: Array<{ id: string; name: string; courseIds: string[]; completed: boolean }>;
}

const DegreeTotals: React.FC<DegreeTotalsProps> = ({ courses, semesters }) => {
    // Calculate total credit hours only from completed semesters
    const completedCreditHours = semesters
        .filter(semester => semester.completed)
        .reduce((total, semester) => {
            const semesterHours = semester.courseIds.reduce((semTotal: number, courseId: string) => {
                return semTotal + (courses[courseId]?.creditHours || 0);
            }, 0);
            return total + semesterHours;
        }, 0);

    const totalCompletedCourses = semesters
        .filter(semester => semester.completed)
        .reduce((total, sem) => total + sem.courseIds.length, 0);

    return (
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Degree Progress</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-600">Completed Credit Hours</h3>
                    <p className="text-2xl font-bold text-blue-600">{completedCreditHours}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-600">Completed Courses</h3>
                    <p className="text-2xl font-bold text-green-600">{totalCompletedCourses}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-600">Semesters Planned</h3>
                    <p className="text-2xl font-bold text-purple-600">{semesters.length}</p>
                </div>
            </div>
        </div>
    );
};

export default DegreeTotals;