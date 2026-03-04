export default function TabNavigation({ activeTab, setActiveTab, tabs }) {
  const defaultTabs = [
    { id: "media", label: "Media" },
    { id: "attended", label: "Attended Events" },
    { id: "saved", label: "Saved" },
    { id: "interests", label: "Interests" },
    { id: "artists", label: "Favorite Artists" },
  ];

  const resolvedTabs =
    Array.isArray(tabs) && tabs.length > 0 ? tabs : defaultTabs;

  return (
    <div className="border-b border-gray-800 px-4 sm:px-6 sticky top-0 bg-black/95 z-20">
      <div className="max-w-6xl mx-auto flex gap-8 sm:gap-12 overflow-x-auto">
        {resolvedTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-4 px-2 font-semibold transition ${
              activeTab === tab.id
                ? "text-white border-b-2 border-red-600"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
