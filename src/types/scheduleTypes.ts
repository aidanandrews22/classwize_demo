// types/scheduleTypes.ts
import { Course } from './courseTypes';

export interface UserSchedule {
    userId: string;
    semesters: UserSemester[];
}

export interface UserSemester {
    id: string;
    name: string;
    courseIds: string[];  // These IDs correspond to course['class-number'] in the course data
}