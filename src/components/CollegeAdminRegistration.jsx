import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';

const CollegeAdminRegistration = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    collegeName: '',
    adminName: '',
    email: '',
    password: '',
    collegeCode: '',
    phone: '',
    address: {
      state: '',
      district: '',
      addressLine: ''
    },
    totalStudents: '',
    departments: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const validateForm = () => {
    if (!formData.collegeName.trim()) {
      toast.error('College name is required');
      return false;
    }
    if (!formData.adminName.trim()) {
      toast.error('Admin name is required');
      return false;
    }
    if (!formData.email.trim()) {
      toast.error('Email is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return false;
    }
    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      toast.error('Phone number must be 10 digits');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      const requestData = {
        collegeName: formData.collegeName.trim(),
        adminName: formData.adminName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        collegeCode: formData.collegeCode.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        address: {
          state: formData.address.state.trim() || '',
          district: formData.address.district.trim() || '',
          addressLine: formData.address.addressLine.trim() || ''
        },
        totalStudents: formData.totalStudents ? parseInt(formData.totalStudents) : 0,
        departments: formData.departments ? formData.departments.split(',').map(d => d.trim()) : []
      };

      console.log('Sending registration data:', requestData);

      const response = await axios.post('http://localhost:5000/api/auth/register/college-admin', requestData);

      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        toast.success('College admin registered successfully!');
        setTimeout(() => navigate('/college-admin/dashboard'), 2000);
      }
    } catch (error) {
      console.error('Registration error:', error.response?.data);
      
      if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors.map(e => e.msg).join('\n');
        toast.error(errorMessages);
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.code === 'ERR_NETWORK') {
        toast.error('Cannot connect to server. Please check if backend is running on port 5000.');
      } else {
        toast.error('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-12 p-8 bg-white rounded-xl shadow-md">
      <ToastContainer position="top-right" autoClose={3000} />
      <h2 className="text-3xl font-bold mb-8 text-center text-blue-800">College Admin Registration</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium">College Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="collegeName"
              value={formData.collegeName}
              onChange={handleChange}
              required
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter college name"
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block mb-1 font-medium">Admin Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="adminName"
              value={formData.adminName}
              onChange={handleChange}
              required
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter admin name"
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block mb-1 font-medium">Email <span className="text-red-500">*</span></label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="admin@college.edu"
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block mb-1 font-medium">Password <span className="text-red-500">*</span></label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Min 6 characters"
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block mb-1 font-medium">College Code</label>
            <input
              type="text"
              name="collegeCode"
              value={formData.collegeCode}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Unique college code"
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block mb-1 font-medium">Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              pattern="[0-9]{10}"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="10 digit mobile number"
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block mb-1 font-medium">State</label>
            <input
              type="text"
              name="address.state"
              value={formData.address.state}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Kerala"
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block mb-1 font-medium">District</label>
            <input
              type="text"
              name="address.district"
              value={formData.address.district}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Kollam"
              disabled={loading}
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block mb-1 font-medium">Address Line</label>
            <input
              type="text"
              name="address.addressLine"
              value={formData.address.addressLine}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Street address"
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block mb-1 font-medium">Total Students</label>
            <input
              type="number"
              name="totalStudents"
              value={formData.totalStudents}
              onChange={handleChange}
              min="0"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Number of students"
              disabled={loading}
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block mb-1 font-medium">Departments (comma-separated)</label>
            <input
              type="text"
              name="departments"
              value={formData.departments}
              onChange={handleChange}
              placeholder="CSE, ECE, MECH, CIVIL"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-semibold text-lg"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Registering...
            </span>
          ) : 'Register as College Admin'}
        </button>
        
        <p className="text-center text-sm">
          Already registered? <Link to="/college-admin/login" className="text-blue-600 hover:underline">Login here</Link>
        </p>
      </form>
    </div>
  );
};

export default CollegeAdminRegistration;