import axiosInstance from './axios';

export const emergencyAPI = {
  // Get all emergency requests
  getEmergencyRequests: () => axiosInstance.get('/blood-requests/emergency'),
  
  // Create emergency request
  createEmergencyRequest: (data) => axiosInstance.post('/blood-requests', {
    ...data,
    priority: 'Emergency'
  }),
};