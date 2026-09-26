import { useLocation } from "react-router-dom";
import { Sun, Moon, Activity } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useState, useEffect } from "react";

const routeTitles: Record<string, { title: string; subtitle: string }> = {
  "/": { title: "Operations Overview", subtitle: "Fleet status & system health" },
  "/search": { title: "ETA Prediction", subtitle: "AI-powered arrival forecasting" },
  "/simulate": { title: "What-If Simulation", subtitle: "Counterfactual scenario analysis" },
  "/monitor": { title: "Live Operations", subtitle: "Real-time fleet monitoring" },
  "/analytics": { title: "Analytics", subtitle: "Performance intelligence" },
  "/history": { title: "Prediction History", subtitle: "Audit trail & accuracy" },
};

export default function Navbar() {
  const location = useLocation();
  const { user } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const [clock, setClock] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const route = routeTitles[location.pathname] || { title: "NexRail AI", subtitle: "" };

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between h-[56px] px-6"
      style={{
        background: "var(--nr-surface-overlay)",
        borderBottom: "1px solid var(--nr-border)",
        backdropFilter: "blur(12px) saturate(130%)",
        WebkitBackdropFilter: "blur(12px) saturate(130%)",
      }}
    >
      {/* Left — Page Title */}
      <div>
        <h1 className="text-[14px] font-semibold tracking-[-0.02em]" style={{ color: "var(--nr-text)" }}>
          {route.title}
        </h1>
        <p className="text-[10.5px] font-medium" style={{ color: "var(--nr-text-muted)" }}>
          {route.subtitle}
        </p>
      </div>

      {/* Right — Controls */}
      <div className="flex items-center gap-3">
        {/* System Status Indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg"
          style={{
            background: "var(--nr-success-muted)",
            border: "1px solid rgba(61,188,132,0.12)",
          }}
        >
          <Activity className="w-3 h-3" style={{ color: "var(--nr-success)" }} />
          <span className="text-[10.5px] font-semibold" style={{ color: "var(--nr-success)" }}>
            OPERATIONAL
          </span>
        </div>

        {/* Live Clock (IST) */}
        <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono" style={{ color: "var(--nr-text-muted)" }}>
          <span className="inline-block w-[5px] h-[5px] rounded-full nr-pulse-dot" style={{ background: "var(--nr-success)" }} />
          <time className="tabular-nums">
            {clock.toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: false,
              timeZone: "Asia/Kolkata",
            })}{" "}
            <span className="text-[9px]" style={{ color: "var(--nr-text-faint)" }}>IST</span>
          </time>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
          style={{
            background: "var(--nr-bg-subtle)",
            border: "1px solid var(--nr-border)",
            color: "var(--nr-text-muted)",
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = "var(--nr-text)"}
          onMouseLeave={(e) => e.currentTarget.style.color = "var(--nr-text-muted)"}
          title={theme === "dark" ? "Light mode" : "Dark mode"}
        >
          {theme === "dark" ? (
            <Sun className="h-3.5 w-3.5" />
          ) : (
            <Moon className="h-3.5 w-3.5" />
          )}
        </button>

        {/* User */}
        {user && (
          <div className="hidden md:flex items-center gap-2.5 pl-3"
            style={{ borderLeft: "1px solid var(--nr-border)" }}
          >
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-bold"
              style={{
                background: "var(--nr-accent-muted)",
                color: "var(--nr-accent)",
                border: "1px solid var(--nr-border-accent)",
              }}
            >
              {user.email?.[0]?.toUpperCase() || "A"}
            </div>
            <div className="hidden lg:block">
              <span className="text-[11.5px] font-medium max-w-[120px] truncate block" style={{ color: "var(--nr-text-secondary)" }}>
                {user.email?.split("@")[0] || "Admin"}
              </span>
              <span className="text-[9.5px] font-medium uppercase tracking-wider" style={{ color: "var(--nr-text-faint)" }}>
                Controller
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
