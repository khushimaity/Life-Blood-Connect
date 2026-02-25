import React, { useState, useEffect } from 'react';
import DonorDashboardPage from "./DonorDashboardPage";
import { bloodRequestAPI } from "../api/services";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../components/AuthContext'; // Add this import

function MyRequests() {
  const { user } = useAuth(); // Get current user for blood group
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [filter, setFilter] = useState('available');

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      let response;
      
      if (filter === 'my') {
        response = await bloodRequestAPI.getMyRequests();
        if (response.data.success) {
          console.log('My requests:', response.data.requests); // Debug log
          setRequests(response.data.requests || []);
        }
      } else {
        response = await bloodRequestAPI.getAvailable();
        if (response.data.success) {
          console.log('Available requests:', response.data.requests); // Debug log
          setRequests(response.data.requests || []);
        }
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to load requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id) => {
    try {
      setProcessingId(id);
      
      const response = await bloodRequestAPI.acceptRequest(id);
      
      if (response.data.success) {
        toast.success('Request accepted! Check "My Requests" tab.');
        
        // Remove from available requests
        setRequests(requests.filter(req => req.id !== id));
        
        // If the API returns the accepted request data, we could add it to state
        // But since we're switching tabs, we'll just fetch again when switching
        
        // Switch to "My Requests" tab after a delay
        setTimeout(() => {
          setFilter('my');
          // Force refresh when switching to my requests
          fetchRequests();
        }, 2000);
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      toast.error(error.response?.data?.message || 'Failed to accept request');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'ASAP';
    return new Date(dateString).toLocaleString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (req) => {
    if (req.role === 'volunteer') {
      return (
        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
          ✓ Accepted
        </span>
      );
    }
    
    switch(req.status) {
      case 'Pending':
        return <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-medium">Pending</span>;
      case 'Approved':
        return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">Approved</span>;
      case 'Processing':
        return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">Processing</span>;
      case 'Completed':
        return <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-medium">Completed</span>;
      case 'Accepted':
        return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">Accepted</span>;
      default:
        return <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">{req.status}</span>;
    }
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

  return (
    <DonorDashboardPage>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header with tabs */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-red-700">Blood Requests</h2>
          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setFilter('available')}
              className={`px-4 py-2 rounded-md transition ${
                filter === 'available' 
                  ? 'bg-red-600 text-white' 
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              Available Requests
            </button>
            <button
              onClick={() => setFilter('my')}
              className={`px-4 py-2 rounded-md transition ${
                filter === 'my' 
                  ? 'bg-red-600 text-white' 
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              My Requests
            </button>
          </div>
        </div>

        {/* Emergency Alert */}
        {filter === 'available' && requests.some(r => r.priority === 'Emergency') && (
          <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-r-lg">
            <div className="flex items-center">
              <span className="text-2xl mr-3">🚨</span>
              <div>
                <p className="font-bold text-red-700">Emergency Requests Available!</p>
                <p className="text-sm text-red-600">These requests need immediate attention.</p>
              </div>
            </div>
          </div>
        )}

        {requests.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-6xl mb-4">🩸</div>
            <h4 className="text-xl font-semibold text-gray-700 mb-2">
              {filter === 'available' 
                ? 'No Available Requests' 
                : 'No Requests Yet'}
            </h4>
            <p className="text-gray-500">
              {filter === 'available' 
                ? 'Check back later for blood requests in your area.' 
                : 'You haven\'t created or accepted any blood requests.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div 
                key={req.id || req.requestId} 
                className={`bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition ${
                  req.priority === 'Emergency' ? 'border-l-4 border-red-600' : ''
                } ${req.role === 'volunteer' ? 'border-l-4 border-green-600' : ''}`}
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  {/* Left side - Request details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-xl font-bold text-gray-900">
                        {req.patientName}
                      </h3>
                      {req.priority === 'Emergency' && (
                        <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                          EMERGENCY
                        </span>
                      )}
                      {filter === 'my' && getStatusBadge(req)}
                      {req.role === 'volunteer' && filter === 'my' && (
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                          You accepted this
                        </span>
                      )}
                    </div>
                    
                    {/* 🔴 ADDED: Compatibility Badge for Available Requests */}
                    {filter === 'available' && req.compatibility && (
                      <div className="mb-3">
                        {req.compatibility.type === 'exact' ? (
                          <div className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                            <span>⭐</span> Perfect Match - Same Blood Type
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                            <span>✓</span> Compatible Donor
                          </div>
                        )}
                        {req.bloodGroup !== user?.bloodGroup && (
                          <span className="ml-2 text-xs text-gray-500">
                            ({user?.bloodGroup} → {req.bloodGroup})
                          </span>
                        )}
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-600">Blood Group:</span>
                        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold">
                          {req.bloodGroup}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-600">Hospital:</span>
                        <span className="text-gray-800">{req.hospital}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-600">Reason:</span>
                        <span className="text-gray-800">{req.reason || 'Emergency'}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-600">Needed By:</span>
                        <span className="text-gray-800">{formatDate(req.neededBy)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-600">Units Needed:</span>
                        <span className="text-gray-800">
                          {req.remainingUnits || req.requiredUnits || 1}
                        </span>
                      </div>

                      {req.acceptedAt && (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-600">Accepted On:</span>
                          <span className="text-gray-800">{formatDate(req.acceptedAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right side - Action button */}
                  {filter === 'available' && (
                    <div className="flex justify-center md:justify-end">
                      <button
                        onClick={() => handleAccept(req.id)}
                        disabled={processingId === req.id}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]"
                      >
                        {processingId === req.id ? 'Processing...' : 'Accept Request'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DonorDashboardPage>
  );
}

export default MyRequests;