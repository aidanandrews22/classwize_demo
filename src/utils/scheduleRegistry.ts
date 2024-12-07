// src/utils/scheduleRegistry.ts
import invariant from 'tiny-invariant';

type CourseEntry = {
  element: HTMLElement;
  actionMenuTrigger: HTMLElement | null;
};

type SemesterEntry = {
  element: HTMLElement;
  dropTarget: HTMLElement;
};

type Registry = {
  courses: Map<string, CourseEntry>;
  semesters: Map<string, SemesterEntry>;
};

export function createScheduleRegistry() {
  const registry: Registry = {
    courses: new Map(),
    semesters: new Map(),
  };

  function registerCourse(courseId: string, entry: CourseEntry) {
    registry.courses.set(courseId, entry);
  }

  function unregisterCourse(courseId: string) {
    registry.courses.delete(courseId);
  }

  function getCourse(courseId: string): CourseEntry {
    const entry = registry.courses.get(courseId);
    invariant(entry, `Course not found: ${courseId}`);
    return entry;
  }

  function registerSemester(semesterId: string, entry: SemesterEntry) {
    registry.semesters.set(semesterId, entry);
  }

  function unregisterSemester(semesterId: string) {
    registry.semesters.delete(semesterId);
  }

  function getSemester(semesterId: string): SemesterEntry {
    const entry = registry.semesters.get(semesterId);
    invariant(entry, `Semester not found: ${semesterId}`);
    return entry;
  }

  return {
    registerCard: registerCourse,
    unregisterCard: unregisterCourse,
    getCard: getCourse,
    registerColumn: registerSemester,
    unregisterColumn: unregisterSemester,
    getColumn: getSemester,
  };
}

// Types for use in components
export type ScheduleRegistry = ReturnType<typeof createScheduleRegistry>;