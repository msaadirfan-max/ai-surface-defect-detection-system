import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, isAdmin, logout } = useAuth();

  return (
    <nav className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between shadow-md">
      {/* LEFT SIDE: App Title & Subtitle */}
      <div className="flex flex-col">
        <span className="font-bold text-lg tracking-wide">
          AI Surface Defect Detection
        </span>
        <span className="text-xs text-gray-400">
          Quality Assurance Dashboard
        </span>
      </div>

      {/* MIDDLE: Navigation Links */}
      <div className="flex items-center gap-6">
        <NavLink
          to="/upload"
          className={({ isActive }) =>
            isActive
              ? "text-white font-bold border-b-2 border-blue-500 pb-1"
              : "text-gray-400 hover:text-gray-200 transition"
          }
        >
          Upload
        </NavLink>

        <NavLink
          to="/history"
          className={({ isActive }) =>
            isActive
              ? "text-white font-bold border-b-2 border-blue-500 pb-1"
              : "text-gray-400 hover:text-gray-200 transition"
          }
        >
          History
        </NavLink>

        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              isActive
                ? "text-white font-bold border-b-2 border-blue-500 pb-1"
                : "text-gray-400 hover:text-gray-200 transition"
            }
          >
            Admin
          </NavLink>
        )}
      </div>

      {/* RIGHT SIDE: User Greeting & Logout Button */}
      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-300">Welcome, {user.name}</span>
            <button
              className="text-xs bg-red-600/80 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg transition"
              onClick={logout}
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
