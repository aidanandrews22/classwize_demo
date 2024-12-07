import { Course } from '../types/courseTypes';

export const searchCourses = (courses: Course[], searchTerm: string): Course[] => {
  const searchLower = searchTerm.toLowerCase();
  return courses.filter((course) => (
    course.classNumber.toString().includes(searchTerm) ||
    course.name.toLowerCase().includes(searchLower) ||
    course.description.toLowerCase().includes(searchLower)
  ));
};