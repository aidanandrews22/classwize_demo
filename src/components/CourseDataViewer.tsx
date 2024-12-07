// src/components/CourseDataViewer.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Search, Plus, Check, Calendar, ChevronDown } from 'lucide-react';
import { Course, SubjectArea } from '../types/courseTypes';
import CourseMovementModal from './CourseMovementModal';
import DegreeRequirements from './DegreeRequirements';
import firebaseService from '../services/firebase';
import { searchCourses } from '../utils/searchUtils';

interface CourseDataViewerProps {
    userId: string;
    isModal?: boolean;
    onSelectCourse?: (course: Course) => void;
    onClose?: () => void;
    modalTitle?: string;
    targetSemesterId?: string;
}

const CourseDataViewer: React.FC<CourseDataViewerProps> = ({
    userId,
    isModal = false,
    onSelectCourse,
    onClose,
    modalTitle,
    targetSemesterId
}) => {
    const [courses, setCourses] = useState<{
        physics: Course[];
        cs: Course[];
        math: Course[];
    }>({
        physics: [],
        cs: [],
        math: []
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('courses');
    const [selectedSubject, setSelectedSubject] = useState<SubjectArea>('cs');
    const [isLoading, setIsLoading] = useState(true);
    const [semesters, setSemesters] = useState<Array<{ id: string; name: string; courseIds: string[] }>>([]);
    const [selectedCourseForMove, setSelectedCourseForMove] = useState<{
        course: Course;
        currentSemester: string | null;
    } | null>(null);
    const [showAddMenu, setShowAddMenu] = useState<{[key: string]: boolean}>({});
    const [addedCourses, setAddedCourses] = useState<{[key: string]: boolean}>({});

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                // Load courses for each subject and user schedule
                const [csCourses, physicsCourses, mathCourses, userSchedule] = await Promise.all([
                    firebaseService.getCoursesBySubject('cs'),
                    firebaseService.getCoursesBySubject('phys'),
                    firebaseService.getCoursesBySubject('math'),
                    firebaseService.getUserSchedule(userId)
                ]);

                setCourses({
                    cs: csCourses,
                    physics: physicsCourses,
                    math: mathCourses
                });

                if (userSchedule) {
                    setSemesters(userSchedule);
                }
            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [userId]);

    const handleAddCourse = async (courseId: string, destinationSemesterId: string) => {
        try {
            // Check if course exists in any semester
            let existingSemester = null;
            for (const semester of semesters) {
                if (semester.courseIds.includes(courseId)) {
                    existingSemester = semester;
                    break;
                }
            }

            if (existingSemester) {
                const course = getCurrentSubjectCourses().find(c => c.id === courseId);
                if (course) {
                    setSelectedCourseForMove({
                        course,
                        currentSemester: existingSemester.id
                    });
                }
                return;
            }

            // Update Firebase and local state
            const semester = semesters.find(s => s.id === destinationSemesterId);
            if (!semester) {
                throw new Error('Semester not found');
            }

            const updatedCourseIds = [...semester.courseIds, courseId];
            await firebaseService.updateSemesterCourses(userId, destinationSemesterId, updatedCourseIds);

            setSemesters(semesters.map(s =>
                s.id === destinationSemesterId
                    ? { ...s, courseIds: updatedCourseIds }
                    : s
            ));

            // Add success state
            setAddedCourses(prev => ({ ...prev, [courseId]: true }));
            // Reset success state after 3 seconds
            setTimeout(() => {
                setAddedCourses(prev => ({ ...prev, [courseId]: false }));
            }, 30000);
        } catch (error) {
            console.error('Error adding course:', error);
            throw error;
        } finally {
            setShowAddMenu({ ...showAddMenu, [courseId]: false });
        }
    };

    const handleMoveCourse = async (courseId: string, destinationSemesterId: string) => {
        if (!selectedCourseForMove?.currentSemester) return;

        try {
            const sourceSemesterId = selectedCourseForMove.currentSemester;
            const sourceSemester = semesters.find(s => s.id === sourceSemesterId);
            const destSemester = semesters.find(s => s.id === destinationSemesterId);

            if (!sourceSemester || !destSemester) return;

            const updatedSourceCourseIds = sourceSemester.courseIds.filter(id => id !== courseId);
            const updatedDestCourseIds = [...destSemester.courseIds, courseId];

            // Update Firebase
            await Promise.all([
                firebaseService.updateSemesterCourses(userId, sourceSemesterId, updatedSourceCourseIds),
                firebaseService.updateSemesterCourses(userId, destinationSemesterId, updatedDestCourseIds)
            ]);

            // Update local state
            setSemesters(semesters.map(semester => {
                if (semester.id === sourceSemesterId) {
                    return { ...semester, courseIds: updatedSourceCourseIds };
                }
                if (semester.id === destinationSemesterId) {
                    return { ...semester, courseIds: updatedDestCourseIds };
                }
                return semester;
            }));
        } catch (error) {
            console.error('Error moving course:', error);
        } finally {
            setSelectedCourseForMove(null);
        }
    };

    const handleRemoveCourse = async (courseId: string, semesterId: string) => {
        try {
            const semester = semesters.find(s => s.id === semesterId);
            if (!semester) return;

            const updatedCourseIds = semester.courseIds.filter(id => id !== courseId);
            await firebaseService.updateSemesterCourses(userId, semesterId, updatedCourseIds);

            setSemesters(semesters.map(s =>
                s.id === semesterId
                    ? { ...s, courseIds: updatedCourseIds }
                    : s
            ));
        } catch (error) {
            console.error('Error removing course:', error);
        }
    };

    const getCurrentSubjectCourses = () => {
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

    const isCourseInSchedule = (courseId: string, semesters: Array<{ id: string; name: string; courseIds: string[] }>) => {
        return semesters.some(semester => semester.courseIds.includes(courseId));
    };

    const filteredCourses = searchCourses(getCurrentSubjectCourses(), searchTerm).map(course => ({
        ...course,
        isInSchedule: isCourseInSchedule(course.id, semesters)
    }));

    const content = (
        <div className={`${isModal ? 'p-4' : 'container mx-auto p-4'}`}>
            {isModal ? (
                // Modal header
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">{modalTitle}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ✕
                    </button>
                </div>
            ) : null}

            <Tabs defaultValue="courses" className="w-full">
                {!isModal && (
                    <TabsList className="mb-4">
                        <TabsTrigger value="courses" onClick={() => setActiveTab('courses')}>
                            Courses
                        </TabsTrigger>
                        <TabsTrigger value="requirements" onClick={() => setActiveTab('requirements')}>
                            Degree Requirements
                        </TabsTrigger>
                    </TabsList>
                )}

                <TabsContent value="courses" className="mt-4">
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search courses..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg"
                                />
                            </div>
                            <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-white">
                                {['cs', 'math', 'physics'].map((subject) => (
                                    <button
                                        key={subject}
                                        onClick={() => setSelectedSubject(subject as SubjectArea)}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                            selectedSubject === subject
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                    >
                                        {subject.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className={`grid gap-4 ${isModal ? 'grid-cols-1' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
                            {filteredCourses.map((course: Course & { isInSchedule: boolean }) => (
                                <Card 
                                    key={course.id} 
                                    className={`overflow-hidden ${isModal ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                                    onClick={() => isModal && onSelectCourse?.(course)}
                                >
                                    <CardHeader className="bg-blue-50">
                                        <div className="flex justify-between items-start">
                                            <CardTitle className="text-lg">
                                                {course.classNumber}: {course.name}
                                            </CardTitle>
                                            <div className="relative flex items-center gap-2">
                                                {(addedCourses[course.id] || course.isInSchedule) ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-green-600 flex items-center gap-1">
                                                            <Check size={20} className="animate-in fade-in" />
                                                            <span className="text-sm">Added!</span>
                                                        </span>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const currentSemester = semesters.find(
                                                                    sem => sem.courseIds.includes(course.id)
                                                                )?.id || null;
                                                                setSelectedCourseForMove({
                                                                    course,
                                                                    currentSemester
                                                                });
                                                            }}
                                                            className="px-3 py-1 text-sm rounded-md bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                                                        >
                                                            Move
                                                        </button>
                                                        <button
                                                            onClick={() => {/* Add navigation to schedule view */}}
                                                            className="p-2 rounded-full hover:bg-blue-200 text-blue-600 transition-colors"
                                                            title="View Schedule"
                                                        >
                                                            <Calendar size={20} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="relative">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setShowAddMenu({
                                                                    ...showAddMenu,
                                                                    [course.id]: !showAddMenu[course.id]
                                                                });
                                                            }}
                                                            className="p-2 rounded-full hover:bg-blue-200 text-blue-600 transition-colors flex items-center gap-1"
                                                        >
                                                            <Plus size={20} />
                                                        </button>
                                                        {showAddMenu[course.id] && !isModal && (
                                                            <>
                                                                <div 
                                                                    className="fixed inset-0" 
                                                                    onClick={() => setShowAddMenu({...showAddMenu, [course.id]: false})}
                                                                />
                                                                <div className="absolute right-0 top-full mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                                                                    <div className="py-1">
                                                                        <div className="px-4 py-2 text-sm font-medium text-gray-700 border-b">
                                                                            Choose Semester
                                                                        </div>
                                                                        {semesters.map((semester) => (
                                                                            <button
                                                                                key={semester.id}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleAddCourse(course.id, semester.id);
                                                                                }}
                                                                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                                                            >
                                                                                {semester.name}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-sm text-gray-600">{course.creditHours} Credits</div>
                                    </CardHeader>
                                    <CardContent className="pt-4">
                                        <p className="text-sm text-gray-700 mb-2">{course.description}</p>
                                        <div className="mt-2">
                                            <span className="text-sm font-semibold">
                                                Credit Hours: {course.creditHours}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </TabsContent>

                {!isModal && (
                    <TabsContent value="requirements">
                        <DegreeRequirements userId={userId} />
                    </TabsContent>
                )}
            </Tabs>

            {selectedCourseForMove && (
                <CourseMovementModal
                    course={selectedCourseForMove.course}
                    currentSemester={selectedCourseForMove.currentSemester || ''}
                    semesters={semesters}
                    onMove={handleMoveCourse}
                    onCancel={() => setSelectedCourseForMove(null)}
                />
            )}
        </div>
    );

    if (isModal) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    {content}
                </div>
            </div>
        );
    }

    return content;
};

export default CourseDataViewer;