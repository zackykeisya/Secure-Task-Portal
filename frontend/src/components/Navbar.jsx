import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Avatar from "./Avatar";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-slate-900 flex items-center justify-center">
            <span className="text-white text-xs font-bold">ST</span>
          </div>
          <span className="font-semibold text-slate-900 tracking-tight">
            Secure Task Portal
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <Avatar name={user?.username} role={user?.role} />
            <div className="text-sm leading-tight">
              <p className="font-medium text-slate-900">{user?.username}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-md hover:bg-slate-100 transition"
          >
            Keluar
          </button>
        </div>
      </div>
    </header>
  );
}