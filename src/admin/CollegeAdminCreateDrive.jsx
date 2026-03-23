import React, { useState } from "react";
import CollegeAdminSidebar from "./CollegeAdminSidebar";
import { FaCalendarAlt, FaMapMarkerAlt, FaUsers, FaClock, FaSave, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';

const CollegeAdminCreateDrive = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    driveName: "",
    driveDate: "",
    driveTime: "",
    location: "",
    targetDonors: "",
    coordinatorName: "",
    coordinatorPhone: "",
    description: "",
    bloodGroupsNeeded: []
  });

  const [selectedFacilities, setSelectedFacilities] = useState([]);
  const [selectedBloodGroups, setSelectedBloodGroups] = useState([]);

  const facilityOptions = [
    { id: "bp", label: "Blood Pressure Check" },
    { id: "hb", label: "Hemoglobin Test" },
    { id: "refreshments", label: "Refreshments" },
    { id: "certificate", label: "Donation Certificate" },
    { id: "transport", label: "Transport Assistance" },
    { id: "medical", label: "Medical Team on Site" }
  ];

  const bloodGroupOptions = [
    "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFacilityToggle = (facilityId) => {
    setSelectedFacilities(prev => {
      if (prev.includes(facilityId)) {
        return prev.filter(id => id !== facilityId);
      } else {
        return [...prev, facilityId];
      }
    });
  };

  const handleBloodGroupToggle = (bloodGroup) => {
    setSelectedBloodGroups(prev => {
      if (prev.includes(bloodGroup)) {
        return prev.filter(bg => bg !== bloodGroup);
      } else {
        return [...prev, bloodGroup];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate form
    if (!formData.driveName || !formData.driveDate || !formData.driveTime || !formData.location || !formData.targetDonors) {
      toast.error('Please fill in all required fields');
      setLoading(false);
      return;
    }

    // Validate phone
    if (formData.coordinatorPhone && !/^\d{10}$/.test(formData.coordinatorPhone)) {
      toast.error('Contact number must be 10 digits');
      setLoading(false);
      return;
    }

    // Validate target donors is a positive number
    if (parseInt(formData.targetDonors) <= 0) {
      toast.error('Target donors must be greater than 0');
      setLoading(false);
      return;
    }

    // Validate date is not in the past
    const selectedDate = new Date(formData.driveDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      toast.error('Drive date cannot be in the past');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('You must be logged in');
        navigate('/college-admin/login');
        return;
      }

      const driveData = {
        driveName: formData.driveName.trim(),
        driveDate: formData.driveDate,
        driveTime: formData.driveTime.trim(),
        location: formData.location.trim(),
        targetDonors: parseInt(formData.targetDonors),
        coordinatorName: formData.coordinatorName.trim() || '',
        coordinatorPhone: formData.coordinatorPhone.trim() || '',
        description: formData.description.trim() || '',
        facilities: selectedFacilities,
        bloodGroupsNeeded: selectedBloodGroups
      };

      console.log('🚀 Sending drive data:', JSON.stringify(driveData, null, 2));

      const response = await axios.post('http://localhost:5000/api/college-admin/drives', driveData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Response:', response.data);

      if (response.data.success) {
        toast.success('Blood donation drive created successfully!');
        setTimeout(() => {
          navigate('/college-admin/drives');
        }, 2000);
      }
    } catch (error) {
      console.error('❌ Error creating drive:', error);
      
      if (error.response) {
        // The request was made and the server responded with a status code
        console.error('❌ Error response data:', error.response.data);
        console.error('❌ Error response status:', error.response.status);
        
        // Show specific error message from backend
        if (error.response.data.message) {
          toast.error(error.response.data.message);
        } else if (error.response.data.errors) {
          // Handle validation errors
          const errorMessages = error.response.data.errors.join('\n');
          toast.error(errorMessages);
        } else {
          toast.error('Failed to create drive. Please check your input.');
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error('❌ No response received:', error.request);
        toast.error('No response from server. Please check if backend is running.');
      } else {
        // Something happened in setting up the request
        console.error('❌ Error message:', error.message);
        toast.error('An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <CollegeAdminSidebar />
      <ToastContainer position="top-right" autoClose={3000} />
      
      <main className="flex-1 p-6">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Create Blood Donation Drive</h1>
            <button
              onClick={() => navigate('/college-admin/drives')}
              className="text-gray-600 hover:text-gray-800 flex items-center gap-2"
            >
              <FaTimes /> Cancel
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
            {/* Basic Information */}
            <h2 className="text-lg font-semibold mb-4 text-gray-700">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Drive Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="driveName"
                  value={formData.driveName}
                  onChange={handleChange}
                  placeholder="e.g., Campus Blood Donation Camp - March 2026"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FaCalendarAlt className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="date"
                    name="driveDate"
                    value={formData.driveDate}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Time <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FaClock className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    name="driveTime"
                    value={formData.driveTime}
                    onChange={handleChange}
                    placeholder="e.g., 10:00 AM - 4:00 PM"
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Location <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FaMapMarkerAlt className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g., Main Auditorium, College Campus"
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Donor Information */}
            <h2 className="text-lg font-semibold mb-4 text-gray-700">Donor Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Target Donors <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FaUsers className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="number"
                    name="targetDonors"
                    value={formData.targetDonors}
                    onChange={handleChange}
                    min="1"
                    placeholder="e.g., 100"
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Blood Groups Needed</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {bloodGroupOptions.map(bg => (
                    <button
                      key={bg}
                      type="button"
                      onClick={() => handleBloodGroupToggle(bg)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                        selectedBloodGroups.includes(bg)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {bg}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">Select blood groups needed (optional)</p>
              </div>
            </div>

            {/* Coordinator Details */}
            <h2 className="text-lg font-semibold mb-4 text-gray-700">Coordinator Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-1">Coordinator Name</label>
                <input
                  type="text"
                  name="coordinatorName"
                  value={formData.coordinatorName}
                  onChange={handleChange}
                  placeholder="e.g., Dr. Rajesh Kumar"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Contact Number</label>
                <input
                  type="tel"
                  name="coordinatorPhone"
                  value={formData.coordinatorPhone}
                  onChange={handleChange}
                  placeholder="10 digit mobile number"
                  pattern="[0-9]{10}"
                  title="Please enter a 10-digit mobile number"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Facilities */}
            <h2 className="text-lg font-semibold mb-4 text-gray-700">Facilities Available</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
              {facilityOptions.map(facility => (
                <label key={facility.id} className="flex items-center gap-2 p-2 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedFacilities.includes(facility.id)}
                    onChange={() => handleFacilityToggle(facility.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                  />
                  <span className="text-sm cursor-pointer">{facility.label}</span>
                </label>
              ))}
            </div>



            {/* Submit Buttons */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </>
                ) : (
                  <>
                    <FaSave /> Create Drive
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate('/college-admin/drives')}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CollegeAdminCreateDrive;