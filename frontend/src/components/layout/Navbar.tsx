import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Clock,
  Volume2,
  VolumeX,
  Zap,
  Sun,
  Moon,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  "/": { title: "Operations Dashboard", subtitle: "Real-time dispatch overview & network throughput" },
  "/search": { title: "Live Train Telemetry", subtitle: "Real-time LightGBM ETA prediction & track HUD" },
  "/simulate": { title: "Operational Simulator", subtitle: "What-If contingency analysis & congestion impact" },
  "/monitor": { title: "Fleet & Network Map", subtitle: "Geographic corridor monitoring & sectional status" },
  "/analytics": { title: "System Analytics", subtitle: "Model accuracy, drift telemetry & regional delay trends" },
  "/history": { title: "Prediction Audit", subtitle: "Historical inference logs & verification records" },
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const location = useLocation();
  const current = pageTitles[location.pathname] || {
    title: "Operations Dashboard",
    subtitle: "Indian Railways Central Operations",
  };
  const [time, setTime] = useState(new Date());
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = time.toLocaleTimeString("en-IN", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <header className="h-14 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Title & Section */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold text-zinc-100 tracking-tight">
              {current.title}
            </h1>
            <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-zinc-500 font-mono">
              / {current.subtitle}
            </span>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3 text-xs">
        {/* Live Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-[11px] font-medium text-zinc-300">Live Network</span>
        </div>

        {/* Inference Latency */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono text-[11px]">
          <Zap className="w-3 h-3 text-sky-400" />
          <span className="text-zinc-300">38ms</span>
        </div>

        {/* Clock (IST) */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 font-mono text-[11px] text-zinc-200">
          <Clock className="w-3.5 h-3.5 text-zinc-400" />
          <span className="font-semibold">{formattedTime}</span>
          <span className="text-zinc-500 text-[10px]">IST</span>
        </div>

        {/* Sound Toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors"
          title={soundEnabled ? "Mute chimes" : "Unmute chimes"}
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>

        {/* Dispatcher Badge */}
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{user?.email || "Admin"}</span>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="p-1.5 rounded-md bg-red-900/20 border border-red-900/50 text-red-400 hover:bg-red-900/40 hover:text-red-300 transition-colors"
          title="Sign Out"
        >
          <span className="text-[11px] font-medium px-1">Sign Out</span>
        </button>
      </div>
    </header>
  );
}
