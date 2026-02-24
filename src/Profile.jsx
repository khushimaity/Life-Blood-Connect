import React, { useState, useEffect } from 'react';
import { useAuth } from './components/AuthContext';
import { donorAPI } from './api/services';
import { toast } from 'react-toastify';

function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [donationHistory, setDonationHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      
      // Fetch donor profile
      const profileResponse = await donorAPI.getProfile();
      if (profileResponse.data.success) {
        setProfile(profileResponse.data.donor);
      }

      // Fetch donation history
      const historyResponse = await donorAPI.getDonationHistory();
      if (historyResponse.data.success) {
        setDonationHistory(historyResponse.data.donations || []);
      }
    } catch (error) {
      toast.error('Failed to load profile data');
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-yellow-700">Profile not found. Please complete your registration.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Profile Card */}
      <div className="flex items-center gap-6 bg-white shadow rounded-lg p-6">
        <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center text-4xl font-bold text-red-600">
          {user?.name?.charAt(0) || 'U'}
        </div>
        <div>
          <h2 className="text-xl font-bold">{user?.name}</h2>
          <p className="text-sm text-gray-600">Blood Group: {user?.bloodGroup || 'Not specified'}</p>
          <p className="text-sm text-gray-600">Contact: {user?.phone}</p>
          <p className="text-sm text-gray-600">Email: {user?.email}</p>
        </div>
      </div>

      {/* Donor Details */}
      <div className="bg-white p-6 shadow rounded-lg space-y-2">
        <h3 className="text-lg font-semibold mb-2 text-red-700">Donor Details</h3>
        <p><span className="font-medium">Age:</span> {profile.age} years</p>
        <p><span className="font-medium">Gender:</span> {profile.gender}</p>
        <p><span className="font-medium">Guardian:</span> {profile.guardianName} ({profile.guardianRelation})</p>
        <p><span className="font-medium">Guardian Phone:</span> {profile.guardianPhone}</p>
      </div>

      {/* College Details */}
      {profile.collegeDetails && (
        <div className="bg-white p-6 shadow rounded-lg space-y-2">
          <h3 className="text-lg font-semibold mb-2 text-red-700">College Details</h3>
          <p><span className="font-medium">College:</span> {profile.collegeDetails.collegeName}</p>
          <p><span className="font-medium">Department:</span> {profile.collegeDetails.department}</p>
          <p><span className="font-medium">Admission No:</span> {profile.collegeDetails.admissionNumber}</p>
          <p><span className="font-medium">Location:</span> {profile.collegeDetails.district}, {profile.collegeDetails.state}</p>
        </div>
      )}

      {/* Address */}
      {profile.address && (
        <div className="bg-white p-6 shadow rounded-lg space-y-2">
          <h3 className="text-lg font-semibold mb-2 text-red-700">Address</h3>
          <p>{profile.address.street}, {profile.address.city}, {profile.address.district}, {profile.address.state} - {profile.address.pincode}</p>
        </div>
      )}

      {/* Donation History */}
      <div className="bg-white p-6 shadow rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-red-700">Donation History</h3>
        {donationHistory.length > 0 ? (
          <table className="w-full text-left border">
            <thead className="bg-red-100">
              <tr>
                <th className="p-2">Date</th>
                <th className="p-2">Type</th>
                <th className="p-2">Units</th>
                <th className="p-2">Location</th>
                <th className="p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {donationHistory.map((entry, idx) => (
                <tr key={idx} className="border-t">
                  <td className="p-2">{new Date(entry.date).toLocaleDateString()}</td>
                  <td className="p-2">{entry.type}</td>
                  <td className="p-2">{entry.units}</td>
                  <td className="p-2">{entry.location}</td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      entry.status === 'Completed' ? 'bg-green-100 text-green-700' :
                      entry.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {entry.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-center py-4 text-gray-500">No donation history yet.</p>
        )}
        
        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="bg-red-50 p-3 rounded-lg text-center">
            <div className="text-xl font-bold text-red-600">{profile.totalDonations || 0}</div>
            <div className="text-xs text-gray-600">Total Donations</div>
          </div>
          <div className="bg-red-50 p-3 rounded-lg text-center">
            <div className="text-xl font-bold text-red-600">{profile.totalUnitsDonated || 0}</div>
            <div className="text-xs text-gray-600">Units Donated</div>
          </div>
          <div className="bg-red-50 p-3 rounded-lg text-center">
            <div className="text-xl font-bold text-red-600">
              {profile.lastDonationDate ? new Date(profile.lastDonationDate).toLocaleDateString() : 'Never'}
            </div>
            <div className="text-xs text-gray-600">Last Donation</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
          Edit Profile
        </button>
        <button className="bg-gray-200 text-black px-4 py-2 rounded hover:bg-gray-300">
          Change Password
        </button>
      </div>
    </div>
  );
}

export default Profile;