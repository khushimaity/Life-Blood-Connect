import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BLOOD_GROUPS, GENDER_OPTIONS } from '../constants'; // Add this import

const DonorRegistration = () => {
  const [formData, setFormData] = useState({
    // User data
    name: '',
    email: '',
    password: '',
    phone: '',
    bloodGroup: 'O+',
    
    // Donor data
    age: '',
    gender: '',
    guardianName: '',
    guardianPhone: '',
    guardianRelation: '',
    
    // College details
    collegeDetails: {
      state: '',
      district: '',
      collegeName: '',
      admissionNumber: '',
      department: ''
    },
    
    // Address
    address: {
      city: '',
      district: '',
      state: ''
    }
  });

  const [loading, setLoading] = useState(false);
  const { registerDonor } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
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
    
    // Validation
    if (parseInt(formData.age) < 18) {
      toast.error('You must be at least 18 years old to register.');
      return;
    }

    // Phone number validation
    if (!/^\d{10}$/.test(formData.phone)) {
      toast.error('Phone number must be 10 digits');
      return;
    }

    if (!/^\d{10}$/.test(formData.guardianPhone)) {
      toast.error('Guardian phone number must be 10 digits');
      return;
    }

    setLoading(true);

    try {
      // Convert age to number
      const dataToSend = {
        ...formData,
        age: parseInt(formData.age)
      };
      
      console.log('Sending data:', dataToSend); // Debug log
      
      const result = await registerDonor(dataToSend);
      
      if (result.success) {
        toast.success('Registration successful! Redirecting to dashboard...');
        setTimeout(() => {
          navigate('/donor-dashboard');
        }, 2000);
      } else {
        // Show validation errors
        toast.error(result.message || 'Registration failed. Please check all fields.');
      }
    } catch (error) {
      toast.error('Registration failed. Please try again.');
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto mt-12 p-8 bg-[#fff8f8] rounded-lg shadow-md">
      <ToastContainer position="top-right" autoClose={3000} />
      <h2 className="text-3xl font-bold mb-8 text-center text-[#1c0d0d]">Registration Form</h2>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {/* Personal Details */}
        <h3 className="text-xl font-bold mb-4 underline md:col-span-2">Personal Details</h3>
        
        <div>
          <label className="block mb-1">Name *</label>
          <input 
            type="text" 
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter name" 
            className="w-full p-3 rounded-md bg-[#fbeeee]" 
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block mb-1">Phone no *</label>
          <input 
            type="tel" 
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="10 digit mobile number" 
            className="w-full p-3 rounded-md bg-[#fbeeee]" 
            required
            pattern="[0-9]{10}"
            title="Please enter exactly 10 digits"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block mb-1">Age *</label>
          <input
            type="number"
            name="age"
            value={formData.age}
            onChange={handleChange}
            placeholder="Enter Age"
            min="18"
            max="65"
            className="w-full p-3 rounded-md bg-[#fbeeee]"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block mb-1">Email *</label>
          <input 
            type="email" 
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter email" 
            className="w-full p-3 rounded-md bg-[#fbeeee]" 
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block mb-1">Password *</label>
          <input 
            type="password" 
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Min 6 characters" 
            className="w-full p-3 rounded-md bg-[#fbeeee]" 
            required
            minLength="6"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block mb-1">Blood Group *</label>
          <select 
            name="bloodGroup"
            value={formData.bloodGroup}
            onChange={handleChange}
            className="w-full p-3 rounded-md bg-[#fbeeee]"
            required
            disabled={loading}
          >
            {BLOOD_GROUPS.map(group => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1">Gender *</label>
          <select 
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="w-full p-3 rounded-md bg-[#fbeeee]"
            required
            disabled={loading}
          >
            <option value="">--Select Gender--</option>
            {GENDER_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1">Guardian name *</label>
          <input 
            type="text" 
            name="guardianName"
            value={formData.guardianName}
            onChange={handleChange}
            placeholder="Enter Guardian's name" 
            className="w-full p-3 rounded-md bg-[#fbeeee]" 
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block mb-1">Relationship with Guardian *</label>
          <input 
            type="text" 
            name="guardianRelation"
            value={formData.guardianRelation}
            onChange={handleChange}
            placeholder="e.g., Father, Mother, Spouse" 
            className="w-full p-3 rounded-md bg-[#fbeeee]" 
            required
            disabled={loading}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block mb-1">Guardian Phone no *</label>
          <input 
            type="tel" 
            name="guardianPhone"
            value={formData.guardianPhone}
            onChange={handleChange}
            placeholder="10 digit guardian mobile number" 
            className="w-full p-3 rounded-md bg-[#fbeeee]" 
            required
            pattern="[0-9]{10}"
            title="Please enter exactly 10 digits"
            disabled={loading}
          />
        </div>

        <hr className="md:col-span-2 my-10" />

        {/* College Details */}
        <h3 className="text-xl font-bold mb-4 underline md:col-span-2">College Details</h3>
        
        <div>
          <label className="block mb-1">State *</label>
          <select 
            name="collegeDetails.state"
            value={formData.collegeDetails.state}
            onChange={handleChange}
            className="w-full p-3 rounded-md bg-[#fbeeee]"
            required
            disabled={loading}
          >
            <option value="">--Select a State--</option>
            <option value="Kerala">Kerala</option>
            <option value="Tamil Nadu">Tamil Nadu</option>
            <option value="Karnataka">Karnataka</option>
          </select>
        </div>

        <div>
          <label className="block mb-1">District *</label>
          <select 
            name="collegeDetails.district"
            value={formData.collegeDetails.district}
            onChange={handleChange}
            className="w-full p-3 rounded-md bg-[#fbeeee]"
            required
            disabled={loading}
          >
            <option value="">--Select District--</option>
            <option value="Kollam">Kollam</option>
            <option value="Ernakulam">Ernakulam</option>
            <option value="Thiruvananthapuram">Thiruvananthapuram</option>
          </select>
        </div>

        <div>
          <label className="block mb-1">College Name *</label>
          <select 
            name="collegeDetails.collegeName"
            value={formData.collegeDetails.collegeName}
            onChange={handleChange}
            className="w-full p-3 rounded-md bg-[#fbeeee]"
            required
            disabled={loading}
          >
            <option value="">--Select College--</option>
            <option value="TKM College of Engineering">TKM College of Engineering</option>
            <option value="College of Engineering Trivandrum">College of Engineering Trivandrum</option>
            <option value="Government Engineering College">Government Engineering College</option>
          </select>
        </div>

        <div>
          <label className="block mb-1">Admission Number *</label>
          <input 
            type="text" 
            name="collegeDetails.admissionNumber"
            value={formData.collegeDetails.admissionNumber}
            onChange={handleChange}
            placeholder="Enter admission number" 
            className="w-full p-3 rounded-md bg-[#fbeeee]" 
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block mb-1">Department *</label>
          <select 
            name="collegeDetails.department"
            value={formData.collegeDetails.department}
            onChange={handleChange}
            className="w-full p-3 rounded-md bg-[#fbeeee]"
            required
            disabled={loading}
          >
            <option value="">--Select Department--</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Electronics">Electronics</option>
            <option value="Mechanical">Mechanical</option>
            <option value="Civil">Civil</option>
            <option value="Electrical">Electrical</option>
          </select>
        </div>

        {/* Address */}
        <div className="md:col-span-2">
          <label className="block mb-1">City *</label>
          <input 
            type="text" 
            name="address.city"
            value={formData.address.city}
            onChange={handleChange}
            placeholder="Enter city" 
            className="w-full p-3 rounded-md bg-[#fbeeee]" 
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block mb-1">Address District *</label>
          <input 
            type="text" 
            name="address.district"
            value={formData.address.district}
            onChange={handleChange}
            placeholder="Enter district" 
            className="w-full p-3 rounded-md bg-[#fbeeee]" 
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block mb-1">Address State *</label>
          <input 
            type="text" 
            name="address.state"
            value={formData.address.state}
            onChange={handleChange}
            placeholder="Enter state" 
            className="w-full p-3 rounded-md bg-[#fbeeee]" 
            required
            disabled={loading}
          />
        </div>

        {/* Submit Button */}
        <div className="md:col-span-2">
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-md transition disabled:opacity-50"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </div>
        
        <div className="md:col-span-2 text-center text-sm">
          Already have an account?{" "}
          <Link to="/login" className="text-red-600 hover:underline">
            Login now
          </Link>
        </div>
      </form>
    </div>
  );
};

export default DonorRegistration;