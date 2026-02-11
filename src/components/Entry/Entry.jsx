import React from "react";
import entryImg from "../../assets/images/entry.jpg";
import ClinicApply from "../CreateClinic/ClinicApply";

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

   <div className="w-full md:w-1/2 min-h-screen flex items-center justify-center bg-white">
        <div className="w-full h-full px-16 py-20 flex flex-col justify-center">
          <ClinicApply />
        </div>
      </div>
    </div>
  );
};

export default Entry;
