import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AdminDashboardPage from "./AdminDashboardPage";
import { adminAPI } from "../api/services";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getDashboard();
      
      if (response.data.success) {
        setDashboardData(response.data.dashboard);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId, newStatus) => {
    try {
      setProcessingId(requestId);
      
      const response = await bloodRequestAPI.updateStatus(requestId, { 
        status: newStatus,
        notes: `Status updated to ${newStatus} by admin`
      });
      
      if (response.data.success) {
        toast.success(`Request ${newStatus} successfully!`);
        fetchDashboardData(); // Refresh data
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Approved":
        return "bg-green-100 text-green-800";
      case "Processing":
        return "bg-blue-100 text-blue-800";
      case "Completed":
        return "bg-purple-100 text-purple-800";
      case "Cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case "Emergency":
        return "bg-red-100 text-red-800 font-bold";
      case "Urgent":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
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

  return (
    <AdminDashboardPage>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="p-8 w-full bg-[#fff8f8] min-h-screen">
        <h1 className="text-3xl font-bold mb-6 text-[#1c0d0d]">Dashboard</h1>

        {/* Organization Info */}
        {dashboardData?.organization && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-2">{dashboardData.organization.name}</h2>
            <p className="text-gray-600">{dashboardData.organization.type} • {dashboardData.organization.location}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-6">
            <div className="text-3xl font-bold mb-2">{dashboardData?.stats?.totalRequests || 0}</div>
            <div className="text-sm opacity-90">Total Requests</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-xl shadow-lg p-6">
            <div className="text-3xl font-bold mb-2">{dashboardData?.stats?.pendingRequests || 0}</div>
            <div className="text-sm opacity-90">Pending</div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-lg p-6">
            <div className="text-3xl font-bold mb-2">{dashboardData?.stats?.approvedRequests || 0}</div>
            <div className="text-sm opacity-90">Approved</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl shadow-lg p-6">
            <div className="text-3xl font-bold mb-2">{dashboardData?.stats?.completedRequests || 0}</div>
            <div className="text-sm opacity-90">Completed</div>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl shadow-lg p-6">
            <div className="text-3xl font-bold mb-2">{dashboardData?.stats?.totalAcceptedDonors || 0}</div>
            <div className="text-sm opacity-90">Donors Accepted</div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search requests by patient name or blood group..."
            className="w-full p-4 rounded-md bg-white border border-gray-200 placeholder-gray-400 text-gray-700 outline-none focus:ring-2 focus:ring-red-300"
          />
        </div>

        {/* Requests Table */}
        <h2 className="text-2xl font-semibold mb-4 text-[#1c0d0d]">Blood Requests</h2>
        <div className="overflow-x-auto bg-white rounded-xl shadow-md">
          <table className="w-full text-left">
            <thead className="bg-red-50">
              <tr>
                <th className="px-4 py-3 text-sm font-semibold text-red-700">Request ID</th>
                <th className="px-4 py-3 text-sm font-semibold text-red-700">Patient</th>
                <th className="px-4 py-3 text-sm font-semibold text-red-700">Blood Group</th>
                <th className="px-4 py-3 text-sm font-semibold text-red-700">Units</th>
                <th className="px-4 py-3 text-sm font-semibold text-red-700">Donors</th>
                <th className="px-4 py-3 text-sm font-semibold text-red-700">Priority</th>
                <th className="px-4 py-3 text-sm font-semibold text-red-700">Status</th>
                <th className="px-4 py-3 text-sm font-semibold text-red-700">Needed By</th>
                <th className="px-4 py-3 text-sm font-semibold text-red-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {dashboardData?.recentRequests?.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-sm">{req.requestId}</td>
                  <td className="px-4 py-3 font-medium">{req.patientName}</td>
                  <td className="px-4 py-3">
                    <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold">
                      {req.bloodGroup}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {req.requiredUnits} 
                    {req.fulfilledUnits > 0 && (
                      <span className="text-green-600 text-xs ml-1">
                        ({req.fulfilledUnits} filled)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {req.acceptedDonors > 0 ? (
                      <span className="text-green-600 font-medium">{req.acceptedDonors}</span>
                    ) : (
                      <span className="text-gray-400">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityClass(req.priority)}`}>
                      {req.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusClass(req.status)}`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {new Date(req.neededBy).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {req.status === 'Pending' && (
                      <button
                        onClick={() => handleStatusUpdate(req.id, 'Approved')}
                        disabled={processingId === req.id}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition disabled:opacity-50 mr-2"
                      >
                        Approve
                      </button>
                    )}
                    {req.status === 'Approved' && (
                      <button
                        onClick={() => handleStatusUpdate(req.id, 'Processing')}
                        disabled={processingId === req.id}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition disabled:opacity-50 mr-2"
                      >
                        Process
                      </button>
                    )}
                    {req.status === 'Processing' && (
                      <button
                        onClick={() => handleStatusUpdate(req.id, 'Completed')}
                        disabled={processingId === req.id}
                        className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 transition disabled:opacity-50"
                      >
                        Complete
                      </button>
                    )}
                    <Link 
                      to={`/admin/request/${req.id}`}
                      className="text-red-600 hover:text-red-800 text-sm font-medium ml-2"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {(!dashboardData?.recentRequests || dashboardData.recentRequests.length === 0) && (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-gray-500">
                    No blood requests found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Emergency Button */}
        <div className="mt-8 text-right">
          <Link to="/emergency-request">
            <button className="bg-red-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-red-700 transition">
              + Emergency Request
            </button>
          </Link>
        </div>
      </div>
    </AdminDashboardPage>
  );
};

export default AdminDashboard;