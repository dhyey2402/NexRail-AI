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
  ChevronRight,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../contexts/AuthContext";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Overview", section: "core" },
  { to: "/search", icon: Search, label: "ETA Prediction", section: "core" },
  { to: "/simulate", icon: FlaskConical, label: "What-If Sim", section: "core" },
  { to: "/monitor", icon: Map, label: "Live Operations", section: "ops" },
  { to: "/analytics", icon: BarChart3, label: "Analytics", section: "data" },
  { to: "/history", icon: Clock, label: "History", section: "data" },
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
        "fixed left-0 top-0 z-40 h-screen flex flex-col transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]",
        collapsed ? "w-[64px]" : "w-[232px]"
      )}
      style={{
        background: "var(--nr-surface)",
        borderRight: "1px solid var(--nr-border)",
      }}
    >
      {/* ── Brand ──────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 h-[56px] shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
          style={{
            background: "linear-gradient(135deg, var(--nr-accent) 0%, #4a88c0 100%)",
            boxShadow: "0 2px 8px rgba(91,155,213,0.25)",
          }}
        >
          <Train className="h-4 w-4 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="text-[13px] font-semibold tracking-[-0.02em]" style={{ color: "var(--nr-text-white)" }}>
              NexRail AI
            </div>
            <div className="text-[10px] font-medium tracking-wide uppercase" style={{ color: "var(--nr-text-muted)", letterSpacing: "0.06em" }}>
              Operations
            </div>
          </div>
        )}
      </div>

      {/* ── Divider ────────────────────────────────── */}
      <div className="mx-3 h-px" style={{ background: "var(--nr-border)" }} />

      {/* ── Navigation ─────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2.5">
        <div className="space-y-0.5">
          {navItems.map((item, idx) => {
            // Section divider before "ops" and "data" groups
            const showDivider = idx > 0 && navItems[idx - 1].section !== item.section;
            return (
              <div key={item.to}>
                {showDivider && (
                  <div className="my-2 mx-1.5 h-px" style={{ background: "var(--nr-border)" }} />
                )}
                <NavLink
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    cn(
                      "group flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[12.5px] font-medium transition-all duration-150",
                      collapsed && "justify-center px-0",
                      isActive
                        ? "text-[var(--nr-text-white)]"
                        : "text-[var(--nr-text-muted)] hover:text-[var(--nr-text-secondary)]"
                    )
                  }
                  style={({ isActive }) => isActive ? {
                    background: "var(--nr-accent-muted)",
                    boxShadow: "inset 3px 0 0 0 var(--nr-accent)",
                  } : {}}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className={cn(
                    "h-[15px] w-[15px] shrink-0 transition-colors",
                  )} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {!collapsed && (
                    <ChevronRight className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-40 transition-opacity text-[var(--nr-text-faint)]" />
                  )}
                </NavLink>
              </div>
            );
          })}
        </div>
      </nav>

      {/* ── Footer Controls ────────────────────────── */}
      <div className="px-2.5 pb-3 space-y-1">
        <div className="h-px mx-1.5 mb-2" style={{ background: "var(--nr-border)" }} />

        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[12.5px] font-medium w-full transition-colors",
            "text-[var(--nr-text-muted)] hover:text-[var(--nr-danger)]",
            collapsed && "justify-center px-0"
          )}
          style={{ transition: "color 0.15s, background 0.15s" }}
          onMouseEnter={(e) => e.currentTarget.style.background = "var(--nr-danger-muted)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          title="Sign out"
        >
          <LogOut className="h-[15px] w-[15px] shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>

        <button
          onClick={onToggle}
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[12.5px] font-medium w-full transition-colors",
            "text-[var(--nr-text-faint)] hover:text-[var(--nr-text-secondary)] hover:bg-[var(--nr-surface-raised)]",
            collapsed && "justify-center px-0"
          )}
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-[15px] w-[15px] shrink-0" />
          ) : (
            <>
              <PanelLeftClose className="h-[15px] w-[15px] shrink-0" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
