import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md flex flex-col items-center">
        {children}
      </div>
    </div>
  );
}
