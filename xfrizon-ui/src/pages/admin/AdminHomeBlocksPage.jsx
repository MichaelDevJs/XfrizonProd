import React from "react";
import HomePageBlockManager from "../../component/admin/HomePageBlockManager";

export default function AdminHomeBlocksPage() {
  // This can be extended to fetch/save order from backend
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">HomePage Block Order</h1>
      <HomePageBlockManager />
    </div>
  );
}
