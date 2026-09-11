import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Search,
  FlaskConical,
  Radio,
  BarChart3,
  History,
  ChevronLeft,
  ChevronRight,
  Train,
  CheckCircle2,
} from "lucide-react";
import { cn } from "../../lib/utils";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Overview", tag: "Live" },
  { to: "/search", icon: Search, label: "Live ETA & Telemetry", tag: "Model" },
  { to: "/simulate", icon: FlaskConical, label: "Contingency Sandbox", tag: "What-If" },
  { to: "/monitor", icon: Radio, label: "Fleet & Network Map", tag: "Corridor" },
  { to: "/analytics", icon: BarChart3, label: "Performance Analytics", tag: "Metrics" },
  { to: "/history", icon: History, label: "Verification Audit", tag: "Logs" },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-zinc-950 border-r border-zinc-800/80 transition-all duration-200 flex flex-col justify-between select-none",
        collapsed ? "w-[64px]" : "w-[250px]"
      )}
    >
      {/* Top Section */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-4 h-14 border-b border-zinc-800/80 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 text-zinc-200">
            <Train className="w-4 h-4 text-sky-400" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-zinc-100 tracking-tight">
                  NexRail AI
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 font-medium">
                  v2.0
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 truncate">
                Indian Railways Dispatch
              </p>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="p-2.5 space-y-1 overflow-y-auto flex-1">
          <div className={cn("px-2 pt-2 pb-1 text-[11px] font-medium text-zinc-500 uppercase tracking-wider", collapsed && "sr-only")}>
            Operations
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all group",
                  isActive
                    ? "bg-zinc-800/90 text-zinc-100 border border-zinc-700/60 shadow-xs"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/70 border border-transparent"
                )
              }
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <item.icon className="w-4 h-4 shrink-0 transition-colors group-hover:text-zinc-200" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </div>
              {!collapsed && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-500 border border-zinc-800 font-mono">
                  {item.tag}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="p-3 border-t border-zinc-800/80 bg-zinc-950/90 shrink-0 space-y-2.5">
        {/* Signal Monitor Indicator (Compact) */}
        {!collapsed && (
          <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/60 text-xs">
            <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-2">
              <span className="font-medium">Signal System</span>
              <span className="text-emerald-400 font-mono text-[10px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Normal
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1 text-center">
              <div className="py-1 px-0.5 rounded bg-zinc-950 border border-zinc-800/80">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mx-auto mb-1" />
                <span className="text-[9px] text-zinc-400 font-mono">CLR</span>
              </div>
              <div className="py-1 px-0.5 rounded bg-zinc-950 border border-zinc-800/80">
                <div className="w-2 h-2 rounded-full bg-amber-500 mx-auto mb-1" />
                <span className="text-[9px] text-zinc-400 font-mono">ATT</span>
              </div>
              <div className="py-1 px-0.5 rounded bg-zinc-950 border border-zinc-800/80">
                <div className="w-2 h-2 rounded-full bg-amber-500/70 mx-auto mb-1" />
                <span className="text-[9px] text-zinc-400 font-mono">CAU</span>
              </div>
              <div className="py-1 px-0.5 rounded bg-zinc-950 border border-zinc-800/80">
                <div className="w-2 h-2 rounded-full bg-rose-500 mx-auto mb-1" />
                <span className="text-[9px] text-zinc-400 font-mono">DGR</span>
              </div>
            </div>
          </div>
        )}

        {/* Engine Status */}
        {!collapsed && (
          <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1 font-mono">
            <span className="text-zinc-500">ML Engine</span>
            <span className="flex items-center gap-1 text-zinc-300">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> LightGBM
            </span>
          </div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-zinc-800/60 transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}
