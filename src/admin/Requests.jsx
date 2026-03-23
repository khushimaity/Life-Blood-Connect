import React, { useState, useEffect } from "react";
import AdminDashboardPage from "./AdminDashboardPage";
import { bloodRequestAPI } from "../api/services";
import { toast } from 'react-toastify';
import axios from "axios";

const Requests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    status: 'All',
    bloodGroup: 'All',
    priority: 'All'
  });

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter.status !== 'All') params.status = filter.status;
      if (filter.bloodGroup !== 'All') params.bloodGroup = filter.bloodGroup;
      if (filter.priority !== 'All') params.priority = filter.priority;
      
      const response = await bloodRequestAPI.getAll(params);
      
      if (response.data.success) {
        setRequests(response.data.requests);
      }
    } catch (error) {
      toast.error('Failed to load requests');
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

const handleSelectDonor = async (requestId, donorId) => {
  try {
    const token = localStorage.getItem("token");

    await axios.put(
      `http://localhost:5000/api/blood-requests/select-donor/${requestId}`,
      { donorId },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    // 🔥 Update state directly instead of refreshing
    setRequests((prevRequests) =>
      prevRequests.map((req) =>
        req.requestId === requestId
          ? { ...req, selectedDonor: donorId }
          : req
      )
    );

  } catch (error) {
    console.error(error);
  }
};

  const getStatusClass = (status) => {
    switch (status) {
      case "Pending": return "bg-yellow-100 text-yellow-700";
      case "Approved": return "bg-green-100 text-green-700";
      case "Processing": return "bg-blue-100 text-blue-700";
      case "Completed": return "bg-gray-100 text-gray-700";
      case "Cancelled": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case "Emergency": return "bg-red-100 text-red-700 font-bold";
      case "Urgent": return "bg-orange-100 text-orange-700";
      default: return "bg-gray-100 text-gray-600";
    }
  };

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
          <h2 className="text-2xl font-bold">Blood Requests</h2>
          <div className="flex gap-4">
            <select 
              value={filter.status}
              onChange={(e) => setFilter({...filter, status: e.target.value})}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Processing">Processing</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
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
              value={filter.priority}
              onChange={(e) => setFilter({...filter, priority: e.target.value})}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="All">All Priorities</option>
              <option value="Emergency">Emergency</option>
              <option value="Urgent">Urgent</option>
              <option value="Normal">Normal</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full border border-gray-300">
            <thead className="bg-red-100">
              <tr>
                <th className="p-3 text-left">Request ID</th>
                <th className="p-3 text-left">Patient</th>
                <th className="p-3 text-left">Blood Group</th>
                <th className="p-3 text-left">Units</th>
                <th className="p-3 text-left">Hospital</th>
                <th className="p-3 text-left">Priority</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Needed By</th>
              </tr>
            </thead>
            <tbody>
              {requests.length > 0 ? (
                requests.map((req) => (
                  <tr key={req.requestId} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-mono text-sm">{req.requestId}</td>
                    <td className="p-3">{req.patientName}</td>
                    <td className="p-3 font-bold">{req.bloodGroup}</td>
                    <td className="p-3">
                      {req.requiredUnits || req.quantity} ({req.fulfilledUnits || req.fulfilled || 0} fulfilled)
                    </td>
                    <td className="p-3">{req.hospitalId?.organizationName || req.hospitalName || req.hospital}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${getPriorityClass(req.priority)}`}>
                        {req.priority}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusClass(req.status)}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="p-3">{new Date(req.neededBy).toLocaleDateString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="p-6 text-center text-gray-500">
                    No blood requests found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Accepted Donors Section */}
        <div className="mt-10 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-2xl font-bold mb-6 text-red-700 border-b pb-3">
            Accepted Donors
          </h3>

          {requests.filter(r => r.acceptedDonors && r.acceptedDonors.length > 0).length === 0 ? (
            <p className="text-gray-400 text-center py-6">
              No accepted donors yet.
            </p>
          ) : (
            requests
              .filter(r => r.acceptedDonors && r.acceptedDonors.length > 0)
              .map((req) => (
                <div key={req._id} className="mb-8">
                  {/* Patient Info */}
                  <div className="mb-3">
                    <h4 className="text-lg font-semibold text-gray-800">
                      {req.patientName}
                    </h4>
                    <p className="text-sm text-gray-500">
                      Blood Group: {req.bloodGroup}
                    </p>
                  </div>

                  {/* Donor List */}
                  <div className="space-y-3">
                    {req.acceptedDonors.map((d) => (
                      
                      <div
                        key={d?.donorId?._id || Math.random()}
                        className="flex justify-between items-center bg-gray-50 border border-gray-200 px-4 py-3 rounded-lg hover:shadow transition"
                      >
                        <div>
                          <p className="font-semibold text-gray-800">
                            {d?.donorId?.userId?.name || "Donor"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {d?.donorId?.userId?.bloodGroup}
                          </p>
                        </div>

                        {req.selectedDonor &&
                        req.selectedDonor.toString() === d?.donorId?._id?.toString() ? (
                          <span className="bg-green-600 text-white px-4 py-1.5 rounded-md text-sm">
                            Selected
                          </span>
                        ) : (
                          <button
  onClick={() =>
    handleSelectDonor(req.requestId, d?.donorId?._id)}
  disabled={!!req.selectedDonor}
  className={`px-3 py-1 rounded text-white ${
    req.selectedDonor &&
    req.selectedDonor.toString() === d?.donorId?._id?.toString()
      ? "bg-green-500"
      : req.selectedDonor
      ? "bg-gray-400 cursor-not-allowed"
      : "bg-blue-500 hover:bg-blue-600"
  }`}
>
  {req.selectedDonor &&
  req.selectedDonor.toString() === d?.donorId?._id?.toString()
    ? "Selected"
    : req.selectedDonor
    ? "Not Selected"
    : "Select"}
</button> 
   
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </AdminDashboardPage>
  );
};

export default Requests;