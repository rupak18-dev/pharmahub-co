import React from "react";

export function BackgroundPattern() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-500/10 blur-[120px]" />
      <div className="absolute top-[40%] left-[20%] w-[30%] h-[30%] rounded-full bg-emerald-300/10 blur-[100px]" />
    </div>
  );
}
