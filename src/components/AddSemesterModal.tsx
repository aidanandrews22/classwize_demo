import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import firebaseService from '../services/firebase';

interface AddSemesterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddSemester: (semesterData: { id: string; name: string; courseIds: string[] }) => void;
}

const AddSemesterModal: React.FC<AddSemesterModalProps> = ({ isOpen, onClose, onAddSemester }) => {
    const { user } = useUser();
    const [startYear, setStartYear] = useState(new Date().getFullYear());
    const [endYear, setEndYear] = useState(startYear + 4);
    const [selectedYear, setSelectedYear] = useState(startYear);
    const [selectedTerm, setSelectedTerm] = useState('Fall');

    useEffect(() => {
        const loadUserDegreeInfo = async () => {
            if (!user?.id) return;

            const userData = await firebaseService.getUserData(user.id);
            if (userData) {
                setStartYear(userData.degree.startYear);
                setEndYear(userData.degree.anticipatedGraduation);
                setSelectedYear(userData.degree.startYear);
            }
        };

        loadUserDegreeInfo();
    }, [user]);

    if (!isOpen) return null;

    const terms = ['Fall', 'Winter', 'Spring', 'Summer'];
    const years = Array.from(
        { length: endYear - startYear + 1 },
        (_, i) => startYear + i
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const id = `${selectedTerm.toUpperCase()}${selectedYear}`;
        const name = `${selectedTerm} ${selectedYear}`;
        onAddSemester({ id, name, courseIds: [] });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-semibold mb-4">Add New Semester</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Term
                        </label>
                        <select
                            value={selectedTerm}
                            onChange={(e) => setSelectedTerm(e.target.value)}
                            className="w-full p-2 border rounded-md"
                        >
                            {terms.map((term) => (
                                <option key={term} value={term}>
                                    {term}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Year
                        </label>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="w-full p-2 border rounded-md"
                        >
                            {years.map((year) => (
                                <option key={year} value={year}>
                                    {year}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Add Semester
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddSemesterModal;