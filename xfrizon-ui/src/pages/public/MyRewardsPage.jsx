import React from "react";
import PointsWallet from "../../component/points/PointsWallet";
import { useNavigate } from "react-router-dom";

export default function MyRewardsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white px-4 py-10">
      <div className="max-w-lg mx-auto">
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-white text-sm flex items-center gap-1"
          >
            ← Back
          </button>
        </div>
        <h1 className="text-2xl font-bold text-white mb-6">My XF Rewards</h1>
        <PointsWallet />
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/partners")}
            className="bg-[#c0f24d] hover:brightness-110 text-black font-bold px-6 py-3 rounded-xl text-sm transition-all"
          >
            Browse Partner Rewards →
          </button>
        </div>
      </div>
    </div>
  );
}
