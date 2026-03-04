import { Link } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa";

const QuickActions = () => {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
      <h2 className="text-xl font-light text-gray-200 mb-6">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/organizer/create-event"
          className="p-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-red-500 rounded-lg transition-all duration-300 flex items-center justify-between group"
        >
          <span className="text-gray-300 font-light">Create New Event</span>
          <FaArrowRight className="w-4 h-4 text-gray-500 group-hover:text-red-500 transition-colors" />
        </Link>
        <Link
          to="/organizer/my-events"
          className="p-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-red-500 rounded-lg transition-all duration-300 flex items-center justify-between group"
        >
          <span className="text-gray-300 font-light">View My Events</span>
          <FaArrowRight className="w-4 h-4 text-gray-500 group-hover:text-red-500 transition-colors" />
        </Link>
      </div>
    </div>
  );
};

export default QuickActions;
