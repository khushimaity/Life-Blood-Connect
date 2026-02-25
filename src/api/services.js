import axiosInstance from './axios';

// Auth Services
export const authAPI = {
  login: (data) => axiosInstance.post('/auth/login', data),
  registerDonor: (data) => axiosInstance.post('/auth/register/donor', data),
  registerAdmin: (data) => axiosInstance.post('/auth/register/admin', data),
  getMe: () => axiosInstance.get('/auth/me'),
  updateProfile: (data) => axiosInstance.put('/auth/profile', data),
  logout: () => axiosInstance.post('/auth/logout'),
};

// Donor Services
export const donorAPI = {
  getAll: (params) => axiosInstance.get('/donors', { params }),
  getProfile: () => axiosInstance.get('/donors/profile/me'),
  updateProfile: (data) => axiosInstance.put('/donors/profile', data),
  getDonationHistory: () => axiosInstance.get('/donors/donation-history'),
  findDonors: (params) => axiosInstance.get('/donors/find', { params }),
  updateAvailability: (data) => axiosInstance.put('/donors/availability', data),
};

// Blood Request Services
export const bloodRequestAPI = {
  getAll: (params) => axiosInstance.get('/blood-requests', { params }),
  getEmergency: () => axiosInstance.get('/blood-requests/emergency'),
  getAvailable: () => axiosInstance.get('/blood-requests/available'),
  acceptRequest: (id) => axiosInstance.post(`/blood-requests/${id}/accept`),
  create: (data) => axiosInstance.post('/blood-requests', data),
  getById: (id) => axiosInstance.get(`/blood-requests/${id}`),
  getMyRequests: () => axiosInstance.get('/blood-requests/my-requests'),
  updateStatus: (id, data) => axiosInstance.put(`/blood-requests/${id}/status`, data),
  cancel: (id) => axiosInstance.put(`/blood-requests/${id}/cancel`),
  assignDonor: (id, data) => axiosInstance.post(`/blood-requests/${id}/assign-donor`, data),
};

// Admin Services
export const adminAPI = {
  getDashboard: () => axiosInstance.get('/admin/dashboard'),
  getCenters: (params) => axiosInstance.get('/admin/centers', { params }),
  getCenterDetails: (id) => axiosInstance.get(`/admin/center/${id}`),
  updateProfile: (data) => axiosInstance.put('/admin/profile', data),
  searchBlood: (params) => axiosInstance.get('/admin/search-blood', { params }),
};

// Inventory Services
export const inventoryAPI = {
  getInventory: () => axiosInstance.get('/inventory'),
  addToInventory: (data) => axiosInstance.post('/inventory', data),
  updateInventory: (id, data) => axiosInstance.put(`/inventory/${id}`, data),
  deleteInventory: (id) => axiosInstance.delete(`/inventory/${id}`),
  searchBlood: (params) => axiosInstance.get('/inventory/search', { params }),
  getAlerts: () => axiosInstance.get('/inventory/alerts'),
};

// Donation Services
export const donationAPI = {
  getAll: (params) => axiosInstance.get('/donations', { params }),
  record: (data) => axiosInstance.post('/donations', data),
  getById: (id) => axiosInstance.get(`/donations/${id}`),
  getDonorHistory: () => axiosInstance.get('/donations/donor/history'),
  updateTestResults: (id, data) => axiosInstance.put(`/donations/${id}/test-results`, data),
  getStats: () => axiosInstance.get('/donations/stats'),
};