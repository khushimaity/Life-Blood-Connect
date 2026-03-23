import { Link, useLocation } from "react-router-dom";
import { FaHome, FaUser, FaSearch, FaPlus } from "react-icons/fa";
import { useAuth } from "../components/AuthContext";
import { useNavigate } from "react-router-dom";
import { FaChartPie } from "react-icons/fa";

const AdminSidebar = () => {
  const location = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="w-64 min-h-screen bg-[#fef5f5] flex flex-col justify-between px-6 py-8 border-r">
      <div>
        {/* Logo */}
        <h2 className="text-2xl font-bold text-[#1c0d0d] mb-10">Blood Bank</h2>

        {/* Menu Items */}
        <nav className="flex flex-col gap-4">
          <Link
            to="/admin-dashboard"
            className={`flex items-center gap-3 px-4 py-2 rounded-md font-medium ${
              isActive("/admin-dashboard") ? "bg-[#fce9e9] text-[#1c0d0d]" : "text-[#522525] hover:bg-[#fce9e9]"
            }`}
          >
            <FaHome /> Dashboard
          </Link>

          <Link
            to="/admin/analytics"
            className={`flex items-center gap-3 px-4 py-2 rounded-md font-medium ${
              isActive("/admin/analytics")
               ? "bg-[#fce9e9] text-[#1c0d0d]"
              : "text-[#522525] hover:bg-[#fce9e9]"
             }`}
            >
            <FaChartPie /> Analytics
           </Link>

          <Link
            to="/donors"
            className={`flex items-center gap-3 px-4 py-2 rounded-md font-medium ${
              isActive("/donors") ? "bg-[#fce9e9] text-[#1c0d0d]" : "text-[#522525] hover:bg-[#fce9e9]"
            }`}
          >
            <FaUser /> Donors
          </Link>

          <Link
            to="/requests"
            className={`flex items-center gap-3 px-4 py-2 rounded-md font-medium ${
              isActive("/requests") ? "bg-[#fce9e9] text-[#1c0d0d]" : "text-[#522525] hover:bg-[#fce9e9]"
            }`}
          >
            <FaSearch /> Requests
          </Link>
          
          <Link
            to="/post-request"
            className={`flex items-center gap-3 px-4 py-2 rounded-md font-medium ${
              location.pathname === "/post-request" 
                ? "bg-[#fce9e9] text-[#1c0d0d]" 
                : "text-[#522525] hover:bg-[#fce9e9]"
            }`}
          >
            <FaPlus /> Post Request
          </Link>
          
          <Link
            to="/admin-profile"
            className={`flex items-center gap-3 px-4 py-2 rounded-md font-medium ${
              location.pathname === "/admin-profile" 
                ? "bg-[#fce9e9] text-[#1c0d0d]" 
                : "text-[#522525] hover:bg-[#fce9e9]"
            }`}
          >
            <FaUser /> My Profile
          </Link>
        </nav>
      </div>

      {/* Bottom Items */}
      <div className="flex flex-col gap-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2 rounded-md font-medium text-[#522525] hover:bg-[#fce9e9]"
        >
          🚪 Logout
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;