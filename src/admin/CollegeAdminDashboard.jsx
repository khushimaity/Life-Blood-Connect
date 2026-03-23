import React, { useState, useEffect } from "react";
import CollegeAdminSidebar from "./CollegeAdminSidebar";
import { useAuth } from "../components/AuthContext";
import axios from 'axios';
import { toast } from 'react-toastify';

const CollegeAdminDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const profileResponse = await axios.get('http://localhost:5000/api/college-admin/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (profileResponse.data.success) {
        setProfile(profileResponse.data.collegeAdmin);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <CollegeAdminSidebar />
        <main className="flex-1 p-6 flex justify-center items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <CollegeAdminSidebar />

      <main className="flex-1 p-6">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-blue-800 mb-4">
              Welcome College Admin!
            </h1>
            {profile && (
              <p className="text-3xl md:text-4xl font-bold text-gray-800 mt-2">
                {profile.collegeName}
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CollegeAdminDashboard;