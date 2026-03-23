import React, { useEffect, useState } from "react";
import { Pie, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";
import { adminAPI } from "../api/services";
import { toast } from 'react-toastify';
import AdminDashboardPage from "./AdminDashboardPage";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

const AdminAnalytics = () => {
  const [bloodGroupData, setBloodGroupData] = useState(null);
  const [availabilityData, setAvailabilityData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getDashboardStats();
      
      const data = response.data;

      // Blood Group Pie
      if (data.bloodGroupDistribution) {
        setBloodGroupData({
          labels: Object.keys(data.bloodGroupDistribution),
          datasets: [
            {
              data: Object.values(data.bloodGroupDistribution),
              backgroundColor: [
                "#ef4444",
                "#3b82f6",
                "#10b981",
                "#f59e0b",
                "#8b5cf6",
                "#ec4899",
                "#14b8a6",
                "#6366f1"
              ]
            }
          ]
        });
      }

      // Availability Doughnut
      if (data.totalDonors !== undefined) {
        setAvailabilityData({
          labels: ["Available", "Unavailable"],
          datasets: [
            {
              data: [
                data.availableDonors || 0,
                (data.totalDonors || 0) - (data.availableDonors || 0)
              ],
              backgroundColor: ["#22c55e", "#f87171"]
            }
          ]
        });
      }
    } catch (error) {
      console.error("Analytics fetch error:", error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminDashboardPage>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-600"></div>
        </div>
      </AdminDashboardPage>
    );
  }

  return (
    <AdminDashboardPage>
      <div className="p-8 bg-red-50 min-h-screen">
        <h1 className="text-3xl font-bold mb-8 text-red-600">
          Admin Analytics Dashboard
        </h1>

        <div className="grid md:grid-cols-2 gap-10">
          {bloodGroupData && (
            <div className="bg-white p-6 rounded-xl shadow">
              <h2 className="font-bold mb-4">
                Blood Group Distribution
              </h2>
              <Pie data={bloodGroupData} />
            </div>
          )}

          {availabilityData && (
            <div className="bg-white p-6 rounded-xl shadow">
              <h2 className="font-bold mb-4">
                Donor Availability
              </h2>
              <Doughnut data={availabilityData} />
            </div>
          )}
        </div>
      </div>
    </AdminDashboardPage>
  );
};

export default AdminAnalytics;