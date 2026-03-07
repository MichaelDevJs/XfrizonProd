import { Link } from "react-router-dom";
import { FaQrcode, FaArrowRight } from "react-icons/fa";

const DashboardHeader = ({ onScanClick }) => {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-4xl font-light text-gray-200 mb-1 sm:mb-2">Dashboard</h1>
        <p className="text-gray-500 font-light">
          Welcome back! Here's your event overview.
        </p>
      </div>
      <div className="flex w-full sm:w-auto flex-col sm:flex-row gap-2 sm:gap-3">
        <button
          onClick={onScanClick}
          className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-light text-sm transition-all duration-300 flex items-center justify-center gap-2"
        >
          <FaQrcode className="w-4 h-4" />
          Scan Ticket
        </button>
        <Link
          to="/organizer/create-event"
          className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-light text-sm transition-all duration-300 flex items-center justify-center gap-2"
        >
          <FaArrowRight className="w-4 h-4" />
          Create Event
        </Link>
      </div>
    </div>
  );
};

export default DashboardHeader;
