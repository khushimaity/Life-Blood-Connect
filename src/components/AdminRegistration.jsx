import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import { CENTER_TYPES } from '../constants';

const AdminRegistration = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    adminName: '',
    organizationName: '',
    email: '',
    phone: '',
    centerType: '',
    location: {
      city: '',
      district: '',
      state: '',
      address: ''
    },
    password: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('location.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.adminName || !formData.organizationName || !formData.email || 
          !formData.phone || !formData.centerType || !formData.password) {
        toast.error('Please fill in all required fields');
        setLoading(false);
        return;
      }

      if (!/^\d{10}$/.test(formData.phone)) {
        toast.error('Phone number must be 10 digits');
        setLoading(false);
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        toast.error('Please enter a valid email address');
        setLoading(false);
        return;
      }

      if (formData.password.length < 6) {
        toast.error('Password must be at least 6 characters');
        setLoading(false);
        return;
      }

      console.log('Sending admin registration data:', formData);

      const response = await axios.post('http://localhost:5000/api/auth/register/admin', {
        adminName: formData.adminName,
        organizationName: formData.organizationName,
        email: formData.email,
        phone: formData.phone,
        centerType: formData.centerType,
        location: formData.location.city || formData.location.district 
          ? {
              city: formData.location.city,
              district: formData.location.district,
              state: formData.location.state,
              address: formData.location.address
            }
          : { city: '', district: '', state: '', address: '' },
        password: formData.password
      });

      console.log('Registration response:', response.data);

      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        toast.success('Admin registered successfully! Redirecting to dashboard...');
        setTimeout(() => {
          navigate('/admin-dashboard');
        }, 2000);
      }
    } catch (error) {
      console.error('Registration error:', error.response?.data || error.message);
      
      if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors.map(e => e.msg).join('\n');
        toast.error(errorMessages);
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-12 p-6 bg-[#fff8f8] rounded-lg shadow-md mb-10">
      <ToastContainer position="top-right" autoClose={3000} />
      <h2 className="text-3xl font-bold mb-6 text-[#1c0d0d]">Admin Registration</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Organization Name *</label>
          <input
            type="text"
            name="organizationName"
            value={formData.organizationName}
            onChange={handleChange}
            placeholder="Enter hospital or blood bank name"
            className="w-full p-3 rounded-md bg-[#fbeeee] text-[#a94442] focus:outline-none focus:ring-2 focus:ring-red-300"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Admin Name *</label>
          <input
            type="text"
            name="adminName"
            value={formData.adminName}
            onChange={handleChange}
            placeholder="Enter admin name"
            className="w-full p-3 rounded-md bg-[#fbeeee] text-[#a94442] focus:outline-none focus:ring-2 focus:ring-red-300"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Email Address *</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter email"
            className="w-full p-3 rounded-md bg-[#fbeeee] text-[#a94442] focus:outline-none focus:ring-2 focus:ring-red-300"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Phone Number *</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="10 digit mobile number"
            className="w-full p-3 rounded-md bg-[#fbeeee] text-[#a94442] focus:outline-none focus:ring-2 focus:ring-red-300"
            required
            pattern="[0-9]{10}"
            title="Please enter exactly 10 digits"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Type of Center *</label>
          <select 
            name="centerType"
            value={formData.centerType}
            onChange={handleChange}
            className="w-full p-3 rounded-md bg-[#fbeeee] text-[#a94442] focus:outline-none focus:ring-2 focus:ring-red-300"
            required
            disabled={loading}
          >
            <option value="">Select type</option>
            {CENTER_TYPES.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1 font-medium">City *</label>
          <input
            type="text"
            name="location.city"
            value={formData.location.city}
            onChange={handleChange}
            placeholder="Enter city"
            className="w-full p-3 rounded-md bg-[#fbeeee] text-[#a94442] focus:outline-none focus:ring-2 focus:ring-red-300"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">District *</label>
          <input
            type="text"
            name="location.district"
            value={formData.location.district}
            onChange={handleChange}
            placeholder="Enter district"
            className="w-full p-3 rounded-md bg-[#fbeeee] text-[#a94442] focus:outline-none focus:ring-2 focus:ring-red-300"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">State *</label>
          <input
            type="text"
            name="location.state"
            value={formData.location.state}
            onChange={handleChange}
            placeholder="Enter state"
            className="w-full p-3 rounded-md bg-[#fbeeee] text-[#a94442] focus:outline-none focus:ring-2 focus:ring-red-300"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block mb-1">Address</label>
          <input
            type="text"
            name="location.address"
            value={formData.location.address}
            onChange={handleChange}
            placeholder="Street address (optional)"
            className="w-full p-3 rounded-md bg-[#fbeeee] text-[#a94442] focus:outline-none focus:ring-2 focus:ring-red-300"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Password *</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Create a password (min 6 characters)"
            className="w-full p-3 rounded-md bg-[#fbeeee] text-[#a94442] focus:outline-none focus:ring-2 focus:ring-red-300"
            required
            minLength="6"
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Registering...' : 'Register'}
        </button>

        <div className="mt-4 text-center text-sm">
          Already registered?{" "}
          <Link to="/login" className="text-red-600 hover:underline">
            Login here
          </Link>
        </div>
      </form>
    </div>
  );
};

export default AdminRegistration;