import axiosInstance from './axios';

export const emergencyAPI = {
  // Get all emergency requests
  getEmergencyRequests: (params) => axiosInstance.get('/blood-requests/emergency', { params }),
  
  // Create emergency request
  createEmergencyRequest: (data) => axiosInstance.post('/blood-requests', {
    ...data,
    priority: 'Emergency'
  }),
  
  // Get emergency request by ID
  getEmergencyRequestById: (id) => axiosInstance.get(`/blood-requests/${id}`),
  
  // Update emergency status
  updateEmergencyStatus: (id, status) => axiosInstance.put(`/blood-requests/${id}/status`, {
    status,
    notes: 'Emergency status updated'
  }),
  
  // Get active emergencies
  getActiveEmergencies: () => axiosInstance.get('/blood-requests', {
    params: {
      priority: 'Emergency',
      status: ['Pending', 'Approved']
    }
  }),
  
  // Debug endpoint (admin only)
  debugDonors: (params) => axiosInstance.get('/emergency/debug', { params }),
  
  // Respond to emergency (donor)
  respondToEmergency: (id) => axiosInstance.post(`/emergency/${id}/respond`),
};