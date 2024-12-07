import { Course, SubjectArea } from '../types/courseTypes';

export const getCurrentSubjectCourses = (
    courses: {
        physics: Course[];
        cs: Course[];
        math: Course[];
    },
    selectedSubject: SubjectArea
) => {
    switch (selectedSubject) {
        case 'cs':
            return courses.cs;
        case 'math':
            return courses.math;
        case 'physics':
            return courses.physics;
        default:
            return [];
    }
};