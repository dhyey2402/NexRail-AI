import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--nr-bg)]">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

      <div
        className="flex flex-col flex-1 min-w-0 transition-all duration-200"
        style={{ marginLeft: collapsed ? 60 : 220 }}
      >
        <Navbar />
        <main className="flex-1 overflow-y-auto">
          <div className="p-5">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
