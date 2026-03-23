import React, { useState, useEffect } from "react";
import AdminDashboardPage from "./AdminDashboardPage";
import { useAuth } from "../components/AuthContext";
import { FaUser, FaEnvelope, FaPhone, FaBuilding, FaMapMarkerAlt, FaClock, FaEdit, FaSave, FaTimes, FaCheckCircle, FaStar, FaUsers, FaTint, FaClipboardList } from 'react-icons/fa';
import { adminAPI } from "../api/services";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AdminProfile = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({});
    const [updating, setUpdating] = useState(false);
    const [stats, setStats] = useState({
        totalRequests: 0,
        fulfilledRequests: 0,
        activeDonors: 0,
        totalCollections: 0
    });

    useEffect(() => {
        fetchProfile();
        fetchStats();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            
            const response = await adminAPI.getAdminProfile();
            
            if (response.data.success) {
                setProfile(response.data.admin);
                setFormData(response.data.admin);
            }
        } catch (error) {
            console.error('Error fetching admin profile:', error);
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await adminAPI.getDashboard();
            
            if (response.data.success) {
                setStats(response.data.dashboard.stats);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        // Handle nested objects
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
            const response = await adminAPI.updateProfile(formData);
            
            if (response.data.success) {
                setProfile(response.data.admin);
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

    const getOperatingHours = (hours) => {
        if (!hours) return 'Not specified';
        if (hours.emergency24x7) return '24/7 Emergency Services';
        
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const openDays = days.filter(day => hours[day]?.open && hours[day]?.close);
        
        if (openDays.length === 0) return 'Hours not specified';
        if (openDays.length === 7) return 'Open daily';
        
        return `${openDays.length} days a week`;
    };

    if (loading) {
        return (
            <AdminDashboardPage>
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-600"></div>
                </div>
            </AdminDashboardPage>
        );
    }

    if (!profile) {
        return (
            <AdminDashboardPage>
                <div className="max-w-4xl mx-auto p-6">
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                        <p className="text-yellow-700">Profile not found. Please complete your registration.</p>
                    </div>
                </div>
            </AdminDashboardPage>
        );
    }

    return (
        <AdminDashboardPage>
            <ToastContainer position="top-right" autoClose={3000} />
            <div className="max-w-6xl mx-auto p-6">
                {/* Profile Header Card */}
                <div className="bg-gradient-to-r from-red-600 to-red-800 text-white rounded-t-xl p-8 shadow-lg">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="bg-white p-4 rounded-full shadow-lg">
                            <FaBuilding className="text-red-600 text-5xl" />
                        </div>
                        <div className="text-center md:text-left flex-1">
                            <h1 className="text-3xl md:text-4xl font-bold">{profile.organizationName}</h1>
                            <div className="flex flex-col md:flex-row gap-4 mt-2 text-red-100">
                                <p className="flex items-center gap-2">
                                    <FaUser /> {profile.adminName}
                                </p>
                                <p className="flex items-center gap-2">
                                    <FaEnvelope /> {user?.email}
                                </p>
                                <p className="flex items-center gap-2">
                                    <FaPhone /> {user?.phone}
                                </p>
                            </div>
                            <div className="mt-4 flex items-center gap-3">
                                <span className="bg-white text-red-600 px-4 py-2 rounded-full font-bold text-sm">
                                    {profile.centerType}
                                </span>
                                {profile.isVerified && (
                                    <span className="bg-green-500 text-white px-4 py-2 rounded-full font-bold text-sm flex items-center gap-1">
                                        <FaCheckCircle /> Verified
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 my-6">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-6">
                        <div className="text-3xl font-bold mb-2">{stats.totalRequests || 0}</div>
                        <div className="text-sm opacity-90">Total Requests</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-lg p-6">
                        <div className="text-3xl font-bold mb-2">{stats.fulfilledRequests || 0}</div>
                        <div className="text-sm opacity-90">Fulfilled</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl shadow-lg p-6">
                        <div className="text-3xl font-bold mb-2">{stats.activeDonors || 0}</div>
                        <div className="text-sm opacity-90">Active Donors</div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl shadow-lg p-6">
                        <div className="text-3xl font-bold mb-2">{stats.fulfillmentRate || 0}%</div>
                        <div className="text-sm opacity-90">Success Rate</div>
                    </div>
                </div>

                {/* Edit Button */}
                {!editMode && (
                    <div className="bg-white px-8 py-4 rounded-xl shadow-md mb-6 flex justify-end">
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
                            {/* Organization Information */}
                            <div className="col-span-2">
                                <h3 className="font-semibold text-lg text-gray-700 mb-3 flex items-center gap-2">
                                    <FaBuilding className="text-red-500" /> Organization Details
                                </h3>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name *</label>
                                <input
                                    type="text"
                                    name="organizationName"
                                    value={formData.organizationName || ''}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-300"
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
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-300"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Center Type</label>
                                <select
                                    name="centerType"
                                    value={formData.centerType || ''}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-300"
                                >
                                    <option value="Hospital">Hospital</option>
                                    <option value="Blood Bank">Blood Bank</option>
                                    <option value="Medical College">Medical College</option>
                                    <option value="Clinic">Clinic</option>
                                    <option value="NGO">NGO</option>
                                </select>
                            </div>

                            {/* Location */}
                            <div className="col-span-2 mt-4">
                                <h3 className="font-semibold text-lg text-gray-700 mb-3 flex items-center gap-2">
                                    <FaMapMarkerAlt className="text-red-500" /> Location
                                </h3>
                            </div>
                            
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                <input
                                    type="text"
                                    name="location.address"
                                    value={formData.location?.address || ''}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-300"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                <input
                                    type="text"
                                    name="location.city"
                                    value={formData.location?.city || ''}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-300"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                                <input
                                    type="text"
                                    name="location.district"
                                    value={formData.location?.district || ''}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-300"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                                <input
                                    type="text"
                                    name="location.state"
                                    value={formData.location?.state || ''}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-300"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                                <input
                                    type="text"
                                    name="location.pincode"
                                    value={formData.location?.pincode || ''}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-300"
                                    pattern="[0-9]{6}"
                                />
                            </div>

                            {/* Contact Information */}
                            <div className="col-span-2 mt-4">
                                <h3 className="font-semibold text-lg text-gray-700 mb-3 flex items-center gap-2">
                                    <FaPhone className="text-red-500" /> Contact Information
                                </h3>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Phone</label>
                                <input
                                    type="tel"
                                    name="contactInfo.emergencyPhone"
                                    value={formData.contactInfo?.emergencyPhone || ''}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-300"
                                    pattern="[0-9]{10}"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                                <input
                                    type="url"
                                    name="contactInfo.website"
                                    value={formData.contactInfo?.website || ''}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-300"
                                />
                            </div>

                            {/* Operating Hours */}
                            <div className="col-span-2 mt-4">
                                <h3 className="font-semibold text-lg text-gray-700 mb-3 flex items-center gap-2">
                                    <FaClock className="text-red-500" /> Operating Hours
                                </h3>
                            </div>
                            
                            <div className="col-span-2">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name="operatingHours.emergency24x7"
                                        checked={formData.operatingHours?.emergency24x7 || false}
                                        onChange={(e) => {
                                            setFormData(prev => ({
                                                ...prev,
                                                operatingHours: {
                                                    ...prev.operatingHours,
                                                    emergency24x7: e.target.checked
                                                }
                                            }));
                                        }}
                                        className="h-4 w-4"
                                    />
                                    <span className="text-sm font-medium">24/7 Emergency Services</span>
                                </label>
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
                        {/* Organization Info Card */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-red-50 p-6 rounded-lg">
                                <h3 className="font-semibold text-lg mb-4 text-red-600 flex items-center gap-2">
                                    <FaBuilding /> Organization Details
                                </h3>
                                <div className="space-y-3">
                                    <p className="flex justify-between border-b pb-2">
                                        <span className="text-gray-600">Organization:</span>
                                        <span className="font-medium">{profile.organizationName}</span>
                                    </p>
                                    <p className="flex justify-between border-b pb-2">
                                        <span className="text-gray-600">Admin Name:</span>
                                        <span className="font-medium">{profile.adminName}</span>
                                    </p>
                                    <p className="flex justify-between border-b pb-2">
                                        <span className="text-gray-600">Center Type:</span>
                                        <span className="font-medium">{profile.centerType}</span>
                                    </p>
                                    <p className="flex justify-between border-b pb-2">
                                        <span className="text-gray-600">Status:</span>
                                        <span className={`font-medium ${profile.isVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                                            {profile.isVerified ? 'Verified' : 'Pending Verification'}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            <div className="bg-red-50 p-6 rounded-lg">
                                <h3 className="font-semibold text-lg mb-4 text-red-600 flex items-center gap-2">
                                    <FaMapMarkerAlt /> Location
                                </h3>
                                <div className="space-y-3">
                                    {profile.location?.address && (
                                        <p className="flex justify-between border-b pb-2">
                                            <span className="text-gray-600">Address:</span>
                                            <span className="font-medium">{profile.location.address}</span>
                                        </p>
                                    )}
                                    <p className="flex justify-between border-b pb-2">
                                        <span className="text-gray-600">City:</span>
                                        <span className="font-medium">{profile.location?.city || 'Not specified'}</span>
                                    </p>
                                    <p className="flex justify-between border-b pb-2">
                                        <span className="text-gray-600">District:</span>
                                        <span className="font-medium">{profile.location?.district || 'Not specified'}</span>
                                    </p>
                                    <p className="flex justify-between border-b pb-2">
                                        <span className="text-gray-600">State:</span>
                                        <span className="font-medium">{profile.location?.state || 'Not specified'}</span>
                                    </p>
                                    {profile.location?.pincode && (
                                        <p className="flex justify-between border-b pb-2">
                                            <span className="text-gray-600">Pincode:</span>
                                            <span className="font-medium">{profile.location.pincode}</span>
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="bg-red-50 p-6 rounded-lg">
                                <h3 className="font-semibold text-lg mb-4 text-red-600 flex items-center gap-2">
                                    <FaPhone /> Contact Information
                                </h3>
                                <div className="space-y-3">
                                    <p className="flex justify-between border-b pb-2">
                                        <span className="text-gray-600">Email:</span>
                                        <span className="font-medium">{user?.email}</span>
                                    </p>
                                    <p className="flex justify-between border-b pb-2">
                                        <span className="text-gray-600">Phone:</span>
                                        <span className="font-medium">{user?.phone}</span>
                                    </p>
                                    {profile.contactInfo?.emergencyPhone && (
                                        <p className="flex justify-between border-b pb-2">
                                            <span className="text-gray-600">Emergency:</span>
                                            <span className="font-medium">{profile.contactInfo.emergencyPhone}</span>
                                        </p>
                                    )}
                                    {profile.contactInfo?.website && (
                                        <p className="flex justify-between border-b pb-2">
                                            <span className="text-gray-600">Website:</span>
                                            <a href={profile.contactInfo.website} target="_blank" rel="noopener noreferrer" 
                                               className="text-red-600 hover:underline">
                                                {profile.contactInfo.website}
                                            </a>
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="bg-red-50 p-6 rounded-lg">
                                <h3 className="font-semibold text-lg mb-4 text-red-600 flex items-center gap-2">
                                    <FaClock /> Operating Hours
                                </h3>
                                <div className="space-y-3">
                                    {profile.operatingHours?.emergency24x7 ? (
                                        <p className="text-green-600 font-medium">24/7 Emergency Services Available</p>
                                    ) : (
                                        <p className="text-gray-600">Regular hours: {getOperatingHours(profile.operatingHours)}</p>
                                    )}
                                    <p className="text-sm text-gray-500 mt-2">
                                        Member since: {formatDate(profile.createdAt)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Services & Facilities */}
                        {(profile.services?.length > 0 || profile.facilities?.length > 0) && (
                            <div className="mt-8 p-6 bg-gradient-to-r from-red-50 to-red-100 rounded-lg">
                                <h3 className="font-semibold text-lg mb-4 text-red-600">Services & Facilities</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {profile.services?.length > 0 && (
                                        <div>
                                            <h4 className="font-medium mb-2">Services Offered:</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {profile.services.map((service, idx) => (
                                                    <span key={idx} className="bg-white text-red-600 px-3 py-1 rounded-full text-sm">
                                                        {service}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {profile.facilities?.length > 0 && (
                                        <div>
                                            <h4 className="font-medium mb-2">Facilities:</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {profile.facilities.map((facility, idx) => (
                                                    <span key={idx} className="bg-white text-green-600 px-3 py-1 rounded-full text-sm">
                                                        {facility.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AdminDashboardPage>
    );
};

export default AdminProfile;