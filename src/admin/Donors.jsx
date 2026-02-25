import React, { useState, useEffect } from "react";
import AdminDashboardPage from "./AdminDashboardPage";
import { donorAPI } from "../api/services";
import { toast } from 'react-toastify';

const Donors = () => {
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState({
    bloodGroup: 'All',
    isAvailable: 'All'
  });

  useEffect(() => {
    fetchDonors();
  }, [filter]);

  const fetchDonors = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter.bloodGroup !== 'All') params.bloodGroup = filter.bloodGroup;
      if (filter.isAvailable !== 'All') params.isAvailable = filter.isAvailable === 'true';
      
      const response = await donorAPI.getAll(params);
      if (response.data.success) {
        setDonors(response.data.donors);
      }
    } catch (error) {
      toast.error('Failed to load donors');
      console.error('Error fetching donors:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDonors = donors.filter(donor => 
    donor.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    donor.userId?.bloodGroup?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    donor.collegeDetails?.collegeName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <AdminDashboardPage>
        <div className="p-6 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </AdminDashboardPage>
    );
  }

  return (
    <AdminDashboardPage>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Donor List</h2>
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Search donors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300"
            />
            <select 
              value={filter.bloodGroup}
              onChange={(e) => setFilter({...filter, bloodGroup: e.target.value})}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="All">All Blood Groups</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
            <select 
              value={filter.isAvailable}
              onChange={(e) => setFilter({...filter, isAvailable: e.target.value})}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="All">All Status</option>
              <option value="true">Available</option>
              <option value="false">Unavailable</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full border border-gray-300">
            <thead className="bg-red-100">
              <tr>
                <th className="p-3 text-left">Donor ID</th>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Blood Group</th>
                <th className="p-3 text-left">College</th>
                <th className="p-3 text-left">Department</th>
                <th className="p-3 text-left">Location</th>
                <th className="p-3 text-left">Last Donation</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDonors.length > 0 ? (
                filteredDonors.map((donor) => (
                  <tr key={donor._id} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-mono text-sm">{donor._id.slice(-6).toUpperCase()}</td>
                    <td className="p-3">{donor.userId?.name || 'Unknown'}</td>
                    <td className="p-3 font-bold">{donor.userId?.bloodGroup || 'N/A'}</td>
                    <td className="p-3">{donor.collegeDetails?.collegeName || 'N/A'}</td>
                    <td className="p-3">{donor.collegeDetails?.department || 'N/A'}</td>
                    <td className="p-3">{donor.address?.city || donor.collegeDetails?.district || 'N/A'}</td>
                    <td className="p-3">
                      {donor.lastDonationDate 
                        ? new Date(donor.lastDonationDate).toLocaleDateString() 
                        : 'Never'}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        donor.isAvailable 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {donor.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td className="p-3">
                      <button className="text-blue-600 hover:underline text-sm mr-2">View</button>
                      <button 
                        onClick={() => window.location.href = `tel:${donor.userId?.phone}`}
                        className="text-green-600 hover:underline text-sm"
                      >
                        Contact
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="p-6 text-center text-gray-500">
                    No donors found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          Total Donors: {filteredDonors.length}
        </div>
      </div>
    </AdminDashboardPage>
  );
};

export default Donors;