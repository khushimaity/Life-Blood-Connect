import React, { useState, useEffect } from "react";
import CollegeAdminSidebar from "./CollegeAdminSidebar";
import { FaCalendarAlt, FaMapMarkerAlt, FaUsers, FaEdit, FaTrash, FaPlus, FaSave, FaTimes } from "react-icons/fa";
import { Link } from "react-router-dom";
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CollegeAdminDrives = () => {
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingDrive, setEditingDrive] = useState(null);
  const [editFormData, setEditFormData] = useState({
    driveName: "",
    driveDate: "",
    driveTime: "",
    location: "",
    coordinatorName: "",
    coordinatorPhone: "",
    description: "",
    facilities: []
  });

  useEffect(() => {
    fetchDrives();
  }, []);

  const fetchDrives = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get('http://localhost:5000/api/college-admin/drives', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setDrives(response.data.drives);
      }
    } catch (error) {
      console.error('Error fetching drives:', error);
      toast.error('Failed to load drives');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (driveId) => {
    if (!window.confirm('Are you sure you want to delete this drive?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/college-admin/drives/${driveId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Drive deleted successfully');
      fetchDrives(); // Refresh the list
    } catch (error) {
      console.error('Error deleting drive:', error);
      toast.error('Failed to delete drive');
    }
  };

  const handleEdit = (drive) => {
    setEditingDrive(drive._id);
    setEditFormData({
      driveName: drive.driveName || "",
      driveDate: drive.driveDate ? drive.driveDate.split('T')[0] : "",
      driveTime: drive.driveTime || "",
      location: drive.location || "",
      coordinatorName: drive.coordinatorName || "",
      coordinatorPhone: drive.coordinatorPhone || "",
      description: drive.description || "",
      facilities: drive.facilities || []
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFacilityToggle = (facilityId) => {
    setEditFormData(prev => {
      const facilities = prev.facilities.includes(facilityId)
        ? prev.facilities.filter(f => f !== facilityId)
        : [...prev.facilities, facilityId];
      return { ...prev, facilities };
    });
  };

  const handleEditSubmit = async (driveId) => {
    try {
      const token = localStorage.getItem('token');
      
      const updatedData = {
        ...editFormData,
        driveDate: new Date(editFormData.driveDate).toISOString()
      };

      const response = await axios.put(
        `http://localhost:5000/api/college-admin/drives/${driveId}`,
        updatedData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success('Drive updated successfully');
        setEditingDrive(null);
        fetchDrives(); // Refresh the list
      }
    } catch (error) {
      console.error('Error updating drive:', error);
      toast.error('Failed to update drive');
    }
  };

  const handleCancelEdit = () => {
    setEditingDrive(null);
  };

  const facilityOptions = [
    { id: "bp", label: "BP Check" },
    { id: "hb", label: "Hemoglobin" },
    { id: "refreshments", label: "Refreshments" },
    { id: "certificate", label: "Certificate" },
    { id: "transport", label: "Transport" },
    { id: "medical", label: "Medical Team" }
  ];

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-IN', options);
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
      <ToastContainer position="top-right" autoClose={3000} />
      
      <main className="flex-1 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Blood Donation Drives</h1>
          <Link
            to="/college-admin/create-drive"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <FaPlus /> Create New Drive
          </Link>
        </div>

        {/* Drives List */}
        {drives.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <FaCalendarAlt className="text-5xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Drives Found</h3>
            <p className="text-gray-500 mb-4">
              You haven't created any blood donation drives yet.
            </p>
            <Link
              to="/college-admin/create-drive"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition inline-flex items-center gap-2"
            >
              <FaPlus /> Create Your First Drive
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {drives.map(drive => (
              <div key={drive._id} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
                {editingDrive === drive._id ? (
                  // Edit Mode
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-blue-600 mb-4">Edit Drive</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Drive Name</label>
                        <input
                          type="text"
                          name="driveName"
                          value={editFormData.driveName}
                          onChange={handleEditChange}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Date</label>
                        <input
                          type="date"
                          name="driveDate"
                          value={editFormData.driveDate}
                          onChange={handleEditChange}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Time</label>
                        <input
                          type="text"
                          name="driveTime"
                          value={editFormData.driveTime}
                          onChange={handleEditChange}
                          placeholder="e.g., 10:00 AM - 4:00 PM"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Location</label>
                        <input
                          type="text"
                          name="location"
                          value={editFormData.location}
                          onChange={handleEditChange}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Coordinator Name</label>
                        <input
                          type="text"
                          name="coordinatorName"
                          value={editFormData.coordinatorName}
                          onChange={handleEditChange}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Coordinator Phone</label>
                        <input
                          type="tel"
                          name="coordinatorPhone"
                          value={editFormData.coordinatorPhone}
                          onChange={handleEditChange}
                          pattern="[0-9]{10}"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea
                          name="description"
                          value={editFormData.description}
                          onChange={handleEditChange}
                          rows="3"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2">Facilities</label>
                        <div className="flex flex-wrap gap-3">
                          {facilityOptions.map(facility => (
                            <label key={facility.id} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={editFormData.facilities.includes(facility.id)}
                                onChange={() => handleFacilityToggle(facility.id)}
                                className="h-4 w-4 text-blue-600 rounded"
                              />
                              <span className="text-sm">{facility.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => handleEditSubmit(drive._id)}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                      >
                        <FaSave /> Save Changes
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition flex items-center gap-2"
                      >
                        <FaTimes /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <>
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      {/* Left Section - Drive Details */}
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-800 mb-3">{drive.driveName}</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="flex items-center gap-2 text-gray-600">
                            <FaCalendarAlt className="text-blue-500" />
                            <span>{formatDate(drive.driveDate)} • {drive.driveTime}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-gray-600">
                            <FaMapMarkerAlt className="text-red-500" />
                            <span>{drive.location}</span>
                          </div>
                          
                          {drive.coordinatorName && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <FaUsers className="text-green-500" />
                              <span>Coordinator: {drive.coordinatorName}</span>
                            </div>
                          )}
                          
                          {drive.coordinatorPhone && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <span className="font-medium">Contact:</span>
                              <span>{drive.coordinatorPhone}</span>
                            </div>
                          )}
                        </div>

                        {/* Facilities Tags */}
                        {drive.facilities && drive.facilities.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {drive.facilities.map((facility, idx) => (
                              <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                {facility === 'bp' ? 'BP Check' :
                                 facility === 'hb' ? 'Hemoglobin' :
                                 facility === 'refreshments' ? 'Refreshments' :
                                 facility === 'certificate' ? 'Certificate' :
                                 facility === 'transport' ? 'Transport' :
                                 facility === 'medical' ? 'Medical Team' : facility}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Right Section - Actions */}
                      <div className="flex md:flex-col gap-2 justify-end">
                        <button 
                          onClick={() => handleEdit(drive)}
                          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition flex items-center gap-2 justify-center"
                        >
                          <FaEdit /> Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(drive._id)}
                          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition flex items-center gap-2 justify-center"
                        >
                          <FaTrash /> Delete
                        </button>
                      </div>
                    </div>

                    {/* Description */}
                    {drive.description && (
                      <div className="mt-3 text-sm text-gray-600 border-t pt-3">
                        <span className="font-medium">Description:</span> {drive.description}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default CollegeAdminDrives;