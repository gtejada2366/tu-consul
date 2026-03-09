import { Search, Bell, ChevronDown, LogOut, User, Menu } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../contexts/auth-context";


interface TopBarProps {
  onMenuToggle: () => void;
}

export function TopBar({ onMenuToggle }: TopBarProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user, clinic, signOut } = useAuth();

  const userInitials = user?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "TC";

  const planLabel = clinic?.plan === "premium" ? "Plan Premium" : clinic?.plan === "basic" ? "Plan Básico" : "Plan Gratuito";

  // Click-outside detection for both dropdowns
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(e.target as Node)
      ) {
        setShowNotifications(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setShowUserMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-14 md:h-16 bg-surface border-b border-border flex items-center justify-between px-3 md:px-6 sticky top-0 z-40">
      {/* Left section: hamburger + search */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {/* Hamburger - mobile only */}
        <button
          onClick={onMenuToggle}
          className="md:hidden w-10 h-10 flex items-center justify-center rounded-[10px] hover:bg-surface-alt transition-colors flex-shrink-0"
        >
          <Menu className="w-5 h-5 text-foreground-secondary" />
        </button>

        {/* Search */}
        <form className="flex-1 max-w-md hidden sm:block" onSubmit={(e) => {
          e.preventDefault();
          if (globalSearch.trim()) { navigate(`/pacientes?q=${encodeURIComponent(globalSearch.trim())}`); }
        }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-secondary" />
            <input
              type="text"
              placeholder="Buscar pacientes..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-surface-alt border border-border rounded-[10px]
                text-[0.875rem] text-foreground placeholder:text-foreground-secondary
                focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                transition-all duration-150"
            />
          </div>
        </form>

        {/* Mobile search icon */}
        <button className="sm:hidden w-10 h-10 flex items-center justify-center rounded-[10px] hover:bg-surface-alt transition-colors flex-shrink-0"
          onClick={() => navigate("/pacientes")}>
          <Search className="w-5 h-5 text-foreground-secondary" />
        </button>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-1 md:gap-4">
        {/* Plan Badge - hidden on small */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-surface-alt rounded-[999px]">
          <div className="w-2 h-2 rounded-full bg-success"></div>
          <span className="text-[0.75rem] font-medium text-foreground-secondary">
            {planLabel}
          </span>
        </div>

        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className="relative w-10 h-10 flex items-center justify-center rounded-[10px]
              hover:bg-surface-alt transition-colors"
          >
            <Bell className="w-5 h-5 text-foreground-secondary" />
          </button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <div
              className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-80 bg-surface border border-border
                rounded-[12px] shadow-lg overflow-hidden z-50 max-w-[320px]"
            >
              <div className="px-4 py-3 border-b border-border">
                <h3 className="text-[0.875rem] font-semibold text-foreground">
                  Notificaciones
                </h3>
              </div>
              <div className="px-4 py-8 text-center">
                <Bell className="w-8 h-8 text-foreground-secondary mx-auto mb-2 opacity-40" />
                <p className="text-[0.8125rem] text-foreground-secondary">
                  No hay notificaciones
                </p>
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2 rounded-[10px] hover:bg-surface-alt transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[0.75rem] font-semibold">{userInitials}</span>
            </div>
            <div className="hidden md:block text-left">
              <div className="text-[0.875rem] font-medium text-foreground">
                {user?.full_name || "Usuario"}
              </div>
              <div className="text-[0.75rem] text-foreground-secondary">
                {user?.specialty || user?.role || ""}
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-foreground-secondary hidden md:block" />
          </button>

          {/* User Profile Dropdown */}
          {showUserMenu && (
            <div
              className="absolute right-0 top-full mt-2 w-52 bg-surface border border-border
                rounded-[12px] shadow-lg overflow-hidden z-50"
            >
              <div className="py-1.5">
                <Link
                  to="/configuracion"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-[0.8125rem] text-foreground
                    hover:bg-surface-alt transition-colors"
                >
                  <User className="w-4 h-4 text-foreground-secondary" />
                  Mi Perfil
                </Link>
                <div className="mx-3 border-t border-border"></div>
                <button
                  onClick={async () => {
                    setShowUserMenu(false);
                    await signOut();
                    navigate("/login");
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-[0.8125rem] text-danger
                    hover:bg-surface-alt transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar Sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
