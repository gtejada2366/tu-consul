import { Link, useLocation } from "react-router";
import { useAuth } from "../contexts/auth-context";
import {
  Calendar,
  Stethoscope,
  Users,
  FlaskConical,
  MessageCircle,
  CreditCard,
  FileCheck,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

const navigation = [
  { name: "Agenda", href: "/agenda", icon: Calendar },
  { name: "Doctores", href: "/doctores", icon: Stethoscope },
  { name: "Pacientes", href: "/pacientes", icon: Users },
  { name: "Laboratorio", href: "/laboratorio", icon: FlaskConical },
  { name: "Campañas", href: "/campanas", icon: MessageCircle },
  { name: "Facturación", href: "/facturacion", icon: CreditCard },
  { name: "Comprobantes", href: "/comprobantes", icon: FileCheck },
  { name: "Reportes", href: "/reportes", icon: BarChart3 },
  { name: "Configuración", href: "/configuracion", icon: Settings },
];

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();

  // Close mobile menu on route change
  useEffect(() => {
    onClose();
  }, [location.pathname, onClose]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const navContent = (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center justify-between border-b border-border px-4 md:px-6 md:justify-center">
        <div className="flex items-center justify-center">
          {!collapsed && (
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[1.25rem] font-semibold text-primary"
            >
              Tu Consul
            </motion.h1>
          )}
          {collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center"
            >
              <span className="text-white font-semibold text-sm">TC</span>
            </motion.div>
          )}
        </div>
        {/* Close button - mobile only */}
        <button
          onClick={onClose}
          aria-label="Cerrar menú"
          className="md:hidden w-8 h-8 flex items-center justify-center rounded-[10px] hover:bg-surface-alt transition-colors"
        >
          <X className="w-5 h-5 text-foreground-secondary" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6">
        <ul className="space-y-1 px-3">
          {navigation.filter(item => (item.href !== "/facturacion" && item.href !== "/comprobantes" && item.href !== "/reportes") || user?.role === "admin").map((item) => {
            const isActive = location.pathname === item.href ||
              (item.href !== "/" && location.pathname.startsWith(item.href));

            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-[10px]
                    transition-all duration-150 ease-out
                    ${isActive
                      ? "bg-primary text-white"
                      : "text-foreground-secondary hover:bg-surface-alt hover:text-foreground"
                    }
                  `}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {(!collapsed || mobileOpen) && (
                    <span className="text-[0.875rem] font-medium">
                      {item.name}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? "80px" : "240px" }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="hidden md:flex bg-surface border-r border-border flex-col relative"
      >
        {navContent}

        {/* Collapse Button - desktop only */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expandir menú lateral" : "Colapsar menú lateral"}
          aria-expanded={!collapsed}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-surface border border-border
            flex items-center justify-center hover:bg-surface-alt transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-3 h-3 text-foreground-secondary" />
          ) : (
            <ChevronLeft className="w-3 h-3 text-foreground-secondary" />
          )}
        </button>
      </motion.aside>

      {/* Mobile drawer overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              className="md:hidden fixed inset-0 bg-black/50 z-50"
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="md:hidden fixed inset-y-0 left-0 w-[280px] bg-surface border-r border-border flex flex-col z-50"
            >
              {navContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
