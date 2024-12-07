// src/components/CourseDetailsModal.tsx
import React from 'react';
import { Course } from '../types/courseTypes';
import { X } from 'lucide-react';

interface CourseDetailsModalProps {
    course: Course;
    onClose: () => void;
}

const CourseDetailsModal: React.FC<CourseDetailsModalProps> = ({ course, onClose }) => {
    const handleOpenCatalog = () => {
        if (course.link) {
            window.open(course.link, '_blank');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-2xl p-6 m-4 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                >
                    <X size={24} />
                </button>

                <div className="space-y-4">
                    <div className="border-b pb-4">
                        <h2 className="text-2xl font-bold text-gray-900">{course.name}</h2>
                        <p className="text-lg text-blue-600">{course.id}</p>
                        <p className="text-gray-600">{course.creditHours} Credit Hours</p>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <h3 className="font-semibold text-gray-900">Description</h3>
                            <p className="text-gray-700">{course.description}</p>
                        </div>
                    </div>

                    {course.link && (
                        <button
                            onClick={handleOpenCatalog}
                            className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            View in Course Catalog
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CourseDetailsModal;