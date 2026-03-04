const BonusStats = ({
  validationRate,
  totalTickets,
  validatedCount,
  activeEventsCount,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 border border-green-500/30 rounded-xl p-6">
        <p className="text-gray-400 font-light text-sm mb-2">Validation Rate</p>
        <p className="text-3xl font-light text-green-400">{validationRate}%</p>
        <p className="text-xs text-gray-500 mt-2 font-light">
          {validatedCount} of {totalTickets} tickets validated
        </p>
      </div>
      <div className="bg-gradient-to-br from-purple-500/10 to-pink-600/10 border border-purple-500/30 rounded-xl p-6">
        <p className="text-gray-400 font-light text-sm mb-2">Active Events</p>
        <p className="text-3xl font-light text-purple-400">
          {activeEventsCount}
        </p>
        <p className="text-xs text-gray-500 mt-2 font-light">
          Events with recent ticket sales
        </p>
      </div>
    </div>
  );
};

export default BonusStats;
