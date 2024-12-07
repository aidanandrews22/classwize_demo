export interface Course {
    id: string;
    name: string;
    creditHours: number;
    prereqs: string[];
    coreqs: string[];
    isPrereqFor: string[];
  }
  
  export interface Semester {
    id: string;
    name: string;
    courseIds: string[];
  }
  
  export interface AppState {
    courses: { [id: string]: Course };
    semesters: Semester[];
  }