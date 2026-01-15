import React from "react";
import entryImg from "../../assets/images/entry.jpg";
import ClinicLoginForm from "./ClinicLoginForm";


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
          <ClinicLoginForm />
        </div>
      </div>
    </div>
  );
};

export default Entry;
