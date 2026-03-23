import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import DonorDashboardPage from './DonorDashboardPage';
import { FaUser, FaEnvelope, FaPhone, FaTint, FaGraduationCap, FaMapMarkerAlt, FaCalendarAlt, FaHeart, FaShieldAlt, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import { donorAPI } from "../api/services";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const DonorProfile = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({});
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            
            const response = await donorAPI.getProfile();
            
            if (response.data.success) {
                setProfile(response.data.donor);
                setFormData(response.data.donor);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        // Handle nested objects (like collegeDetails.field)
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
            const response = await donorAPI.updateProfile(formData);
            
            if (response.data.success) {
                setProfile(response.data.donor);
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

    const formatDate = (dateString) => {
        if (!dateString) return 'Not available';
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <DonorDashboardPage>
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-600"></div>
                </div>
            </DonorDashboardPage>
        );
    }

    if (!profile) {
        return (
            <DonorDashboardPage>
                <div className="max-w-4xl mx-auto p-6">
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-yellow-700">
                                    Profile not found. Please complete your registration.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </DonorDashboardPage>
        );
    }

    return (
        <DonorDashboardPage>
            <ToastContainer position="top-right" autoClose={3000} />
            <div className="max-w-6xl mx-auto p-6">
                {/* Profile Header Card */}
                <div className="bg-gradient-to-r from-red-600 to-red-800 text-white rounded-t-xl p-8 shadow-lg">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="bg-white p-4 rounded-full shadow-lg">
                            <FaUser className="text-red-600 text-5xl" />
                        </div>
                        <div className="text-center md:text-left">
                            <h1 className="text-3xl md:text-4xl font-bold">{user?.name}</h1>
                            <div className="flex flex-col md:flex-row gap-4 mt-2 text-red-100">
                                <p className="flex items-center gap-2">
                                    <FaEnvelope /> {user?.email}
                                </p>
                                <p className="flex items-center gap-2">
                                    <FaPhone /> {user?.phone}
                                </p>
                            </div>
                            <div className="mt-4">
                                <span className="bg-white text-red-600 px-4 py-2 rounded-full font-bold text-lg">
                                    Blood Group: {user?.bloodGroup || 'Not specified'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Edit Button */}
                {!editMode && (
                    <div className="bg-white px-8 py-4 rounded-b-xl shadow-md mb-6 flex justify-end">
                        <button
                            onClick={() => setEditMode(true)}
                            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                        >
                            <FaEdit /> Edit Profile
                        </button>
                    </div>
                )}

                {/* Profile Content */}
                {editMode ? (
                    // Edit Mode Form
                    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-md">
                        <h2 className="text-2xl font-bold mb-6 text-red-600 border-b pb-2">Edit Profile</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Personal Information */}
                            <div className="col-span-2">
                                <h3 className="font-semibold text-lg text-gray-700 mb-3 flex items-center gap-2">
                                    <FaHeart className="text-red-500" /> Personal Information
                                </h3>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Age *</label>
                                <input
                                    type="number"
                                    name="age"
                                    value={formData.age || ''}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-300 focus:border-red-500"
                                    min="18"
                                    max="65"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                                <select
                                    name="gender"
                                    value={formData.gender || ''}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-300 focus:border-red-500"
                                    required
                                >
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            {/* Guardian Information */}
                            <div className="col-span-2 mt-4">
                                <h3 className="font-semibold text-lg text-gray-700 mb-3 flex items-center gap-2">
                                    <FaShieldAlt className="text-red-500" /> Guardian Information
                                </h3>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Guardian Name *</label>
                                <input
                                    type="text"
                                    name="guardianName"
                                    value={formData.guardianName || ''}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-300"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Guardian Phone *</label>
                                <input
                                    type="tel"
                                    name="guardianPhone"
                                    value={formData.guardianPhone || ''}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-300"
                                    pattern="[0-9]{10}"
                                    required
                                />
                            </div>
                            
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Relationship *</label>
                                <input
                                    type="text"
                                    name="guardianRelation"
                                    value={formData.guardianRelation || ''}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-300"
                                    required
                                />
                            </div>

                            {/* College Details */}
                            <div className="col-span-2 mt-4">
                                <h3 className="font-semibold text-lg text-gray-700 mb-3 flex items-center gap-2">
                                    <FaGraduationCap className="text-red-500" /> College Details
                                </h3>
                            </div>
                            
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">College Name *</label>
                                <input
                                    type="text"
                                    name="collegeDetails.collegeName"
                                    value={formData.collegeDetails?.collegeName || ''}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-300"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                                <input
                                    type="text"
                                    name="collegeDetails.department"
                                    value={formData.collegeDetails?.department || ''}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-300"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Admission Number *</label>
                                <input
                                    type="text"
                                    name="collegeDetails.admissionNumber"
                                    value={formData.collegeDetails?.admissionNumber || ''}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-300"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                                <input
                                    type="text"
                                    name="collegeDetails.state"
                                    value={formData.collegeDetails?.state || ''}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-300"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                                <input
                                    type="text"
                                    name="collegeDetails.district"
                                    value={formData.collegeDetails?.district || ''}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-300"
                                />
                            </div>

                            {/* Address */}
                            <div className="col-span-2 mt-4">
                                <h3 className="font-semibold text-lg text-gray-700 mb-3 flex items-center gap-2">
                                    <FaMapMarkerAlt className="text-red-500" /> Address
                                </h3>
                            </div>
                            
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Street</label>
                                <input
                                    type="text"
                                    name="address.street"
                                    value={formData.address?.street || ''}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-300"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                <input
                                    type="text"
                                    name="address.city"
                                    value={formData.address?.city || ''}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-300"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                                <input
                                    type="text"
                                    name="address.district"
                                    value={formData.address?.district || ''}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-300"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                                <input
                                    type="text"
                                    name="address.state"
                                    value={formData.address?.state || ''}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-300"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                                <input
                                    type="text"
                                    name="address.pincode"
                                    value={formData.address?.pincode || ''}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-300"
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
                        {/* Personal Info Card */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-red-50 p-6 rounded-lg">
                                <h3 className="font-semibold text-lg mb-4 text-red-600 flex items-center gap-2">
                                    <FaHeart /> Personal Information
                                </h3>
                                <div className="space-y-3">
                                    <p className="flex justify-between border-b pb-2">
                                        <span className="text-gray-600">Age:</span>
                                        <span className="font-medium">{profile.age} years</span>
                                    </p>
                                    <p className="flex justify-between border-b pb-2">
                                        <span className="text-gray-600">Gender:</span>
                                        <span className="font-medium">{profile.gender}</span>
                                    </p>
                                    <p className="flex justify-between border-b pb-2">
                                        <span className="text-gray-600">Blood Group:</span>
                                        <span className="font-bold text-red-600">{user?.bloodGroup}</span>
                                    </p>
                                </div>
                            </div>

                            <div className="bg-red-50 p-6 rounded-lg">
                                <h3 className="font-semibold text-lg mb-4 text-red-600 flex items-center gap-2">
                                    <FaShieldAlt /> Guardian Information
                                </h3>
                                <div className="space-y-3">
                                    <p className="flex justify-between border-b pb-2">
                                        <span className="text-gray-600">Name:</span>
                                        <span className="font-medium">{profile.guardianName}</span>
                                    </p>
                                    <p className="flex justify-between border-b pb-2">
                                        <span className="text-gray-600">Phone:</span>
                                        <span className="font-medium">{profile.guardianPhone}</span>
                                    </p>
                                    <p className="flex justify-between border-b pb-2">
                                        <span className="text-gray-600">Relation:</span>
                                        <span className="font-medium">{profile.guardianRelation}</span>
                                    </p>
                                </div>
                            </div>

                            <div className="bg-red-50 p-6 rounded-lg">
                                <h3 className="font-semibold text-lg mb-4 text-red-600 flex items-center gap-2">
                                    <FaGraduationCap /> College Details
                                </h3>
                                <div className="space-y-3">
                                    <p className="flex justify-between border-b pb-2">
                                        <span className="text-gray-600">College:</span>
                                        <span className="font-medium">{profile.collegeDetails?.collegeName}</span>
                                    </p>
                                    <p className="flex justify-between border-b pb-2">
                                        <span className="text-gray-600">Department:</span>
                                        <span className="font-medium">{profile.collegeDetails?.department}</span>
                                    </p>
                                    <p className="flex justify-between border-b pb-2">
                                        <span className="text-gray-600">Admission No:</span>
                                        <span className="font-medium">{profile.collegeDetails?.admissionNumber}</span>
                                    </p>
                                    <p className="flex justify-between border-b pb-2">
                                        <span className="text-gray-600">Location:</span>
                                        <span className="font-medium">
                                            {profile.collegeDetails?.district}, {profile.collegeDetails?.state}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            <div className="bg-red-50 p-6 rounded-lg">
                                <h3 className="font-semibold text-lg mb-4 text-red-600 flex items-center gap-2">
                                    <FaMapMarkerAlt /> Address
                                </h3>
                                <div className="space-y-3">
                                    {profile.address?.street && (
                                        <p className="flex justify-between border-b pb-2">
                                            <span className="text-gray-600">Street:</span>
                                            <span className="font-medium">{profile.address.street}</span>
                                        </p>
                                    )}
                                    <p className="flex justify-between border-b pb-2">
                                        <span className="text-gray-600">City:</span>
                                        <span className="font-medium">{profile.address?.city || 'Not specified'}</span>
                                    </p>
                                    <p className="flex justify-between border-b pb-2">
                                        <span className="text-gray-600">District:</span>
                                        <span className="font-medium">{profile.address?.district || 'Not specified'}</span>
                                    </p>
                                    <p className="flex justify-between border-b pb-2">
                                        <span className="text-gray-600">State:</span>
                                        <span className="font-medium">{profile.address?.state || 'Not specified'}</span>
                                    </p>
                                    {profile.address?.pincode && (
                                        <p className="flex justify-between border-b pb-2">
                                            <span className="text-gray-600">Pincode:</span>
                                            <span className="font-medium">{profile.address.pincode}</span>
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Donation Stats */}
                        <div className="mt-8 p-6 bg-gradient-to-r from-red-50 to-red-100 rounded-lg">
                            <h3 className="font-semibold text-lg mb-4 text-red-600">Donation Statistics</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-white p-4 rounded-lg text-center">
                                    <div className="text-3xl font-bold text-red-600">{profile.totalDonations || 0}</div>
                                    <div className="text-sm text-gray-600">Total Donations</div>
                                </div>
                                <div className="bg-white p-4 rounded-lg text-center">
                                    <div className="text-3xl font-bold text-red-600">{profile.totalUnitsDonated || 0}</div>
                                    <div className="text-sm text-gray-600">Units Donated</div>
                                </div>
                                <div className="bg-white p-4 rounded-lg text-center">
                                    <div className="text-3xl font-bold text-red-600">
                                        {profile.lastDonationDate ? formatDate(profile.lastDonationDate) : 'Never'}
                                    </div>
                                    <div className="text-sm text-gray-600">Last Donation</div>
                                </div>
                                <div className="bg-white p-4 rounded-lg text-center">
                                    <div className={`text-3xl font-bold ${profile.isAvailable ? 'text-green-600' : 'text-gray-400'}`}>
                                        {profile.isAvailable ? '✓' : '✗'}
                                    </div>
                                    <div className="text-sm text-gray-600">Available</div>
                                </div>
                            </div>
                            
                            {/* Next Eligibility */}
                            {profile.nextEligibleDate && (
                                <div className={`mt-4 p-4 rounded-lg ${
                                    profile.isEligibleToDonate?.() 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                    <p className="text-center font-medium">
                                        {profile.isEligibleToDonate?.() 
                                            ? '✅ You are eligible to donate now!' 
                                            : `⏳ Next eligible to donate: ${formatDate(profile.nextEligibleDate)}`}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </DonorDashboardPage>
    );
};

export default DonorProfile;