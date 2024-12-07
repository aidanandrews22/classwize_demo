// src/components/ScheduleView.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { getReorderDestinationIndex } from '@atlaskit/pragmatic-drag-and-drop-hitbox/util/get-reorder-destination-index';
import * as liveRegion from '@atlaskit/pragmatic-drag-and-drop-live-region';
import { triggerPostMoveFlash } from '@atlaskit/pragmatic-drag-and-drop-flourish/trigger-post-move-flash';
import { reorder } from '@atlaskit/pragmatic-drag-and-drop/reorder';
import invariant from 'tiny-invariant';

import { Course as CourseType } from '../types/courseTypes';
import Semester from './Semester';
import ErrorMessage from './ErrorMessage';
import DegreeTotals from './DegreeTotals';
import Legend from './Legend';
import CourseMovementModal from './CourseMovementModal';
import firebaseService from '../services/firebase';
import { createScheduleRegistry } from '../utils/scheduleRegistry';
import AddSemesterModal from "./AddSemesterModal"
import { Plus } from 'lucide-react';
import { compareSemesters } from 'utils/semesterUtils';

interface ScheduleViewProps {
  userId: string;
}

type Outcome =
  | {
      type: 'semester-reorder';
      semesterId: string;
      startIndex: number;
      finishIndex: number;
    }
  | {
      type: 'course-reorder';
      semesterId: string;
      startIndex: number;
      finishIndex: number;
    }
  | {
      type: 'course-move';
      startSemesterId: string;
      finishSemesterId: string;
      itemIndexInStartSemester: number;
      itemIndexInFinishSemester: number;
    };

type Operation = {
  trigger: 'pointer' | 'keyboard';
  outcome: Outcome;
};

type ScheduleState = {
  courses: { [id: string]: CourseType };
  semesters: Array<{
    id: string;
    name: string;
    courseIds: string[];
    completed: boolean;
  }>;
  lastOperation: Operation | null;
};

// Define the types for the data
type DraggableData = {
    type: 'semester' | 'course';
    instanceId: symbol;
    itemId?: string; // For courses
    semesterId?: string; // For courses and semesters
};
  
  type DropTargetData = {
    type: 'semester' | 'course';
    semesterId?: string; // For semesters
    courseId?: string; // For courses
};
  

const ScheduleView: React.FC<ScheduleViewProps> = ({ userId }) => {
  const [data, setData] = useState<ScheduleState>(() => ({
    courses: {},
    semesters: [],
    lastOperation: null,
  }));
  const [completedCourses, setCompletedCourses] = useState<string[]>([]);

  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCourseForMove, setSelectedCourseForMove] = useState<{
    course: CourseType;
    currentSemester: string;
  } | null>(null);

  const stableData = useRef(data);
  const [registry] = useState(createScheduleRegistry);
  const [isAddSemesterModalOpen, setIsAddSemesterModalOpen] = useState(false);

  const [courses, setCourses] = useState<{
    physics: CourseType[];
    cs: CourseType[];
    math: CourseType[];
  }>({
    physics: [],
    cs: [],
    math: []
  });

  const [isCompactMode, setIsCompactMode] = useState(false);

  useEffect(() => {
    stableData.current = data;
  }, [data]);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const allCourses = await firebaseService.getAllCourses();
        const coursesMap = allCourses.reduce((acc, course) => {
          acc[course.id] = course;
          return acc;
        }, {} as { [id: string]: CourseType });

        const userSchedule = await firebaseService.getUserSchedule(userId);

        setData({
          courses: coursesMap,
          semesters: userSchedule || [],
          lastOperation: null,
        });
        setIsAddSemesterModalOpen(false);
      } catch (error) {
        console.error('Error loading schedule data:', error);
        setErrorMessage('Failed to load schedule data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userId]);

  // Handle operations feedback (optional)
  const { lastOperation } = data;
  useEffect(() => {
    if (!lastOperation) return;

    const { outcome, trigger } = lastOperation;

    // Implement feedback logic if needed

  }, [lastOperation, registry]);

  // Clean up live region on unmount
  useEffect(() => {
    return liveRegion.cleanup();
  }, []);

  // Set up drag and drop monitoring
  const [instanceId] = useState(() => Symbol('schedule-instance'));

  const handleReorderSemester = useCallback(
    ({
      startIndex,
      finishIndex,
      trigger = 'keyboard',
    }: {
      startIndex: number;
      finishIndex: number;
      trigger?: 'pointer' | 'keyboard';
    }) => {
      setData((data) => {
        const outcome: Outcome = {
          type: 'semester-reorder',
          semesterId: data.semesters[startIndex].id,
          startIndex,
          finishIndex,
        };

        return {
          ...data,
          semesters: reorder({
            list: data.semesters,
            startIndex,
            finishIndex,
          }),
          lastOperation: {
            outcome,
            trigger,
          },
        };
      });
    },
    [],
  );

  const handleReorderCourse = useCallback(
    ({
      semesterId,
      startIndex,
      finishIndex,
      trigger = 'keyboard',
    }: {
      semesterId: string;
      startIndex: number;
      finishIndex: number;
      trigger?: 'pointer' | 'keyboard';
    }) => {
      setData((data) => {
        const semester = data.semesters.find((sem) => sem.id === semesterId);
        invariant(semester, `Semester not found: ${semesterId}`);

        const updatedCourseIds = reorder({
          list: semester.courseIds,
          startIndex,
          finishIndex,
        });

        const updatedSemester = { ...semester, courseIds: updatedCourseIds };
        const updatedSemesters = data.semesters.map((sem) =>
          sem.id === semesterId ? updatedSemester : sem
        );

        const outcome: Outcome = {
          type: 'course-reorder',
          semesterId,
          startIndex,
          finishIndex,
        };

        return {
          ...data,
          semesters: updatedSemesters,
          lastOperation: {
            outcome,
            trigger,
          },
        };
      });
    },
    [],
  );

  const handleMoveCourse = useCallback(
    ({
      startSemesterId,
      finishSemesterId,
      itemIndexInStartSemester,
      itemIndexInFinishSemester,
      trigger = 'pointer',
    }: {
      startSemesterId: string;
      finishSemesterId: string;
      itemIndexInStartSemester: number;
      itemIndexInFinishSemester?: number;
      trigger?: 'pointer' | 'keyboard';
    }) => {
      setData((data) => {
        const startSemester = data.semesters.find((sem) => sem.id === startSemesterId);
        const finishSemester = data.semesters.find((sem) => sem.id === finishSemesterId);
        invariant(startSemester, `Start semester not found: ${startSemesterId}`);
        invariant(finishSemester, `Finish semester not found: ${finishSemesterId}`);

        const itemId = startSemester.courseIds[itemIndexInStartSemester];

        const updatedStartCourseIds = startSemester.courseIds.filter((id) => id !== itemId);

        const updatedFinishCourseIds = Array.from(finishSemester.courseIds);
        const newIndexInFinish = itemIndexInFinishSemester ?? 0;
        updatedFinishCourseIds.splice(newIndexInFinish, 0, itemId);

        const updatedSemesters = data.semesters.map((sem) => {
          if (sem.id === startSemesterId) return { ...sem, courseIds: updatedStartCourseIds };
          if (sem.id === finishSemesterId) return { ...sem, courseIds: updatedFinishCourseIds };
          return sem;
        });

        // Update Firebase
        firebaseService.updateUserSchedule(userId, updatedSemesters).catch((error) => {
          console.error('Error updating schedule in Firebase:', error);
          setErrorMessage('Failed to save changes to the database');
        });

        const outcome: Outcome = {
          type: 'course-move',
          startSemesterId,
          finishSemesterId,
          itemIndexInStartSemester,
          itemIndexInFinishSemester: newIndexInFinish,
        };

        return {
          ...data,
          semesters: updatedSemesters,
          lastOperation: {
            outcome,
            trigger,
          },
        };
      });
    },
    [userId, setErrorMessage],
  );

  const handleAddSemester = async (semesterData: { id: string; name: string; courseIds: string[] }) => {
    try {
      const semesterExists = data.semesters.some(sem => sem.id === semesterData.id);
      if (semesterExists) {
        setErrorMessage('This semester already exists in your plan');
        return;
      }

      const newSemester = { ...semesterData, completed: false };
      const updatedSemesters = [...data.semesters, newSemester].sort(compareSemesters);

      await firebaseService.updateUserSchedule(userId, updatedSemesters);
      
      setData(prev => ({
        ...prev,
        semesters: updatedSemesters,
        lastOperation: null
      }));

      setIsAddSemesterModalOpen(false);
    } catch (error) {
      console.error('Error adding semester:', error);
      setErrorMessage('Failed to add semester');
    }
  };

  const handleToggleComplete = async (semesterId: string, completed: boolean) => {
    try {
      const semester = data.semesters.find(s => s.id === semesterId);
      if (!semester) return;

      // Update semester completion status
      const updatedSemesters = data.semesters.map(s =>
        s.id === semesterId ? { ...s, completed } : s
      );

      // Get all courses from completed semesters
      const allCompletedCourses = updatedSemesters
        .filter(s => s.completed)
        .flatMap(s => s.courseIds);

      // Update Firebase
      await Promise.all([
        firebaseService.updateUserSchedule(userId, updatedSemesters),
        firebaseService.updateUserCompletedCourses(userId, allCompletedCourses)
      ]);

      // Update local state
      setData(prev => ({
        ...prev,
        semesters: updatedSemesters
      }));
      setCompletedCourses(allCompletedCourses);
    } catch (error) {
      console.error('Error toggling semester completion:', error);
      setErrorMessage('Failed to update semester completion status');
    }
  };

  const handleRemoveCourse = async (courseId: string, semesterId: string) => {
    try {
        // Find the semester
        const semester = data.semesters.find(s => s.id === semesterId);
        if (!semester) {
            setErrorMessage('Semester not found');
            return;
        }

        if (semester.completed) {
            setErrorMessage('Cannot remove courses from completed semesters');
            return;
        }

        // Update local state immediately
        setData(prev => ({
            ...prev,
            semesters: prev.semesters.map(s =>
                s.id === semesterId
                    ? { ...s, courseIds: s.courseIds.filter(id => id !== courseId) }
                    : s
            )
        }));

        // Update Firebase
        await firebaseService.updateSemesterCourses(
            userId,
            semesterId,
            semester.courseIds.filter(id => id !== courseId)
        );
    } catch (error) {
        console.error('Error removing course:', error);
        setErrorMessage('Failed to remove course');
    }
  };

  const handleAddCourse = useCallback(async (semesterId: string, courseId: string) => {
    try {
      // Check if semester is completed
      const semester = data.semesters.find(s => s.id === semesterId);
      if (!semester) {
        setErrorMessage('Semester not found');
        return;
      }

      if (semester.completed) {
        setErrorMessage('Cannot add courses to completed semesters');
        return;
      }

      // Check if course exists in any semester
      const existingSemester = data.semesters.find(s =>
        s.courseIds.includes(courseId)
      );

      if (existingSemester) {
        // Show movement modal
        setSelectedCourseForMove({
          course: data.courses[courseId],
          currentSemester: existingSemester.id
        });
        return;
      }

      // Update local state immediately
      setData(prev => ({
        ...prev,
        semesters: prev.semesters.map(s =>
          s.id === semesterId
            ? { ...s, courseIds: [...s.courseIds, courseId] }
            : s
        ),
        lastOperation: null
      }));

      // Update Firebase with the now-guaranteed semester
      await firebaseService.updateSemesterCourses(userId, semesterId, [
        ...semester.courseIds,
        courseId
      ]);

    } catch (error) {
      console.error('Error adding course:', error);
      setErrorMessage('Failed to add course');
      
      // Revert local state if Firebase update fails
      setData(prev => ({
        ...prev,
        semesters: prev.semesters.map(s =>
          s.id === semesterId
            ? { ...s, courseIds: s.courseIds.filter(id => id !== courseId) }
            : s
        ),
        lastOperation: null
      }));
    }
  }, [data.semesters, data.courses, userId]);

  const handleDeleteSemester = async (semesterId: string) => {
    try {
      // Check if semester is completed
      const semester = data.semesters.find(s => s.id === semesterId);
      if (!semester) return;

      if (semester.completed) {
        setErrorMessage('Cannot delete completed semesters');
        return;
      }

      // Remove semester from local state
      setData(prev => ({
        ...prev,
        semesters: prev.semesters.filter(s => s.id !== semesterId)
      }));

      // Update Firebase
      await firebaseService.updateUserSchedule(
        userId,
        data.semesters.filter(s => s.id !== semesterId)
      );
    } catch (error) {
      console.error('Error deleting semester:', error);
      setErrorMessage('Failed to delete semester');
      
      // Revert local state if Firebase update fails
      setData(prev => ({
        ...prev,
        semesters: data.semesters
      }));
    }
  };

  useEffect(() => {
    return combine(
      monitorForElements({
        canMonitor({ source }) {
          return (source.data as DraggableData).instanceId === instanceId;
        },
        onDrop(args) {
          const { location, source } = args;
          const sourceData = source.data as DraggableData;
  
          if (!location.current.dropTargets.length) return;
  
          // Get target semester
          const target = location.current.dropTargets[0];
          const targetData = target.data as DropTargetData;
          const targetSemester = data.semesters.find(
            sem => sem.id === targetData.semesterId
          );
  
          // Prevent drops if either source or target semester is completed
          if (targetSemester?.completed) {
            setErrorMessage('Cannot modify completed semesters');
            return;
          }
  
          if (sourceData.type === 'course') {
            const sourceSemester = data.semesters.find(
              sem => sem.id === sourceData.semesterId
            );
            if (sourceSemester?.completed) {
              setErrorMessage('Cannot modify completed semesters');
              return;
            }
          }
  
          // Handle semester dragging
          if (sourceData.type === 'semester') {
            const sourceSemesterId = sourceData.semesterId!;
            const startIndex = data.semesters.findIndex(
              (sem) => sem.id === sourceSemesterId
            );
  
            const target = location.current.dropTargets[0];
            const targetData = target.data as DropTargetData;
            const indexOfTarget = data.semesters.findIndex(
              (sem) => sem.id === targetData.semesterId
            );
            const closestEdgeOfTarget = extractClosestEdge(target.data);
  
            const finishIndex = getReorderDestinationIndex({
              startIndex,
              indexOfTarget,
              closestEdgeOfTarget,
              axis: 'horizontal',
            });
  
            handleReorderSemester({
              startIndex,
              finishIndex,
              trigger: 'pointer',
            });
          }
  
          // Handle course dragging
          if (sourceData.type === 'course') {
            const itemId = sourceData.itemId!;
            const sourceSemesterId = sourceData.semesterId!;
            const itemIndexInSource = data.semesters
              .find((sem) => sem.id === sourceSemesterId)!
              .courseIds.findIndex((id) => id === itemId);
  
            // Handle drop on bottom zone or empty semester
            if (location.current.dropTargets.length === 1) {
              const target = location.current.dropTargets[0];
              const targetData = target.data as DropTargetData;
              const destinationSemesterId = targetData.semesterId!;
  
              // If dropping into same semester
              if (sourceSemesterId === destinationSemesterId) {
                const destinationSemester = data.semesters.find(
                  (sem) => sem.id === destinationSemesterId
                )!;
                handleReorderCourse({
                  semesterId: sourceSemesterId,
                  startIndex: itemIndexInSource,
                  finishIndex: destinationSemester.courseIds.length,
                  trigger: 'pointer',
                });
                return;
              }
  
              // Moving to a different semester (at the bottom)
              handleMoveCourse({
                itemIndexInStartSemester: itemIndexInSource,
                startSemesterId: sourceSemesterId,
                finishSemesterId: destinationSemesterId,
                itemIndexInFinishSemester: data.semesters.find(
                  (sem) => sem.id === destinationSemesterId
                )!.courseIds.length,
                trigger: 'pointer',
              });
              return;
            }
  
            if (location.current.dropTargets.length === 2) {
              const [destinationCourseRecord, destinationSemesterRecord] =
                location.current.dropTargets;
              const destinationSemesterId = (destinationSemesterRecord.data as DropTargetData)
                .semesterId!;
              const destinationCourseId = (destinationCourseRecord.data as DropTargetData)
                .courseId!;
  
              const indexOfTarget = data.semesters
                .find((sem) => sem.id === destinationSemesterId)!
                .courseIds.findIndex((id) => id === destinationCourseId);
              const closestEdgeOfTarget = extractClosestEdge(destinationCourseRecord.data);
  
              if (sourceSemesterId === destinationSemesterId) {
                // Reordering in the same semester
                const destinationIndex = getReorderDestinationIndex({
                  startIndex: itemIndexInSource,
                  indexOfTarget,
                  closestEdgeOfTarget,
                  axis: 'vertical',
                });
                handleReorderCourse({
                  semesterId: sourceSemesterId,
                  startIndex: itemIndexInSource,
                  finishIndex: destinationIndex,
                  trigger: 'pointer',
                });
                return;
              }
  
              // Moving to a different semester
              const destinationIndex =
                closestEdgeOfTarget === 'bottom' ? indexOfTarget + 1 : indexOfTarget;
  
              handleMoveCourse({
                itemIndexInStartSemester: itemIndexInSource,
                startSemesterId: sourceSemesterId,
                finishSemesterId: destinationSemesterId,
                itemIndexInFinishSemester: destinationIndex,
                trigger: 'pointer',
              });
            }
          }
        },
      })
    );
  }, [data, instanceId, handleMoveCourse, handleReorderCourse, handleReorderSemester]);
  

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading schedule...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-semibold text-gray-900">My Schedule</h2>
          <button
            onClick={() => setIsCompactMode(prev => !prev)}
            className="px-3 py-1 text-sm rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            aria-label="Toggle compact mode"
          >
            {isCompactMode ? 'Expand View' : 'Compact View'}
          </button>
        </div>
        <button
          onClick={() => setIsAddSemesterModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Add Semester
        </button>
      </div>

      <div className="flex overflow-x-auto py-6 gap-6" id="semesters">
        {data.semesters.map((semester) => (
          <Semester
            key={semester.id}
            semester={semester}
            courses={semester.courseIds.map((id) => data.courses[id]).filter(Boolean)}
            setErrorMessage={setErrorMessage}
            registry={registry}
            instanceId={instanceId}
            onRemoveCourse={handleRemoveCourse}
            onToggleComplete={handleToggleComplete}
            allCourses={courses}
            onAddCourse={handleAddCourse}
            userId={userId}
            onDelete={handleDeleteSemester}
            isCompactMode={isCompactMode}
          />
        ))}
      </div>

      <DegreeTotals courses={data.courses} semesters={data.semesters} />
      <Legend />

      {errorMessage && <ErrorMessage message={errorMessage} />}

      {/* Modals */}
      <AddSemesterModal
        isOpen={isAddSemesterModalOpen}
        onClose={() => setIsAddSemesterModalOpen(false)}
        onAddSemester={handleAddSemester}
      />
      {selectedCourseForMove && (
        <CourseMovementModal
          course={selectedCourseForMove.course}
          currentSemester={selectedCourseForMove.currentSemester}
          semesters={data.semesters}
          onMove={() => {
            /* Implement move handler */
          }}
          onCancel={() => setSelectedCourseForMove(null)}
        />
      )}
    </div>
  );
};

export default ScheduleView;
