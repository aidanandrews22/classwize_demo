// src/components/profile/ProfileManager.tsx
import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import firebaseService from '../../services/firebase';

const ProfileManager: React.FC = () => {
    const { user } = useUser();
    const [loading, setLoading] = useState(true);
    const [profileData, setProfileData] = useState({
        program: '',
        startYear: new Date().getFullYear(),
        anticipatedGraduation: new Date().getFullYear() + 4
    });

    useEffect(() => {
        const loadUserData = async () => {
            if (!user) return;

            try {
                const userData = await firebaseService.getUserData(user.id);
                if (userData) {
                    setProfileData({
                        program: userData.degree.program,
                        startYear: userData.degree.startYear,
                        anticipatedGraduation: userData.degree.anticipatedGraduation
                    });
                }
            } catch (error) {
                console.error('Error loading user data:', error);
            } finally {
                setLoading(false);
            }
        };

        loadUserData();
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        try {
            await firebaseService.updateUserDegree(user.id, {
                program: profileData.program,
                startYear: profileData.startYear,
                anticipatedGraduation: profileData.anticipatedGraduation
            });
        } catch (error) {
            console.error('Error updating profile:', error);
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <Card className="w-full max-w-2xl mx-auto mt-8">
            <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Degree Program</label>
                        <select
                            value={profileData.program}
                            onChange={(e) => setProfileData({ ...profileData, program: e.target.value })}
                            className="w-full p-2 border rounded-md"
                        >
                            <option value="Computer Science">Computer Science</option>
                            <option value="Computer Engineering">Computer Engineering</option>
                            <option value="Electrical Engineering">Electrical Engineering</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Start Year</label>
                        <input
                            type="number"
                            value={profileData.startYear}
                            onChange={(e) => setProfileData({ ...profileData, startYear: parseInt(e.target.value) })}
                            className="w-full p-2 border rounded-md"
                            min={2000}
                            max={2100}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Anticipated Graduation</label>
                        <input
                            type="number"
                            value={profileData.anticipatedGraduation}
                            onChange={(e) => setProfileData({
                                ...profileData,
                                anticipatedGraduation: parseInt(e.target.value)
                            })}
                            className="w-full p-2 border rounded-md"
                            min={profileData.startYear}
                            max={profileData.startYear + 6}
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Save Changes
                    </button>
                </form>
            </CardContent>
        </Card>
    );
};

export default ProfileManager;