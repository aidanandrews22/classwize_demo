import React from 'react';
import { Course } from '../types/courseTypes';
import CourseDataViewer from './CourseDataViewer';

interface CourseSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectCourse: (course: Course) => void;
    semester: { id: string; name: string };
    userId: string;
}

const CourseSelectionModal = ({
    isOpen,
    onClose,
    onSelectCourse,
    semester,
    userId
}: CourseSelectionModalProps) => {
    if (!isOpen) return null;

    return (
        <CourseDataViewer
            userId={userId}
            isModal={true}
            onSelectCourse={onSelectCourse}
            onClose={onClose}
            modalTitle={`Add Course to ${semester.name}`}
            targetSemesterId={semester.id}
        />
    );
};

export default CourseSelectionModal;