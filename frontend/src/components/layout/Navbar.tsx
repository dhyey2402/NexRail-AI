import { useLocation } from "react-router-dom";
import { Sun, Moon } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useState, useEffect } from "react";

const routeTitles: Record<string, string> = {
  "/": "Operations Overview",
  "/search": "ETA Prediction",
  "/simulate": "What-If Simulation",
  "/monitor": "Live Operations",
  "/analytics": "Analytics",
  "/history": "Prediction History",
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

  const pageTitle = routeTitles[location.pathname] || "NexRail AI";

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-5 border-b bg-[var(--nr-surface)]/80 border-[var(--nr-border)] backdrop-blur-sm">
      <div>
        <h1 className="text-[14px] font-semibold text-[var(--nr-text)]">
          {pageTitle}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Live Clock (IST) */}
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-[var(--nr-text-muted)]">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--nr-success)] animate-pulse" />
          <time>
            {clock.toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: false,
              timeZone: "Asia/Kolkata",
            })}{" "}
            IST
          </time>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--nr-border)] bg-[var(--nr-surface-raised)] text-[var(--nr-text-muted)] hover:text-[var(--nr-text)] transition-colors"
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
          <div className="hidden md:flex items-center gap-2 pl-3 border-l border-[var(--nr-border)]">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--nr-accent-muted)] text-[var(--nr-accent)] text-[10px] font-semibold">
              {user.email?.[0]?.toUpperCase() || "A"}
            </div>
            <span className="text-[12px] text-[var(--nr-text-secondary)] font-medium max-w-[140px] truncate">
              {user.email}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
