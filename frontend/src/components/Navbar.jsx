import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Sparkles, LogOut } from "lucide-react";

const links = [
  { to: "/", label: "Home" },
  { to: "/discover", label: "Discover" },
  { to: "/vault", label: "Vault" },
  { to: "/pulse", label: "Pulse" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  return (
    <header data-testid="navbar" className="fixed top-0 inset-x-0 z-50 glass border-b border-white/5">
      <div className="max-w-[1400px] mx-auto px-5 md:px-10 h-16 flex items-center justify-between">
        <Link to="/" data-testid="logo-link" className="flex items-center gap-2">
          <Sparkles size={18} className="text-[#e6b85c]" />
          <span className="font-head text-lg tracking-[0.35em] font-light">SP<span className="gold-text">O</span>TLIGHT</span>
        </Link>

        <nav className="hidden md:flex items-center gap-9">
          {links.map((l) => {
            const active = loc.pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                data-testid={`nav-${l.label.toLowerCase()}`}
                className={`relative text-sm transition-colors ${active ? "text-white" : "text-zinc-400 hover:text-white"}`}
              >
                {l.label}
                {active && <span className="absolute -bottom-2 left-0 right-0 h-px bg-[#e6b85c]" />}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link to="/vault" data-testid="user-chip" className="hidden sm:flex items-center gap-2 rounded-full glass px-3 py-1.5">
                <span className="grid place-items-center w-6 h-6 rounded-full bg-[#e6b85c] text-black text-xs font-bold">
                  {user.name?.[0]?.toUpperCase() || "S"}
                </span>
                <span className="text-sm text-zinc-200">{user.name}</span>
              </Link>
              <button data-testid="logout-button" onClick={logout} className="grid place-items-center w-9 h-9 rounded-full glass hover:bg-white/10 transition-colors">
                <LogOut size={15} className="text-zinc-300" />
              </button>
            </>
          ) : (
            <button
              data-testid="become-spotter-button"
              onClick={() => nav("/auth")}
              className="btn-gold rounded-full px-5 py-2 text-sm font-semibold"
            >
              Become a Spotter
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
