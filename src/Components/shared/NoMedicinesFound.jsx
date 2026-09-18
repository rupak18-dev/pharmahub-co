import React from "react";

export function NoMedicinesFound({ onClearSearch }) {
  return (
    <div className="w-full py-6 sm:py-10 flex flex-col items-center justify-center bg-transparent border-0 shadow-none text-center select-none">
      <div className="relative inline-block w-full max-w-[320px] sm:max-w-[380px] md:max-w-[420px] mx-auto">
        
        {/* Real 3D Medical Illustration Image that mixes seamlessly into the page */}
        <img
          src="/medicines/no_medicines_found.png"
          alt="No Medicines Found"
          className="w-full h-auto object-contain mix-blend-multiply pointer-events-auto block"
        />

        {/* Interactive Clear Search Button overlay matching the exact position in the image */}
        <button
          type="button"
          onClick={onClearSearch}
          aria-label="Clear Search"
          title="Clear Search"
          className="absolute bottom-[4.8%] left-1/2 -translate-x-1/2 w-[42%] h-[9%] rounded-full cursor-pointer transition-all duration-200 hover:bg-blue-500/15 active:scale-95 ring-2 ring-transparent hover:ring-blue-400/40"
        />

      </div>
    </div>
  );
}
