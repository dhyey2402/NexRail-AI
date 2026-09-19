import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Search,
  FlaskConical,
  Map,
  BarChart3,
  Clock,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Train,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../contexts/AuthContext";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Overview" },
  { to: "/search", icon: Search, label: "ETA Prediction" },
  { to: "/simulate", icon: FlaskConical, label: "What-If Simulation" },
  { to: "/monitor", icon: Map, label: "Live Operations" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/history", icon: Clock, label: "Prediction History" },
];

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen flex flex-col border-r transition-all duration-200",
        "bg-[var(--nr-surface)] border-[var(--nr-border)]",
        collapsed ? "w-[60px]" : "w-[220px]"
      )}
    >
      {/* ── Brand ──────────────────────────────────── */}
      <div className="flex items-center gap-2.5 px-4 h-14 border-b border-[var(--nr-border)] shrink-0">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--nr-accent)] shrink-0">
          <Train className="h-3.5 w-3.5 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="text-[13px] font-semibold tracking-tight text-[var(--nr-text)]">
              NexRail AI
            </div>
            <div className="text-[10px] text-[var(--nr-text-muted)] font-medium">
              Operations Console
            </div>
          </div>
        )}
      </div>

      {/* ── Navigation ─────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <div className="space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors",
                  collapsed && "justify-center px-0",
                  isActive
                    ? "bg-[var(--nr-accent-muted)] text-[var(--nr-accent)]"
                    : "text-[var(--nr-text-secondary)] hover:text-[var(--nr-text)] hover:bg-[var(--nr-surface-raised)]"
                )
              }
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* ── Footer Controls ────────────────────────── */}
      <div className="border-t border-[var(--nr-border)] p-2 space-y-0.5">
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium w-full transition-colors",
            "text-[var(--nr-text-muted)] hover:text-[var(--nr-danger)] hover:bg-[var(--nr-danger-muted)]",
            collapsed && "justify-center px-0"
          )}
          title="Sign out"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>

        <button
          onClick={onToggle}
          className={cn(
            "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium w-full transition-colors",
            "text-[var(--nr-text-muted)] hover:text-[var(--nr-text)] hover:bg-[var(--nr-surface-raised)]",
            collapsed && "justify-center px-0"
          )}
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4 shrink-0" />
          ) : (
            <>
              <PanelLeftClose className="h-4 w-4 shrink-0" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
