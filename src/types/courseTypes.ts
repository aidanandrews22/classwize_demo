// types/courseTypes.ts
export interface Course {
    id: string;               // e.g., "CS100"
    classNumber: number;      // e.g., 100
    name: string;            // e.g., "Computer Science Orientation"
    description: string;
    creditHours: number;      // e.g., 1
    link: string;
    subject: string;         // e.g., "cs"
}

export type SubjectArea = 'cs' | 'math' | 'physics';

export interface DegreeRequirement {
    category: string;
    description?: string;
    courses?: {
        code: string;
        name: string;
        hours: number;
        notes?: string;
    }[];
    credit_hours?: number;
}

export interface DegreeProgram {
    name: string;
    total_hours_required: number;
    requirements: DegreeRequirement[];
}

export interface CourseData {
    physics: Course[];
    cs: Course[];
    math: Course[];
    requirements: {
        degree_programs: DegreeProgram[];
    };
}