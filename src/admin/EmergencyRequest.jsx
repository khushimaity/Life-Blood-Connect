import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { bloodRequestAPI } from "../api/services";
import { BLOOD_GROUPS, REQUEST_REASONS, REQUEST_PRIORITIES } from '../constants';
import axios from 'axios';

const EmergencyRequest = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    patientName: "",
    bloodGroup: "",
    hospitalName: "",
    reason: "",
    reasonDetails: "",
    priority: "Emergency",
    requiredUnits: 1,
    neededBy: "",
    contactPerson: {
      name: "",
      phone: "",
      relationship: "Self"
    },
    location: {
      city: "",
      address: ""
    }
  });

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
  setLoading(true);

  try {
    // Validate phone number
    if (!/^\d{10}$/.test(formData.contactPerson.phone)) {
      toast.error('Contact number must be 10 digits');
      setLoading(false);
      return;
    }

    // Log the form data
    console.log('Form data before sending:', JSON.stringify(formData, null, 2));

    // Prepare data EXACTLY as backend expects
    const requestData = {
      patientName: formData.patientName,
      patientAge: null, // Optional - not in form
      patientGender: null, // Optional - not in form
      bloodGroup: formData.bloodGroup,
      requiredUnits: parseInt(formData.requiredUnits),
      componentType: 'Whole Blood',
      hospitalName: formData.hospitalName,
      location: {
        city: formData.location.city,
        address: formData.location.address || ''
      },
      contactPerson: {
        name: formData.contactPerson.name,
        phone: formData.contactPerson.phone,
        relationship: formData.contactPerson.relationship || 'Self'
      },
      reason: formData.reason,
      reasonDetails: formData.reasonDetails || '',
      priority: 'Emergency',
      neededBy: formData.neededBy ? new Date(formData.neededBy).toISOString() : new Date().toISOString(),
      notes: formData.reasonDetails || ''
    };

    console.log('Sending to backend:', JSON.stringify(requestData, null, 2));

    // Use the API service
    const response = await bloodRequestAPI.create(requestData);
    
    console.log('Response from server:', response.data);

    if (response.data.success) {
      toast.success('Emergency request submitted successfully!');
      setTimeout(() => {
        navigate('/requests');
      }, 2000);
    }
  } catch (error) {
    console.error('Error submitting request:', error);
    
    // Detailed error logging
    if (error.response) {
      // The request was made and the server responded with a status code
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
      console.error('Error response headers:', error.response.headers);
      
      // Show specific error message
      if (error.response.data.errors) {
        const errorMessages = error.response.data.errors.map(e => e.msg).join('\n');
        toast.error(errorMessages);
      } else if (error.response.data.message) {
        toast.error(error.response.data.message);
      } else if (error.response.data.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Server error. Please check console.');
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
      toast.error('No response from server. Please check if backend is running.');
    } else {
      // Something happened in setting up the request
      console.error('Request setup error:', error.message);
      toast.error('Request failed. Please try again.');
    }
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-md shadow-md">
      <ToastContainer position="top-right" autoClose={3000} />
      <h1 className="text-2xl font-bold mb-6 text-red-600">Post Emergency Request</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Patient Name *</label>
          <input 
            type="text" 
            name="patientName" 
            placeholder="Patient Name" 
            value={formData.patientName} 
            onChange={handleChange} 
            required 
            className="w-full p-3 border rounded focus:ring-2 focus:ring-red-300"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Blood Group *</label>
          <select 
            name="bloodGroup" 
            value={formData.bloodGroup} 
            onChange={handleChange} 
            required 
            className="w-full p-3 border rounded focus:ring-2 focus:ring-red-300"
            disabled={loading}
          >
            <option value="">Select Blood Group</option>
            {BLOOD_GROUPS.map(group => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1 font-medium">Hospital Name *</label>
          <input 
            type="text" 
            name="hospitalName" 
            placeholder="Hospital Name" 
            value={formData.hospitalName} 
            onChange={handleChange} 
            required 
            className="w-full p-3 border rounded focus:ring-2 focus:ring-red-300"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Reason for Request *</label>
          <select 
            name="reason" 
            value={formData.reason} 
            onChange={handleChange} 
            required 
            className="w-full p-3 border rounded focus:ring-2 focus:ring-red-300"
            disabled={loading}
          >
            <option value="">Select Reason</option>
            {REQUEST_REASONS.map(reason => (
              <option key={reason.value} value={reason.value}>
                {reason.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1 font-medium">Additional Details</label>
          <textarea 
            name="reasonDetails" 
            placeholder="Provide any additional details..." 
            value={formData.reasonDetails} 
            onChange={handleChange} 
            rows="3"
            className="w-full p-3 border rounded focus:ring-2 focus:ring-red-300"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Units Required *</label>
          <input 
            type="number" 
            name="requiredUnits" 
            min="1" 
            max="10"
            value={formData.requiredUnits} 
            onChange={handleChange} 
            required 
            className="w-full p-3 border rounded focus:ring-2 focus:ring-red-300"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Needed By *</label>
          <input 
            type="datetime-local" 
            name="neededBy" 
            value={formData.neededBy} 
            onChange={handleChange} 
            required 
            className="w-full p-3 border rounded focus:ring-2 focus:ring-red-300"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Hospital City *</label>
          <input 
            type="text" 
            name="location.city" 
            placeholder="City" 
            value={formData.location.city} 
            onChange={handleChange} 
            required 
            className="w-full p-3 border rounded focus:ring-2 focus:ring-red-300"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Hospital Address</label>
          <input 
            type="text" 
            name="location.address" 
            placeholder="Full address" 
            value={formData.location.address} 
            onChange={handleChange} 
            className="w-full p-3 border rounded focus:ring-2 focus:ring-red-300"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Contact Person Name *</label>
          <input 
            type="text" 
            name="contactPerson.name" 
            placeholder="Contact person name" 
            value={formData.contactPerson.name} 
            onChange={handleChange} 
            required 
            className="w-full p-3 border rounded focus:ring-2 focus:ring-red-300"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Contact Number *</label>
          <input 
            type="tel" 
            name="contactPerson.phone" 
            placeholder="10 digit mobile number" 
            value={formData.contactPerson.phone} 
            onChange={handleChange} 
            required 
            pattern="[0-9]{10}"
            title="Please enter exactly 10 digits"
            className="w-full p-3 border rounded focus:ring-2 focus:ring-red-300"
            disabled={loading}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-red-600 text-white px-6 py-3 rounded hover:bg-red-700 transition disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit Emergency Request'}
        </button>
      </form>
    </div>
  );
};

export default EmergencyRequest;