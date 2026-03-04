export default function SavedTab({ savedItems = [] }) {
  return (
    <div className="max-w-6xl mx-auto">
      {savedItems.length === 0 ? (
        <p className="text-gray-400 text-center py-12">No saved items yet</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedItems.map((item) => (
            <div
              key={item.id}
              className="bg-[#1e1e1e] rounded-xl overflow-hidden border border-gray-800 hover:border-red-600 transition-colors group"
            >
              {/* Image */}
              <div className="relative aspect-square bg-gray-800 overflow-hidden">
                <img
                  src={item.image}
                  alt={item.event}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                  <div className="p-3 w-full">
                    <p className="text-white font-bold text-sm">{item.event}</p>
                    <p className="text-gray-300 text-xs">{item.date}</p>
                  </div>
                </div>
              </div>
              {/* Footer */}
              <div className="px-3 py-2 bg-[#1a1a1a] border-t border-gray-700/50">
                <p className="text-xs text-gray-400">Saved • {item.tier}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
