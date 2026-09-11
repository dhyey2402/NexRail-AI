import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex">
      <Sidebar />
      <div className="flex-1 ml-[250px] min-w-0 transition-all duration-200 flex flex-col min-h-screen">
        <Navbar />
        <main className="p-5 max-w-7xl w-full mx-auto flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
