import React from "react";
import Sidebar from "./Sidebar";
import Topbar from "./TopBar";

const DashboardLayout = ({ children }) => {
  return (
    <div className="h-screen flex bg-slate-100">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Topbar />

        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
