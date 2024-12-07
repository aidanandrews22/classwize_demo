// src/components/CourseMovementModal.tsx
import React, { useState } from 'react';
import { Course } from '../types/courseTypes';

interface CourseMovementModalProps {
    course: Course;
    currentSemester: string;
    semesters: Array<{ id: string; name: string }>;
    onMove: (courseId: string, destinationSemesterId: string) => void;
    onCancel: () => void;
}

const CourseMovementModal: React.FC<CourseMovementModalProps> = ({
                                                                     course,
                                                                     currentSemester,
                                                                     semesters,
                                                                     onMove,
                                                                     onCancel
                                                                 }) => {
    const [selectedSemester, setSelectedSemester] = useState('');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full m-4">
                <h2 className="text-xl font-semibold mb-4">Move Course</h2>
                <p className="text-gray-600 mb-4">
                    {course.name} ({course.classNumber}) is already in your plan.
                    Would you like to move it to a different semester?
                </p>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Destination Semester
                    </label>
                    <select
                        value={selectedSemester}
                        onChange={(e) => setSelectedSemester(e.target.value)}
                        className="w-full p-2 border rounded-md"
                    >
                        <option value="">Choose a semester...</option>
                        {semesters
                            .filter(sem => sem.id !== currentSemester)
                            .map(semester => (
                                <option key={semester.id} value={semester.id}>
                                    {semester.name}
                                </option>
                            ))}
                    </select>
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => selectedSemester && onMove(course.id, selectedSemester)}
                        disabled={!selectedSemester}
                        className={`px-4 py-2 rounded-md ${
                            selectedSemester
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                    >
                        Move Course
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CourseMovementModal;