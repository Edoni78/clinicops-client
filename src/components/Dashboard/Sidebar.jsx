import React from "react";

const Sidebar = () => {
  return (
    <aside className="w-64 bg-white border-r hidden md:block">
      <div className="p-6 font-bold text-xl text-[#81a2c5]">
        ClinicOps
      </div>

      <nav className="px-4 space-y-2">
        {[
          "Dashboard",
          "Patients",
          "Cases",
          "Laboratory",
          "Payments",
          "Staff",
        ].map((item) => (
          <div
            key={item}
            className="px-4 py-2 rounded-lg cursor-pointer text-slate-600 hover:bg-slate-100"
          >
            {item}
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
