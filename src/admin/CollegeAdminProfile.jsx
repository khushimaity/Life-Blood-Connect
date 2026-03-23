import React, { useState, useEffect } from "react";
import CollegeAdminSidebar from "./CollegeAdminSidebar";
import { useAuth } from "../components/AuthContext";
import { FaUser, FaEnvelope, FaPhone, FaBuilding, FaMapMarkerAlt, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CollegeAdminProfile = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({});
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('token');
            
            console.log('🔍 Fetching profile with token:', token);
            
            if (!token) {
                console.log('❌ No token found');
                setError('No authentication token found. Please login again.');
                return;
            }

            const response = await axios.get('http://localhost:5000/api/college-admin/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            console.log('📦 Response data:', response.data);
            
            if (response.data.success) {
                if (response.data.collegeAdmin) {
                    console.log('✅ Profile data received:', response.data.collegeAdmin);
                    setProfile(response.data.collegeAdmin);
                    setFormData(response.data.collegeAdmin);
                } else {
                    console.log('⚠️ collegeAdmin is null/undefined in response');
                    setError('Profile data is empty');
                }
            } else {
                console.log('⚠️ success is false:', response.data.message);
                setError(response.data.message || 'Failed to load profile');
            }
        } catch (error) {
            console.error('❌ Error fetching profile:', error);
            console.error('❌ Error response:', error.response?.data);
            console.error('❌ Error status:', error.response?.status);
            
            if (error.response?.status === 401) {
                setError('Session expired. Please login again.');
            } else if (error.response?.status === 404) {
                setError('Profile not found. Please complete your registration.');
            } else {
                setError(error.response?.data?.message || 'Failed to load profile');
            }
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUpdating(true);
        
        try {
            const token = localStorage.getItem('token');
            const response = await axios.put('http://localhost:5000/api/college-admin/profile', 
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            console.log('📝 Update response:', response.data);
            
            if (response.data.success) {
                setProfile(response.data.collegeAdmin);
                setEditMode(false);
                toast.success('Profile updated successfully!');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Failed to update profile');
        } finally {
            setUpdating(false);
        }
    };

    const getFullAddress = () => {
        if (!profile?.location) return 'Not specified';
        const addr = profile.location;
        const parts = [];
        if (addr.address) parts.push(addr.address);
        if (addr.city) parts.push(addr.city);
        if (addr.district) parts.push(addr.district);
        if (addr.state) parts.push(addr.state);
        if (addr.pincode) parts.push(`- ${addr.pincode}`);
        return parts.join(', ') || 'Not specified';
    };

    const handleRetry = () => {
        fetchProfile();
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

    if (error || !profile) {
        return (
            <div className="flex min-h-screen">
                <CollegeAdminSidebar />
                <main className="flex-1 p-6">
                    <div className="max-w-4xl mx-auto p-6">
                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg shadow-md">
                            <h2 className="text-xl font-bold text-yellow-800 mb-3">Profile Issue Detected</h2>
                            <p className="text-yellow-700 mb-4">
                                {error || 'Profile not found. Please complete your registration.'}
                            </p>
                            <div className="flex gap-4">
                                <button
                                    onClick={handleRetry}
                                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                                >
                                    Retry
                                </button>
                                <button
                                    onClick={() => window.location.href = '/college-admin/dashboard'}
                                    className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition"
                                >
                                    Go to Dashboard
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            <CollegeAdminSidebar />
            
            <main className="flex-1 p-6">
                <ToastContainer position="top-right" autoClose={3000} />
                <div className="max-w-6xl mx-auto">
                    {/* Profile Header Card */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-t-xl p-8 shadow-lg">
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            <div className="bg-white p-4 rounded-full shadow-lg">
                                <FaBuilding className="text-blue-600 text-5xl" />
                            </div>
                            <div className="text-center md:text-left flex-1">
                                <h1 className="text-3xl md:text-4xl font-bold">{profile.collegeName}</h1>
                                <div className="flex flex-col md:flex-row gap-4 mt-2 text-blue-100">
                                    <p className="flex items-center gap-2">
                                        <FaUser /> {profile.adminName}
                                    </p>
                                    <p className="flex items-center gap-2">
                                        <FaEnvelope /> {profile.email || user?.email}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Edit Button */}
                    {!editMode && (
                        <div className="bg-white px-8 py-4 rounded-xl shadow-md mb-6 flex justify-end">
                            <button
                                onClick={() => setEditMode(true)}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                            >
                                <FaEdit /> Edit Profile
                            </button>
                        </div>
                    )}

                    {/* Profile Content */}
                    {editMode ? (
                        // Edit Mode Form
                        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-md">
                            <h2 className="text-2xl font-bold mb-6 text-blue-600 border-b pb-2">Edit Profile</h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* College Information */}
                                <div className="col-span-2">
                                    <h3 className="font-semibold text-lg text-gray-700 mb-3 flex items-center gap-2">
                                        <FaBuilding className="text-blue-500" /> College Details
                                    </h3>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">College Name *</label>
                                    <input
                                        type="text"
                                        name="collegeName"
                                        value={formData.collegeName || ''}
                                        onChange={handleInputChange}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-300"
                                        required
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Admin Name *</label>
                                    <input
                                        type="text"
                                        name="adminName"
                                        value={formData.adminName || ''}
                                        onChange={handleInputChange}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-300"
                                        required
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email || ''}
                                        onChange={handleInputChange}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-300"
                                    />
                                </div>

                                {/* Location */}
                                <div className="col-span-2 mt-4">
                                    <h3 className="font-semibold text-lg text-gray-700 mb-3 flex items-center gap-2">
                                        <FaMapMarkerAlt className="text-blue-500" /> Location
                                    </h3>
                                </div>
                                
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                    <input
                                        type="text"
                                        name="location.address"
                                        value={formData.location?.address || ''}
                                        onChange={handleInputChange}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-300"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                    <input
                                        type="text"
                                        name="location.city"
                                        value={formData.location?.city || ''}
                                        onChange={handleInputChange}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-300"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                                    <input
                                        type="text"
                                        name="location.district"
                                        value={formData.location?.district || ''}
                                        onChange={handleInputChange}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-300"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                                    <input
                                        type="text"
                                        name="location.state"
                                        value={formData.location?.state || ''}
                                        onChange={handleInputChange}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-300"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                                    <input
                                        type="text"
                                        name="location.pincode"
                                        value={formData.location?.pincode || ''}
                                        onChange={handleInputChange}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-300"
                                        pattern="[0-9]{6}"
                                    />
                                </div>
                            </div>

                            {/* Form Buttons */}
                            <div className="flex gap-4 mt-8">
                                <button
                                    type="submit"
                                    disabled={updating}
                                    className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-50"
                                >
                                    {updating ? 'Saving...' : <><FaSave /> Save Changes</>}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditMode(false);
                                        setFormData(profile);
                                    }}
                                    className="bg-gray-500 text-white px-8 py-3 rounded-lg hover:bg-gray-600 transition flex items-center gap-2"
                                >
                                    <FaTimes /> Cancel
                                </button>
                            </div>
                        </form>
                    ) : (
                        // View Mode
                        <div className="bg-white p-8 rounded-xl shadow-md">
                            {/* College Info Card */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-blue-50 p-6 rounded-lg">
                                    <h3 className="font-semibold text-lg mb-4 text-blue-600 flex items-center gap-2">
                                        <FaBuilding /> College Details
                                    </h3>
                                    <div className="space-y-3">
                                        <p><span className="font-medium">College Name:</span> {profile.collegeName}</p>
                                        <p><span className="font-medium">Admin Name:</span> {profile.adminName}</p>
                                        <p><span className="font-medium">Email:</span> {profile.email || user?.email}</p>
                                    </div>
                                </div>

                                <div className="bg-blue-50 p-6 rounded-lg">
                                    <h3 className="font-semibold text-lg mb-4 text-blue-600 flex items-center gap-2">
                                        <FaMapMarkerAlt /> Location
                                    </h3>
                                    <div className="space-y-3">
                                        <p><span className="font-medium">Full Address:</span> {getFullAddress()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default CollegeAdminProfile;