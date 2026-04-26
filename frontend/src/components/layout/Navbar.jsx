import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, Settings, Search, LogOut, User, ChevronDown, BarChart2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../ui/Avatar";
import toast from "react-hot-toast";

export default function Navbar() {
  const { user, logout, unreadNotifications } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out");
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-surface-border h-14">
      <div className="max-w-[1280px] mx-auto h-full px-4 flex items-center gap-4">
        {/* Logo */}
        <Link to="/feed" className="font-extrabold text-xl text-primary tracking-tight mr-2">
          Graphite
        </Link>

        {/* Search icon button */}
        <button
          onClick={() => navigate("/search")}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <Search size={18} />
        </button>

        <div className="flex-1" />

        {/* Right actions */}
        <div className="flex items-center gap-1">
          {/* Notifications */}
          <button
            onClick={() => navigate("/notifications")}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors relative"
          >
            <Bell size={18} />
            {unreadNotifications > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 text-[10px] font-bold text-white bg-primary rounded-full flex items-center justify-center">
                {unreadNotifications > 9 ? "9+" : unreadNotifications}
              </span>
            )}
          </button>

          {/* Settings */}
          <button
            onClick={() => navigate("/settings")}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <Settings size={18} />
          </button>

          {/* Activity */}
          <button
            onClick={() => navigate("/activity")}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <BarChart2 size={18} />
          </button>

          {/* Avatar dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((p) => !p)}
              className="flex items-center gap-1 p-1 rounded-full hover:bg-gray-100 transition-colors ml-1"
            >
              <Avatar src={user?.profilePic} name={user?.name} size="sm" />
              <ChevronDown size={14} className="text-gray-500" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-card-hover border border-surface-border py-1 z-50">
                <div className="px-4 py-2.5 border-b border-gray-100">
                  <p className="font-semibold text-sm text-gray-900 truncate">{user?.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.headline || user?.email}</p>
                </div>
                <button
                  onClick={() => { navigate(`/profile/${user?.username || user?._id}`); setDropdownOpen(false); }}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <User size={15} /> My Profile
                </button>
                <button
                  onClick={() => { navigate("/settings"); setDropdownOpen(false); }}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Settings size={15} /> Settings
                </button>
                <button
                  onClick={() => { navigate("/activity"); setDropdownOpen(false); }}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <BarChart2 size={15} /> Activity Dashboard
                </button>
                <div className="border-t border-gray-100" />
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut size={15} /> Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
