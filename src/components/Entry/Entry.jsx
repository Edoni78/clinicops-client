import React from "react";
import entryImg from "../../assets/images/entry.jpg";

const Entry = () => {
  return (
  <div className="h-screen flex bg-slate-100 overflow-hidden">
      
      {/* LEFT SIDE – IMAGE */}
      <div className="hidden md:block md:w-1/2 h-screen">
        <img
          src={entryImg}
          alt="Medical"
          className="w-full h-full object-cover"
        />
      </div>

      {/* RIGHT SIDE – FORM */}
     <div className="w-full md:w-1/2 min-h-screen flex items-center justify-center bg-white">
  <div className="w-full h-full px-16 py-20 flex flex-col justify-center">

    <h1 className="text-4xl font-bold text-[#81a2c5] mb-4">
      Welcome to ClinicOps
    </h1>

    <p className="text-slate-500 mb-10 max-w-xl">
      Create and manage your clinic operations in one modern, secure platform.
    </p>

    <form className="space-y-6 max-w-xl">
      <input
        type="text"
        placeholder="Clinic name"
        className="w-full border border-slate-300 rounded-md px-4 py-3 text-lg
        focus:outline-none focus:ring-2 focus:ring-[#81a2c5]"
      />

      <input
        type="email"
        placeholder="Admin email"
        className="w-full border border-slate-300 rounded-md px-4 py-3 text-lg
        focus:outline-none focus:ring-2 focus:ring-[#81a2c5]"
      />

      <input
        type="password"
        placeholder="Password"
        className="w-full border border-slate-300 rounded-md px-4 py-3 text-lg
        focus:outline-none focus:ring-2 focus:ring-[#81a2c5]"
      />

      <button
        type="button"
        className="w-full bg-[#81a2c5] text-white py-3 rounded-md text-lg font-semibold
        hover:opacity-90 transition"
      >
        Create Clinic
      </button>
    </form>

    <p className="text-sm text-slate-400 mt-10">
      Secure • Fast • Real-time clinic management
    </p>
  </div>
</div>
    </div>
  );
};

export default Entry;
