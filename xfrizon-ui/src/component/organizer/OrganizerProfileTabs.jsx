import React from "react";

const OrganizerProfileTabs = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "upcoming", label: "Upcoming Events" },
    { id: "blog", label: "Xf Blog" },
  ];

  return (
    <div className="border-b border-zinc-700 px-6 bg-black">
      <div className="max-w-6xl mx-auto flex gap-12">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-4 px-2 font-light text-sm transition ${
              activeTab === tab.id
                ? "text-xf-accent border-b-2 border-xf-accent font-semibold"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default OrganizerProfileTabs;
