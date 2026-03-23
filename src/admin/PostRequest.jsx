import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminDashboardPage from "./AdminDashboardPage";
import { bloodRequestAPI, adminAPI } from "../api/services";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const REQUEST_REASONS = [
  { value: 'Surgery', label: 'Surgery' },
  { value: 'Accident', label: 'Accident' },
  { value: 'Chronic Illness', label: 'Chronic Illness' },
  { value: 'Cancer Treatment', label: 'Cancer Treatment' },
  { value: 'Childbirth', label: 'Childbirth' },
  { value: 'Transfusion', label: 'Transfusion' },
  { value: 'Other', label: 'Other' }
];

const PostRequest = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [hospitalInfo, setHospitalInfo] = useState(null);
  const [formData, setFormData] = useState({
    patientName: "",
    patientAge: "",
    patientGender: "",
    bloodGroup: "",
    requiredUnits: 1,
    componentType: "Whole Blood",
    reason: "",
    reasonDetails: "",
    priority: "Normal",
    neededBy: "",
    contactPerson: {
      name: "",
      phone: "",
      relationship: "Self"
    }
  });

  // Fetch hospital info on component mount
  useEffect(() => {
    fetchHospitalInfo();
  }, []);

  const fetchHospitalInfo = async () => {
    try {
      const response = await adminAPI.getAdminProfile();
      
      if (response.data.success) {
        setHospitalInfo(response.data.admin);
      }
    } catch (error) {
      console.error('Error fetching hospital info:', error);
    }
  };

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

  const validateForm = () => {
    // Required fields check
    if (!formData.patientName?.trim()) {
      toast.error('Patient name is required');
      return false;
    }
    if (!formData.bloodGroup) {
      toast.error('Blood group is required');
      return false;
    }
    if (!formData.reason) {
      toast.error('Reason for request is required');
      return false;
    }
    if (!formData.neededBy) {
      toast.error('Required by date is required');
      return false;
    }
    if (!formData.contactPerson.name?.trim()) {
      toast.error('Contact person name is required');
      return false;
    }
    if (!/^\d{10}$/.test(formData.contactPerson.phone)) {
      toast.error('Contact number must be 10 digits');
      return false;
    }
    
    // Age validation if provided
    if (formData.patientAge && (formData.patientAge < 0 || formData.patientAge > 120)) {
      toast.error('Please enter a valid age');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      // Prepare data for backend - hospital info will be taken from token/session
      const requestData = {
        patientName: formData.patientName,
        patientAge: formData.patientAge ? parseInt(formData.patientAge) : null,
        patientGender: formData.patientGender || null,
        bloodGroup: formData.bloodGroup,
        requiredUnits: parseInt(formData.requiredUnits),
        componentType: formData.componentType,
        reason: formData.reason,
        reasonDetails: formData.reasonDetails || '',
        priority: formData.priority,
        neededBy: new Date(formData.neededBy).toISOString(),
        contactPerson: {
          name: formData.contactPerson.name,
          phone: formData.contactPerson.phone,
          relationship: formData.contactPerson.relationship || 'Self'
        }
      };

      console.log('Submitting request:', requestData);

      const response = await bloodRequestAPI.create(requestData);

      if (response.data.success) {
        toast.success('Request posted successfully!');
        
        // Reset form
        setFormData({
          patientName: "",
          patientAge: "",
          patientGender: "",
          bloodGroup: "",
          requiredUnits: 1,
          componentType: "Whole Blood",
          reason: "",
          reasonDetails: "",
          priority: "Normal",
          neededBy: "",
          contactPerson: {
            name: "",
            phone: "",
            relationship: "Self"
          }
        });
        
        // Redirect to requests page
        setTimeout(() => {
          navigate('/requests');
        }, 2000);
      }
    } catch (error) {
      console.error('Error posting request:', error);
      
      if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors.map(e => e.msg).join('\n');
        toast.error(errorMessages);
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to post request. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Display hospital info banner
  const hospitalBanner = hospitalInfo && (
    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
      <div className="flex">
        <div className="flex-shrink-0">
          <span className="text-blue-500 text-xl">🏥</span>
        </div>
        <div className="ml-3">
          <p className="text-sm text-blue-700">
            Posting as <span className="font-semibold">{hospitalInfo.organizationName}</span>
            {hospitalInfo.location?.city && `, ${hospitalInfo.location.city}`}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <AdminDashboardPage>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="max-w-3xl mx-auto p-6">
        <h2 className="text-2xl font-bold text-red-700 mb-6">Post Blood Request</h2>
        
        {hospitalBanner}
        
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-md space-y-4">
          {/* Priority Selection */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block font-medium mb-3 text-gray-700">Priority Level</label>
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="priority"
                  value="Normal"
                  checked={formData.priority === 'Normal'}
                  onChange={handleChange}
                  className="mr-2 h-4 w-4 text-red-600"
                />
                <span className="text-gray-700">Normal</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="priority"
                  value="Urgent"
                  checked={formData.priority === 'Urgent'}
                  onChange={handleChange}
                  className="mr-2 h-4 w-4 text-orange-600"
                />
                <span className="text-orange-600 font-medium">Urgent</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="priority"
                  value="Emergency"
                  checked={formData.priority === 'Emergency'}
                  onChange={handleChange}
                  className="mr-2 h-4 w-4 text-red-600"
                />
                <span className="text-red-600 font-bold">Emergency</span>
              </label>
            </div>
          </div>

          {/* Patient Information */}
          <div>
            <h3 className="font-semibold text-gray-700 mb-2 border-b pb-1">Patient Information</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-3">
              <label className="block mb-1 font-medium">Patient Name *</label>
              <input
                type="text"
                name="patientName"
                value={formData.patientName}
                onChange={handleChange}
                placeholder="Enter patient full name"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-300"
                required
                disabled={loading}
              />
            </div>
            
            <div>
              <label className="block mb-1 font-medium">Age</label>
              <input
                type="number"
                name="patientAge"
                value={formData.patientAge}
                onChange={handleChange}
                placeholder="Age"
                min="0"
                max="120"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-300"
                disabled={loading}
              />
            </div>
            
            <div>
              <label className="block mb-1 font-medium">Gender</label>
              <select
                name="patientGender"
                value={formData.patientGender}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-300"
                disabled={loading}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Blood Requirements */}
          <div>
            <h3 className="font-semibold text-gray-700 mb-2 border-b pb-1">Blood Requirements</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block mb-1 font-medium">Blood Group *</label>
              <select
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-300"
                required
                disabled={loading}
              >
                <option value="">Select Blood Group</option>
                {BLOOD_GROUPS.map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block mb-1 font-medium">Units Required *</label>
              <input
                type="number"
                name="requiredUnits"
                value={formData.requiredUnits}
                onChange={handleChange}
                min="1"
                max="10"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-300"
                required
                disabled={loading}
              />
            </div>
            
            <div>
              <label className="block mb-1 font-medium">Component Type</label>
              <select
                name="componentType"
                value={formData.componentType}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-300"
                disabled={loading}
              >
                <option value="Whole Blood">Whole Blood</option>
                <option value="Packed RBC">Packed RBC</option>
                <option value="Platelets">Platelets</option>
                <option value="Plasma">Plasma</option>
                <option value="Cryoprecipitate">Cryoprecipitate</option>
              </select>
            </div>
          </div>

          {/* Request Details */}
          <div>
            <h3 className="font-semibold text-gray-700 mb-2 border-b pb-1">Request Details</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-medium">Reason *</label>
              <select
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-300"
                required
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
              <label className="block mb-1 font-medium">Needed By *</label>
              <input
                type="datetime-local"
                name="neededBy"
                value={formData.neededBy}
                onChange={handleChange}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-300"
                required
                disabled={loading}
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block mb-1 font-medium">Additional Details</label>
              <textarea
                name="reasonDetails"
                value={formData.reasonDetails}
                onChange={handleChange}
                placeholder="Any additional information about the request..."
                rows="3"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-300"
                disabled={loading}
              />
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="font-semibold text-gray-700 mb-2 border-b pb-1">Contact Information</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block mb-1 font-medium">Contact Person Name *</label>
              <input
                type="text"
                name="contactPerson.name"
                value={formData.contactPerson.name}
                onChange={handleChange}
                placeholder="Contact person name"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-300"
                required
                disabled={loading}
              />
            </div>
            
            <div>
              <label className="block mb-1 font-medium">Phone Number *</label>
              <input
                type="tel"
                name="contactPerson.phone"
                value={formData.contactPerson.phone}
                onChange={handleChange}
                placeholder="10 digit mobile number"
                pattern="[0-9]{10}"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-300"
                required
                disabled={loading}
              />
            </div>
            
            <div>
              <label className="block mb-1 font-medium">Relationship</label>
              <input
                type="text"
                name="contactPerson.relationship"
                value={formData.contactPerson.relationship}
                onChange={handleChange}
                placeholder="e.g., Self, Spouse, Parent"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-300"
                disabled={loading}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition disabled:opacity-50 text-lg font-semibold mt-4"
          >
            {loading ? 'Posting Request...' : 'Post Blood Request'}
          </button>
        </form>
      </div>
    </AdminDashboardPage>
  );
};

export default PostRequest;