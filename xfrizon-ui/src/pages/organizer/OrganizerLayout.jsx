import { Outlet } from "react-router-dom";
import OrganizerSidebar from "../../component/organizer/OrganizerSidebar";

const OrganizerLayout = () => {
  return (
    <div className="flex min-h-screen bg-black text-white">
      <OrganizerSidebar />
      <div className="flex-1 p-8 bg-black overflow-auto">
        <Outlet />
      </div>
    </div>
  );
};

export default OrganizerLayout;
