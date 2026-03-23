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
        // Add frontend controlled flag
        const donorsWithUIState = response.data.donors.map(d => ({
          ...d,
          donated: false
        }));
        setDonors(donorsWithUIState);
      }
    } catch (error) {
      toast.error('Failed to load donors');
      console.error('Error fetching donors:', error);
    } finally {
      setLoading(false);
    }
  };

  const markDonated = async (donorId) => {
    try {
      await donorAPI.markDonated({ donorId, units: 1 });

      toast.success("Donation marked successfully!");
      console.log("Updating UI for:", donorId);

      // Force UI change
      setDonors(prev =>
        prev.map(d =>
          d._id === donorId
            ? { ...d, donated: true }
            : d
        )
      );

    } catch (error) {
      console.error(error);
      toast.error("Failed to mark donation");
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
          <h2 className="text-2xl font-bold">Donor Management</h2>
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

        <div className="grid gap-6">
          {filteredDonors.map((donor) => (
            <div
              key={donor._id}
              className="bg-white p-6 rounded-xl shadow-md flex justify-between items-center"
            >
              <div>
                <h2 className="font-bold text-lg">
                  {donor.userId?.name || 'Unknown'}
                </h2>
                <p>Blood Group: {donor.userId?.bloodGroup || 'N/A'}</p>
                <p>College: {donor.collegeDetails?.collegeName || 'N/A'}</p>
                <p>Department: {donor.collegeDetails?.department || 'N/A'}</p>
                <p>Location: {donor.address?.city || donor.collegeDetails?.district || 'N/A'}</p>
                <p>Total Donations: {donor.totalDonations || 0}</p>
                <p>Last Donation: {donor.lastDonationDate 
                  ? new Date(donor.lastDonationDate).toLocaleDateString() 
                  : 'Never'}
                </p>
                <p>Status: 
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                    donor.isAvailable 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {donor.isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => markDonated(donor._id)}
                  disabled={donor.donated}
                  className={`px-4 py-2 rounded-lg text-white transition ${
                    donor.donated
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {donor.donated ? "Donated" : "Mark Donated"}
                </button>
                <button 
                  onClick={() => window.location.href = `tel:${donor.userId?.phone}`}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Contact
                </button>
                <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700">
                  View
                </button>
              </div>
            </div>
          ))}
          {filteredDonors.length === 0 && (
            <div className="bg-white p-6 rounded-xl shadow-md text-center text-gray-500">
              No donors found
            </div>
          )}
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          Total Donors: {filteredDonors.length}
        </div>
      </div>
    </AdminDashboardPage>
  );
};

export default Donors;