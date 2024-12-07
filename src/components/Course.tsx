// src/components/Course.tsx
import React, { useEffect, useRef, useState } from 'react';
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { DropIndicator } from '@atlaskit/pragmatic-drag-and-drop-react-drop-indicator/box';
import type { Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/types';
import { X, GripVertical } from 'lucide-react';
import { Course as CourseType } from '../types/courseTypes';


interface CourseProps {
  course: CourseType;
  index: number;
  semesterId: string;
  setErrorMessage: React.Dispatch<React.SetStateAction<string>>;
  registry: any; // TODO: Add proper type
  instanceId: symbol;
  onRemove: (courseId: string, semesterId: string) => void;
  onClick: (course: CourseType) => void;
  gapSize: number;
  isLastItem: boolean;
  isFirstItem: boolean;
  semesterCompleted: boolean;
  isCompactMode: boolean;
}

const Course: React.FC<CourseProps> = ({
  course,
  semesterId,
  isLastItem,
  isFirstItem,
  setErrorMessage,
  registry,
  instanceId,
  onRemove,
  onClick,
  gapSize,
  semesterCompleted,
  isCompactMode,
}) => {
  const { id, name, creditHours } = course;
  const ref = useRef<HTMLDivElement>(null);
  const [dropIndicator, setDropIndicator] = useState<{
    isVisible: boolean;
    edge: Edge | null;
  }>({ isVisible: false, edge: null });

  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Register the course with the registry
    registry.registerCard(id, {
      element,
      actionMenuTrigger: element, // Update if necessary
    });

    const dragCleanup = draggable({
        element,
        getInitialData: () => ({
          type: 'course',
          instanceId,
          itemId: id,
          semesterId,
        }),
        onDragStart: () => {
          setIsDragging(true);
        },
        onDrop: () => {
          setIsDragging(false);
        },
    });

    const dropCleanup = dropTargetForElements({
      element,
      getIsSticky: () => true,
      getData: () => ({
        type: 'course',
        courseId: id,
        semesterId,
      }),
      onDragStart: (args) => {
        const edge = isFirstItem ? 'top' : 'bottom';
        setDropIndicator({ isVisible: true, edge });
      },
      onDragEnter: (args) => {
        const rect = element.getBoundingClientRect();
        const mouseY = args.location.current.input.clientY;
        const midPoint = rect.top + rect.height / 2;
        const edge = mouseY < midPoint ? 'top' : 'bottom';
        setDropIndicator({ isVisible: true, edge });
      },
      onDrop: () => {
        setDropIndicator({ isVisible: false, edge: null });
      },
      onDragLeave: () => {
        setDropIndicator({ isVisible: false, edge: null });
      },
    });

    return () => {
      dragCleanup();
      dropCleanup();
      registry.unregisterCard(id);
    };
  }, [id, instanceId, registry, semesterId, isLastItem, isFirstItem]);

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (semesterCompleted) {
      setErrorMessage('Cannot remove courses from completed semesters');
      return;
    }
    onRemove(id, semesterId);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      onClick(course);
    }
  };

  return (
    <div
      ref={ref}
      className={`group relative w-full bg-white rounded-lg shadow-sm p-3 transition-all 
                 hover:-translate-y-1 hover:shadow-md cursor-grab active:cursor-grabbing ${
                   isDragging ? 'opacity-50' : ''
                 }`}
      role="button"
      tabIndex={0}
      onClick={() => onClick(course)}
      onKeyDown={handleKeyDown}
      data-testid={`course-${id}`}
      aria-label={`${name} - ${creditHours} credits`}
    >
      {/* Drag handle */}
      <div className="absolute top-2 left-2 p-1 opacity-50 group-hover:opacity-100">
        <GripVertical size={16} />
      </div>

      {/* Remove button */}
      <button
        onClick={handleRemove}
        className={`absolute top-2 right-2 p-1 rounded-full 
                 ${semesterCompleted 
                   ? 'hidden' // Hide button completely when semester is completed
                   : 'hover:bg-red-100 text-red-500 opacity-0 group-hover:opacity-100'} 
                 transition-opacity`}
        title={`Remove ${name}`}
        aria-label={`Remove ${name} from semester`}
        disabled={semesterCompleted}
      >
        <X size={16} />
      </button>

      <div className="pl-6">
        {isCompactMode ? (
          <div className="flex justify-between items-center">
            <div className="text-sm font-medium text-gray-900">{id}</div>
            <div className="text-sm text-gray-600">{creditHours}cr</div>
          </div>
        ) : (
          <>
            <div className="text-base font-medium text-gray-900">{name}</div>
            <div className="text-sm text-gray-500">{id}</div>
            <div className="text-sm text-gray-600 mt-1">Credits: {creditHours}</div>
          </>
        )}
      </div>
{/* 
      Updated Drop Indicator
      {dropIndicator.isVisible && dropIndicator.edge === 'top' && (
        <DropIndicator edge="top" gap={`${gapSize}px`} />
      )}

      {dropIndicator.isVisible && dropIndicator.edge === 'bottom' && (
        <DropIndicator edge="bottom" gap={`${gapSize}px`} />
      )} */}
    </div>
  );
};

export default Course;

