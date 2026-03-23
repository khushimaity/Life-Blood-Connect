import React, { useEffect, useState } from "react";
import axios from "axios";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const Analytics = () => {
  const [bloodData, setBloodData] = useState({});
  const [donorData, setDonorData] = useState({ available: 0, unavailable: 0 });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
       "http://localhost:5000/api/blood-requests/analytics",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setBloodData(res.data.bloodGroups);
      setDonorData(res.data.donors);
    } catch (err) {
      console.error("Analytics fetch error:", err);
    }
  };

  const bloodChartData = {
    labels: Object.keys(bloodData),
    datasets: [
      {
        data: Object.values(bloodData),
        backgroundColor: [
          "#FF6384",
          "#36A2EB",
          "#FFCE56",
          "#4BC0C0",
          "#9966FF",
          "#FF9F40",
          "#8BC34A",
          "#E91E63",
        ],
      },
    ],
  };

  const donorChartData = {
    labels: ["Available", "Unavailable"],
    datasets: [
      {
        data: [donorData.available, donorData.unavailable],
        backgroundColor: ["#4CAF50", "#F44336"],
      },
    ],
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Analytics Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div>
          <h3 className="text-lg font-semibold mb-4">
            Blood Groups Available
          </h3>
          <Pie data={bloodChartData} />
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">
            Donor Availability
          </h3>
          <Pie data={donorChartData} />
        </div>
      </div>
    </div>
  );
};

export default Analytics;