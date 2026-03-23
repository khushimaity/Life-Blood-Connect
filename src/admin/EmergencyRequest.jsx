import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { bloodRequestAPI } from "../api/services";
import { BLOOD_GROUPS, REQUEST_REASONS } from '../constants';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const EmergencyRequest = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [coordinates, setCoordinates] = useState({ lat: null, lng: null });
  const [verificationStep, setVerificationStep] = useState('none'); // 'none', 'requested', 'verified'
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('');
  
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

  const getCurrentLocation = () => {
    setLocationEnabled(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoordinates({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          toast.success('📍 Location captured successfully!');
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationEnabled(false);
          toast.error('Could not get your location. Please enable location services.');
        }
      );
    } else {
      toast.error('Geolocation is not supported by your browser');
      setLocationEnabled(false);
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

  // Request verification code for a phone number
  const requestVerification = async (phoneNumber) => {
    try {
      setVerificationStatus('sending');
      
      const response = await axios.post(`${API_BASE_URL}/twilio/request-verification`, {
        phoneNumber: phoneNumber
      });
      
      if (response.data.success) {
        setVerificationStep('requested');
        setVerificationStatus('Code sent! Check your phone for SMS/call');
        toast.info('📞 Verification code sent! Check your phone.');
      }
    } catch (error) {
      console.error('Verification request failed:', error);
      setVerificationStatus('Failed to send code. Try again.');
      toast.error('Failed to send verification code');
    }
  };

  // Verify the code entered by user
  const verifyCode = async (phoneNumber, code) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/twilio/verify-code`, {
        phoneNumber: phoneNumber,
        code: code
      });
      
      if (response.data.success) {
        setVerificationStep('verified');
        setVerificationStatus('✅ Phone verified successfully!');
        toast.success('Phone verified! You can now submit.');
      } else {
        setVerificationStatus('❌ Invalid code. Try again.');
        toast.error('Invalid verification code');
      }
    } catch (error) {
      setVerificationStatus('Verification failed');
      toast.error('Verification failed');
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

      // ADD VERIFICATION CHECK
      if (verificationStep !== 'verified') {
        toast.error('Please verify your phone number first');
        setLoading(false);
        return;
      }

      console.log('Form data before sending:', JSON.stringify(formData, null, 2));

      // Prepare data EXACTLY as backend expects
      const requestData = {
        patientName: formData.patientName,
        patientAge: null,
        patientGender: null,
        bloodGroup: formData.bloodGroup,
        requiredUnits: parseInt(formData.requiredUnits),
        componentType: 'Whole Blood',
        hospitalName: formData.hospitalName,
        location: {
  type: "Point",
  coordinates:
    coordinates.lat && coordinates.lng
      ? [coordinates.lng, coordinates.lat]
      : undefined
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
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        
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
        console.error('No response received:', error.request);
        toast.error('No response from server. Please check if backend is running.');
      } else {
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

        {/* Location Coordinates for SMS Alerts */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
            <span>📍</span> Emergency Alert Location
          </h3>
          <p className="text-sm text-blue-600 mb-3">
            This will be used to find nearby donors for SMS alerts
          </p>
          
          {!coordinates.lat ? (
            <button
              type="button"
              onClick={getCurrentLocation}
              disabled={locationEnabled}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              <span>📍</span>
              {locationEnabled ? 'Getting location...' : 'Share My Location'}
            </button>
          ) : (
            <div className="bg-green-100 text-green-700 p-3 rounded flex items-center gap-2">
              <span>✅</span>
              <span>Location captured: {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}</span>
            </div>
          )}
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
            disabled={loading || verificationStep === 'verified'}
          />
        </div>

        {/* Phone Verification Section */}
        {formData.contactPerson.phone.length === 10 && verificationStep !== 'verified' && (
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h3 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
              <span>📱</span> Phone Verification Required
            </h3>
            <p className="text-sm text-yellow-600 mb-3">
              For emergency alerts, we need to verify this phone number can receive SMS
            </p>
            
            {verificationStep === 'none' && (
              <button
                type="button"
                onClick={() => requestVerification(formData.contactPerson.phone)}
                disabled={verificationStatus === 'sending'}
                className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition disabled:opacity-50"
              >
                {verificationStatus === 'sending' ? 'Sending...' : 'Send Verification Code'}
              </button>
            )}
            
            {verificationStep === 'requested' && (
              <div className="space-y-3">
                <p className="text-sm text-green-600">✅ Code sent! Enter it below:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    maxLength="6"
                    className="flex-1 p-3 border rounded focus:ring-2 focus:ring-yellow-300"
                  />
                  <button
                    type="button"
                    onClick={() => verifyCode(formData.contactPerson.phone, verificationCode)}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                  >
                    Verify
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => requestVerification(formData.contactPerson.phone)}
                  className="text-sm text-yellow-600 hover:underline"
                >
                  Resend code
                </button>
              </div>
            )}
            
            {verificationStatus && verificationStep !== 'verified' && (
              <p className="text-sm mt-2 text-gray-600">{verificationStatus}</p>
            )}
          </div>
        )}

        {verificationStep === 'verified' && (
          <div className="bg-green-100 text-green-700 p-3 rounded-lg flex items-center gap-2">
            <span>✅</span>
            <span>Phone verified! You can now submit emergency request.</span>
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading || verificationStep !== 'verified'}
          className="w-full bg-red-600 text-white px-6 py-3 rounded hover:bg-red-700 transition disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit Emergency Request'}
        </button>
      </form>
    </div>
  );
};

export default EmergencyRequest;