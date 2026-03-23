import React, { useEffect, useState } from "react";
import { donorAPI } from "../api/services";

const Leaderboard = () => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const res = await donorAPI.getLeaderboard();

      if (res.data.success && Array.isArray(res.data.leaderboard)) {
        setLeaders(res.data.leaderboard);
      } else {
        setLeaders([]);
      }
    } catch (error) {
      console.error("Leaderboard error:", error);
      setLeaders([]);
    } finally {
      setLoading(false);
    }
  };

  const getMedal = (rank) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-red-50 px-6 py-10">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-center text-red-600 mb-8">
            🏆 Leaderboard
          </h1>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-red-50 px-6 py-10">
      <div className="max-w-3xl mx-auto">

        <h1 className="text-3xl font-bold text-center text-red-600 mb-8">
          🏆 Leaderboard
        </h1>

        {leaders.length === 0 ? (
          <div className="text-center text-gray-500">
            No leaderboard data available.
          </div>
        ) : (
          <div className="space-y-4">
            {leaders.map((donor, index) => {
              const rank = donor.rank || index + 1;

              return (
                <div
                  key={index}
                  className="flex items-center justify-between bg-white p-5 rounded-lg shadow hover:shadow-lg transition"
                >
                  <div className="text-xl font-bold w-12 text-center">
                    {getMedal(rank)}
                  </div>

                  <div className="flex-1 px-4">
                    <h2 className="font-semibold text-gray-800">
                      {donor.name || "Unknown"}
                    </h2>
                    <span className="text-sm bg-red-100 text-red-700 px-2 py-1 rounded-full">
                      {donor.bloodGroup || "N/A"}
                    </span>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-red-600">
                      {donor.totalDonations || 0}
                    </p>
                    <p className="text-xs text-gray-500">
                      {donor.badge || "Beginner"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;