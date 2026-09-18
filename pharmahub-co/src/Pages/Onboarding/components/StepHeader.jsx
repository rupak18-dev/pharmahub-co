import React from "react";

export function StepHeader({ title, subtitle }) {
  return (
    <div className="mb-10">
      <h1 className="auth-title">{title}</h1>
      {subtitle && <p className="auth-subtitle mt-4">{subtitle}</p>}
    </div>
  );
}
