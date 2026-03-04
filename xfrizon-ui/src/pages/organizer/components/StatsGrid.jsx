import { FaCalendar, FaTicketAlt, FaDollarSign } from "react-icons/fa";

const StatsGrid = ({ stats }) => {
  const iconMap = {
    FaCalendar: FaCalendar,
    FaTicketAlt: FaTicketAlt,
    FaDollarSign: FaDollarSign,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {stats.map((stat, idx) => {
        const Icon =
          typeof stat.icon === "string"
            ? iconMap[stat.icon]
            : stat.icon || FaCalendar;
        return (
          <div
            key={idx}
            className="bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 rounded-xl p-6 hover:border-red-500 transition-all duration-300"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 font-light text-sm mb-2">
                  {stat.label}
                </p>
                <p className="text-3xl font-light text-white">{stat.value}</p>
              </div>
              <div className={`bg-gradient-to-br ${stat.color} p-3 rounded-lg`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsGrid;
