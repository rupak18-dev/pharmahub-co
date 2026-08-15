import React from "react";
import { ProductShowcase } from "./ProductShowcase";

export function AuthLayout({ children }) {
  return (
    <div className="flex min-h-[100dvh] w-full bg-background overflow-x-hidden auth-layout">
      {/* Left Column: Dynamic Auth Form Area */}
      <div className="w-full lg:w-1/2 flex-shrink-0 relative z-10 bg-background shadow-2xl overflow-y-auto flex">
        {children}
      </div>

      {/* Right Column: Product Showcase */}
      <div className="hidden lg:block lg:w-1/2 flex-shrink-0 relative">
        <ProductShowcase />
      </div>
    </div>
  );
}
