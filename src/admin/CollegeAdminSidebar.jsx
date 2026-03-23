import { Link, useLocation } from "react-router-dom";
import { FaHome, FaUser, FaCalendarAlt, FaPlus, FaList, FaSignOutAlt } from "react-icons/fa";
import { useAuth } from "../components/AuthContext";
import { useNavigate } from "react-router-dom";

const CollegeAdminSidebar = () => {
  const location = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="w-64 min-h-screen bg-[#f0f4ff] flex flex-col justify-between px-6 py-8 border-r border-blue-200">
      <div>
        {/* Logo */}
        <h2 className="text-2xl font-bold text-blue-800 mb-10">College Admin</h2>

        {/* Menu Items */}
        <nav className="flex flex-col gap-4">
          <Link
            to="/college-admin/dashboard"
            className={`flex items-center gap-3 px-4 py-2 rounded-md font-medium ${
              isActive("/college-admin/dashboard") 
                ? "bg-blue-600 text-white" 
                : "text-blue-700 hover:bg-blue-100"
            }`}
          >
            <FaHome /> Dashboard
          </Link>

          <Link
            to="/college-admin/profile"
            className={`flex items-center gap-3 px-4 py-2 rounded-md font-medium ${
              isActive("/college-admin/profile") 
                ? "bg-blue-600 text-white" 
                : "text-blue-700 hover:bg-blue-100"
            }`}
          >
            <FaUser /> My Profile
          </Link>

          <Link
            to="/college-admin/create-drive"
            className={`flex items-center gap-3 px-4 py-2 rounded-md font-medium ${
              isActive("/college-admin/create-drive") 
                ? "bg-blue-600 text-white" 
                : "text-blue-700 hover:bg-blue-100"
            }`}
          >
            <FaPlus /> Create Drive
          </Link>

          <Link
            to="/college-admin/drives"
            className={`flex items-center gap-3 px-4 py-2 rounded-md font-medium ${
              isActive("/college-admin/drives") 
                ? "bg-blue-600 text-white" 
                : "text-blue-700 hover:bg-blue-100"
            }`}
          >
            <FaList /> My Drives
          </Link>



          {/* Calendar link removed */}
        </nav>
      </div>

      {/* Bottom Items */}
      <div className="flex flex-col gap-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2 rounded-md font-medium text-red-600 hover:bg-red-50"
        >
          <FaSignOutAlt /> Logout
        </button>
      </div>
    </aside>
  );
};

export default CollegeAdminSidebar;