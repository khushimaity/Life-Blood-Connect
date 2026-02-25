import React, { useState } from "react";
import AdminDashboardPage from "./AdminDashboardPage";
import { bloodRequestAPI } from "../api/services";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BLOOD_GROUPS, REQUEST_REASONS } from '../constants';

const PostRequest = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    patientName: "",
    bloodGroup: "",
    requiredUnits: 1,
    hospitalName: "",
    reason: "",
    reasonDetails: "",
    priority: "Normal", // Default to Normal
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
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await bloodRequestAPI.create({
        ...formData,
        requiredUnits: parseInt(formData.requiredUnits)
      });

      if (response.data.success) {
        toast.success('Request posted successfully!');
        // Reset form or redirect
        setTimeout(() => {
          // navigate to requests page
        }, 2000);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to post request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminDashboardPage>
      <ToastContainer />
      <div className="max-w-3xl mx-auto p-6">
        <h2 className="text-2xl font-bold text-red-700 mb-6">Post Blood Request</h2>
        
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-md space-y-4">
          {/* Priority Selection */}
          <div>
            <label className="block font-medium mb-2">Priority</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="priority"
                  value="Normal"
                  checked={formData.priority === 'Normal'}
                  onChange={handleChange}
                  className="mr-2"
                /> Normal
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="priority"
                  value="Urgent"
                  checked={formData.priority === 'Urgent'}
                  onChange={handleChange}
                  className="mr-2"
                /> Urgent
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="priority"
                  value="Emergency"
                  checked={formData.priority === 'Emergency'}
                  onChange={handleChange}
                  className="mr-2"
                /> Emergency
              </label>
            </div>
          </div>

          {/* Rest of your form fields - same as EmergencyRequest but without forced Emergency priority */}
          {/* ... */}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition"
          >
            {loading ? 'Posting...' : 'Post Request'}
          </button>
        </form>
      </div>
    </AdminDashboardPage>
  );
};

export default PostRequest;