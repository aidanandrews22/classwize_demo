// src/components/Semester.tsx
import React, { useEffect, useRef, useState } from 'react';
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import type { Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/types';
import { Course as CourseType, SubjectArea } from '../types/courseTypes';
import Course from './Course';
import CourseSelectionModal from './CourseSelectionModal';
import CourseDetailsModal from './CourseDetailsModal';
import { getCurrentSubjectCourses } from '../utils/courseUtils';
import { searchCourses } from '../utils/searchUtils';

interface SemesterProps {
  semester: {
    id: string;
    name: string;
    courseIds: string[];
    completed: boolean;
  };
  courses: CourseType[];
  setErrorMessage: React.Dispatch<React.SetStateAction<string>>;
  registry: any;
  instanceId: symbol;
  onRemoveCourse: (courseId: string, semesterId: string) => Promise<void>;
  onToggleComplete: (semesterId: string, completed: boolean) => Promise<void>;
  allCourses: {
    physics: CourseType[];
    cs: CourseType[];
    math: CourseType[];
  };
  onAddCourse: (semesterId: string, courseId: string) => Promise<void>;
  userId: string;
  onDelete: (semesterId: string) => Promise<void>;
  isCompactMode: boolean;
}

const Semester: React.FC<SemesterProps> = ({
  semester,
  courses,
  setErrorMessage,
  registry,
  instanceId,
  onRemoveCourse,
  onToggleComplete,
  allCourses,
  onAddCourse,
  userId,
  onDelete,
  isCompactMode,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<SubjectArea>('cs');

  // Calculate total credit hours
  const totalCreditHours = courses.reduce((total, course) => total + course.creditHours, 0);

  const filteredCourses = searchCourses(
    getCurrentSubjectCourses(allCourses, selectedSubject),
    searchTerm
  );

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Register the semester with the registry
    registry.registerColumn(semester.id, {
      element,
      dropTarget: element,
    });

    // Only set up drag and drop if semester is not completed
    if (!semester.completed) {
      // Make the semester a drop target
      const cleanup = dropTargetForElements({
        element,
        getIsSticky: () => true,
        getData: () => ({
          type: 'semester',
          semesterId: semester.id,
        }),
        canDrop: (args) => {
          return args.source.data.type === 'course';
        },
        onDragStart: () => {
          setIsDraggingOver(true);
        },
        onDragEnter: () => {
          setIsDraggingOver(true);
        },
        onDrop: () => {
          setIsDraggingOver(false);
        },
        onDragLeave: () => {
          setIsDraggingOver(false);
        },
      });

      return () => {
        cleanup();
        registry.unregisterColumn(semester.id);
      };
    }
  }, [semester.id, instanceId, registry, courses.length, semester.completed]);

  return (
    <div
      ref={ref}
      className={`flex-none ${isCompactMode ? 'w-48' : 'w-64'} bg-white rounded-xl shadow-sm p-6 flex flex-col relative 
                 ${isDraggingOver && !semester.completed ? 'border-2 border-blue-500' : ''}
                 ${semester.completed ? 'border-2 border-green-500' : ''}`}
      role="region"
      aria-label={`${semester.name} semester`}
    >
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-blue-600 mb-2">{semester.name}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleComplete(semester.id, !semester.completed)}
            className={`px-2 py-1 rounded-md text-sm font-medium transition-colors
                      ${semester.completed 
                        ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
            aria-label={`Mark semester as ${semester.completed ? 'incomplete' : 'completed'}`}
          >
            {semester.completed ? 'Completed' : 'Mark Complete'}
          </button>
          {!semester.completed && (
            <button
              onClick={() => onDelete(semester.id)}
              className="px-2 py-1 rounded-md text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
              aria-label={`Delete ${semester.name}`}
            >
              Delete
            </button>
          )}
        </div>
      </div>

      <div
        className="flex flex-col gap-3 min-h-[200px] p-2 rounded-lg flex-grow relative"
        role="list"
        aria-label={`Courses in ${semester.name}`}
      >
        {courses.map((course, index) => (
          <Course
            key={course.id}
            course={course}
            index={index}
            isLastItem={index === courses.length - 1}
            isFirstItem={index === 0}
            semesterId={semester.id}
            setErrorMessage={setErrorMessage}
            registry={registry}
            instanceId={instanceId}
            onRemove={() => onRemoveCourse(course.id, semester.id)}
            onClick={(course) => setSelectedCourse(course)}
            gapSize={12}
            semesterCompleted={semester.completed}
            isCompactMode={isCompactMode}
          />
        ))}

        {/* Empty State */}
        {courses.length === 0 && (
          <div
            className="flex-grow border-2 border-dashed border-gray-200 rounded-lg 
                     flex items-center justify-center text-gray-400"
            data-type="drop-zone"
            data-semester-id={semester.id}
            data-position="empty"
          >
            Drop courses here
          </div>
        )}
      </div>

      {/* Semester Footer */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-sm font-medium text-gray-600">
          Total Credit Hours: <span className="text-blue-600">{totalCreditHours}</span>
        </p>
      </div>

      {/* Add Course Button */}
      <button
        className="mt-4 w-full py-2 bg-blue-600 text-white text-2xl rounded-lg 
                 hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 
                 focus:ring-blue-500 focus:ring-offset-2"
        onClick={() => setIsModalOpen(true)}
        aria-label={`Add course to ${semester.name}`}
      >
        +
      </button>

      {/* Modals */}
      {isModalOpen && (
        <CourseSelectionModal
          isOpen={true}
          onClose={() => setIsModalOpen(false)}
          onSelectCourse={async (course) => {
            try {
              await onAddCourse(semester.id, course.id);
              setIsModalOpen(false);
            } catch (error) {
              setErrorMessage('Failed to add course to semester');
            }
          }}
          semester={{ id: semester.id, name: semester.name }}
          userId={userId}
        />
      )}

      {selectedCourse && (
        <CourseDetailsModal 
          course={selectedCourse} 
          onClose={() => setSelectedCourse(null)} 
        />
      )}
    </div>
  );
};

export default Semester;
