import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--nr-bg)" }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

      <div
        className="flex flex-col flex-1 min-w-0 transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
        style={{ marginLeft: collapsed ? 64 : 232 }}
      >
        <Navbar />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-[1600px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
