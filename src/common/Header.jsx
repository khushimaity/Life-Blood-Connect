import { Link } from "react-router-dom";
import { useAuth } from "../components/AuthContext";

const Header = () => {
  const { isLoggedIn, user } = useAuth();

  return (
    <header className="text-black shadow-md px-6 py-4 flex justify-between items-center min-h-[50px] bg-white">
      {/* Logo */}
      <div className="flex items-center gap-2 font-bold text-lg">
        <span className="text-2xl">🩸</span>
        Lifeblood Connect
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap justify-center gap-4">
        <Link to="/home">
          <button className="px-4 py-2 rounded-md font-semibold bg-red-600 text-white hover:bg-red-700 transition">
            Home
          </button>
        </Link>

        <Link to="/home" state={{ scrollTo: "about" }}>
          <button className="px-4 py-2 rounded-md font-semibold bg-red-600 text-white hover:bg-red-700 transition">
            About Us
          </button>
        </Link>

        <Link to="/home" state={{ scrollTo: "contact" }}>
          <button className="px-4 py-2 rounded-md font-semibold bg-red-600 text-white hover:bg-red-700 transition">
            Contact
          </button>
        </Link>

        {/* Leaderboard button */}
        <Link to="/leaderboard">
          <button className="px-4 py-2 rounded-md font-semibold bg-red-600 text-white hover:bg-red-700 transition">
            Leaderboard
          </button>
        </Link>

        {isLoggedIn ? (
          <Link to={user?.role === "admin" ? "/admin-dashboard" : "/donor-dashboard"}>
            <button className="px-4 py-2 rounded-md font-semibold bg-red-600 text-white hover:bg-red-700 transition">
              Dashboard
            </button>
          </Link>
        ) : (
          <>
            <Link to="/register">
              <button className="px-4 py-2 rounded-md font-semibold bg-red-600 text-white hover:bg-red-700 transition">
                Donor Registration
              </button>
            </Link>

            <Link to="/admin-registration">
              <button className="px-4 py-2 rounded-md font-semibold bg-red-600 text-white hover:bg-red-700 transition">
                Admin Registration
              </button>
            </Link>

            <Link to="/login">
              <button className="px-4 py-2 rounded-md font-semibold bg-gray-100 text-black hover:shadow-md transition">
                Login
              </button>
            </Link>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;