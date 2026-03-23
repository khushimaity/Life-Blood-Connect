import React, { useState, useEffect } from 'react';
import { bloodRequestAPI } from "../api/services";
import { toast, ToastContainer } from 'react-toastify';
import { BLOOD_GROUPS, REQUEST_PRIORITIES } from '../constants';
import AdminDashboardPage from './AdminDashboardPage';

function IncomingRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIncomingRequests();
  }, []);

  const fetchIncomingRequests = async () => {
    try {
      setLoading(true);
      const response = await bloodRequestAPI.getAll({ 
        status: 'Pending',
        limit: 20 
      });
      
      if (response.data.success) {
        // Map the response data to match the component's expected format
        const formattedRequests = response.data.requests.map(req => ({
          id: req.id || req._id,
          requestId: req.requestId,
          patientName: req.patientName,
          bloodGroup: req.bloodGroup,
          quantity: req.quantity || req.requiredUnits,
          hospital: req.hospital || req.hospitalName,
          priority: req.priority,
          neededBy: req.neededBy,
          status: req.status
        }));
        setRequests(formattedRequests);
      }
    } catch (error) {
      toast.error('Failed to load incoming requests');
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (requestId, action) => {
    try {
      const newStatus = action === 'Accepted' ? 'Approved' : 'Cancelled';
      
      await bloodRequestAPI.updateStatus(requestId, { 
        status: newStatus,
        notes: `Request ${action.toLowerCase()} by admin`
      });
      
      toast.success(`Request ${action} successfully`);
      fetchIncomingRequests(); // Refresh the list
    } catch (error) {
      toast.error(`Failed to ${action} request`);
      console.error('Error updating request:', error);
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'Emergency': return 'bg-red-100 text-red-800 font-bold';
      case 'Urgent': return 'bg-orange-100 text-orange-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <AdminDashboardPage>
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          </div>
        </div>
      </AdminDashboardPage>
    );
  }

  return (
    <AdminDashboardPage>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <ToastContainer position="top-right" autoClose={3000} />
        
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-red-700">Incoming Blood Requests</h2>
          <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
            {requests.length} Pending
          </span>
        </div>

        <div className="overflow-x-auto bg-white rounded shadow">
          <table className="min-w-full text-sm text-left border">
            <thead className="bg-red-100">
              <tr>
                <th className="px-4 py-2">Request ID</th>
                <th className="px-4 py-2">Patient</th>
                <th className="px-4 py-2">Blood Group</th>
                <th className="px-4 py-2">Units</th>
                <th className="px-4 py-2">Hospital</th>
                <th className="px-4 py-2">Priority</th>
                <th className="px-4 py-2">Needed By</th>
                <th className="px-4 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.length > 0 ? (
                requests.map((req) => (
                  <tr key={req.requestId || req.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2 font-mono text-sm">{req.requestId}</td>
                    <td className="px-4 py-2">{req.patientName}</td>
                    <td className="px-4 py-2 font-bold">{req.bloodGroup}</td>
                    <td className="px-4 py-2">{req.quantity} units</td>
                    <td className="px-4 py-2">{req.hospital}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(req.priority)}`}>
                        {req.priority}
                      </span>
                    </td>
                    <td className="px-4 py-2">{formatDate(req.neededBy)}</td>
                    <td className="px-4 py-2 space-x-2">
                      <button
                        onClick={() => handleAction(req.id || req.requestId, 'Accepted')}
                        className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleAction(req.id || req.requestId, 'Declined')}
                        className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition"
                      >
                        Decline
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-gray-500">
                    No pending requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminDashboardPage>
  );
}

export default IncomingRequests;