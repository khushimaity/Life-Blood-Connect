import React, { useState, useEffect } from "react";
import DonorDashboardPage from "./DonorDashboardPage";
import { useAuth } from "../components/AuthContext";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const DonorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [donorData, setDonorData] = useState({
    name: "",
    donorId: "",
    formattedDonorId: "",
    donationHistory: [],
    nextEligibility: "",
    stats: {
      totalDonations: 0,
      totalUnits: 0,
      lastDonationDate: null
    },
    createdAt: null,
    isEligible: false
  });

  useEffect(() => {
    fetchDonorData();
  }, []);

  const fetchDonorData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      // Fetch donor profile
      const profileResponse = await axios.get('http://localhost:5000/api/donors/profile/me', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Fetch donation history
      const historyResponse = await axios.get('http://localhost:5000/api/donors/donation-history', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (profileResponse.data.success) {
        const donor = profileResponse.data.donor;
        
        // Generate sequential donor ID based on registration order
        const generateDonorId = async () => {
          try {
            const countResponse = await axios.get('http://localhost:5000/api/donors/count-before', {
              params: { donorId: donor._id },
              headers: { Authorization: `Bearer ${token}` }
            });
            
            if (countResponse.data.success) {
              const sequentialNumber = countResponse.data.count + 1;
              return `LBD-${String(sequentialNumber).padStart(6, '0')}`;
            }
          } catch (error) {
            console.error('Error getting donor count:', error);
          }
          
          // Fallback: use timestamp
          const timestamp = Date.now().toString().slice(-6);
          return `LBD-${timestamp}`;
        };

        const formattedDonorId = await generateDonorId();
        
        // Check if donor is eligible
        const isEligible = donor.nextEligibleDate 
          ? new Date(donor.nextEligibleDate) <= new Date()
          : true;
        
        setDonorData({
          name: user?.name || donor.name || "Unknown",
          donorId: donor._id,
          formattedDonorId: formattedDonorId,
          donationHistory: historyResponse.data.success ? historyResponse.data.donations : [],
          nextEligibility: donor.nextEligibleDate 
            ? new Date(donor.nextEligibleDate).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })
            : "Not available",
          stats: historyResponse.data.success ? historyResponse.data.stats : {
            totalDonations: donor.totalDonations || 0,
            totalUnits: donor.totalUnitsDonated || 0,
            lastDonationDate: donor.lastDonationDate
          },
          createdAt: donor.createdAt,
          isEligible: isEligible
        });
      }
    } catch (error) {
      console.error('Error fetching donor data:', error);
      
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        navigate('/login');
      } else {
        toast.error('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleScheduleDonation = () => {
    navigate('/schedule-donation');
  };

  const handleRequestBlood = () => {
    navigate('/request-blood');
  };

  const handleViewFullHistory = () => {
    navigate('/donation-history');
  };

  const getDonorLevel = (donations) => {
    if (donations === 0) return { level: 'New Donor', color: 'gray' };
    if (donations < 3) return { level: 'Bronze Donor', color: 'amber' };
    if (donations < 5) return { level: 'Silver Donor', color: 'slate' };
    if (donations < 10) return { level: 'Gold Donor', color: 'yellow' };
    if (donations < 20) return { level: 'Platinum Donor', color: 'blue' };
    return { level: 'Diamond Donor', color: 'purple' };
  };

  if (loading) {
    return (
      <DonorDashboardPage>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-600"></div>
        </div>
      </DonorDashboardPage>
    );
  }

  const donorLevel = getDonorLevel(donorData.stats.totalDonations);
  const isEligibleNow = donorData.isEligible;

  return (
    <DonorDashboardPage>
      <main className="flex-1 px-8 py-10 bg-[#fffafa] min-h-screen overflow-auto">
        <h1 className="text-3xl font-bold text-[#1c0d0d] mb-6">Donor Dashboard</h1>

        {/* Profile Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="text-center md:text-left flex-1">
              <h2 className="text-3xl font-bold text-[#1c0d0d]">{donorData.name}</h2>
              <div className="flex flex-wrap gap-4 mt-2 text-gray-600">
                <p className="flex items-center gap-2">
                  <span className="font-semibold">Donor ID:</span> 
                  <span className="text-red-600 font-mono bg-red-50 px-3 py-1 rounded-lg">
                    {donorData.formattedDonorId}
                  </span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="font-semibold">Blood Group:</span>
                  <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-bold">
                    {user?.bloodGroup || 'Not specified'}
                  </span>
                </p>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-${donorLevel.color}-100 text-${donorLevel.color}-800`}>
                  {donorLevel.level}
                </span>
                <span className={`inline-flex items-center gap-1 text-sm ${isEligibleNow ? 'text-green-600' : 'text-yellow-600'}`}>
                  <span className={`w-2 h-2 rounded-full ${isEligibleNow ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                  {isEligibleNow ? 'Eligible to donate' : 'Not eligible'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl shadow-lg p-6">
            <div className="text-4xl font-bold mb-2">{donorData.stats.totalDonations}</div>
            <div className="text-sm opacity-90">Total Donations</div>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-6">
            <div className="text-4xl font-bold mb-2">{donorData.stats.totalUnits}</div>
            <div className="text-sm opacity-90">Units Donated</div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-lg p-6">
            <div className="text-4xl font-bold mb-2">
              {donorData.stats.lastDonationDate ? formatDate(donorData.stats.lastDonationDate) : 'Never'}
            </div>
            <div className="text-sm opacity-90">Last Donation</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl shadow-lg p-6">
            <div className="text-4xl font-bold mb-2">{donorData.stats.totalUnits * 3}</div>
            <div className="text-sm opacity-90">Lives Saved</div>
          </div>
        </div>

        {/* Donation History */}
        <section className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-[#1c0d0d]">Recent Donation History</h3>
            {donorData.donationHistory.length > 0 && (
              <button 
                onClick={handleViewFullHistory}
                className="text-red-600 hover:text-red-700 font-medium text-sm flex items-center gap-1"
              >
                View All <span>→</span>
              </button>
            )}
          </div>
          
          {donorData.donationHistory.length > 0 ? (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-red-50">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-red-700">Date</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-red-700">Type</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-red-700">Location</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-red-700">Units</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-red-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {donorData.donationHistory.slice(0, 5).map((entry, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 text-sm text-red-600 font-medium">
                          {formatDate(entry.date)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">{entry.type}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{entry.location}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{entry.units || 1}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            entry.status === 'Completed' 
                              ? 'bg-green-100 text-green-700' 
                              : entry.status === 'Pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {entry.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <div className="text-6xl mb-4">🩸</div>
              <h4 className="text-xl font-semibold text-gray-700 mb-2">No Donation History Yet</h4>
            </div>
          )}
        </section>

        {/* Next Eligibility & Status */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-[#1c0d0d] mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Next Eligibility
            </h3>
            <p className="text-gray-700">
              {donorData.nextEligibility !== "Not available" ? (
                <>You are eligible to donate blood again on{' '}
                <strong className="text-red-600">{donorData.nextEligibility}</strong></>
              ) : (
                'Eligibility date not available'
              )}
            </p>
            {isEligibleNow && (
              <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-lg flex items-center gap-2">
                <span>✅</span>
                <span>You are eligible to donate now! Visit a blood bank today.</span>
              </div>
            )}
            {!isEligibleNow && donorData.nextEligibility !== "Not available" && (
              <div className="mt-4 p-3 bg-yellow-100 text-yellow-700 rounded-lg flex items-center gap-2">
                <span>⏳</span>
                <span>Please wait until the eligibility date to donate again.</span>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-[#1c0d0d] mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              Donor Status
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-600">Donor Level:</span>
                <span className={`font-semibold text-${donorLevel.color}-600`}>
                  {donorLevel.level}
                </span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-600">Next Level:</span>
                <span className="font-semibold">
                  {donorData.stats.totalDonations < 3 ? `${3 - donorData.stats.totalDonations} more to Bronze` :
                   donorData.stats.totalDonations < 5 ? `${5 - donorData.stats.totalDonations} more to Silver` :
                   donorData.stats.totalDonations < 10 ? `${10 - donorData.stats.totalDonations} more to Gold` :
                   donorData.stats.totalDonations < 20 ? `${20 - donorData.stats.totalDonations} more to Platinum` :
                   'Max Level'}
                </span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-600">Total Impact:</span>
                <span className="font-semibold text-red-600">
                  {donorData.stats.totalUnits * 3} lives saved
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Member Since:</span>
                <span className="font-semibold">
                  {donorData.createdAt ? formatDate(donorData.createdAt) : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Info Banner */}
        {isEligibleNow && (
          <div className="mt-6 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-4 text-center">
            <p className="text-lg font-semibold">
              🎉 You're eligible to donate! Schedule your donation now and save lives.
            </p>
          </div>
        )}
      </main>
    </DonorDashboardPage>
  );
};

export default DonorDashboard;