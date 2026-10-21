"use client";

import { SignIn } from "@clerk/nextjs";
import Image from "next/image";

export default function SignInPage() {
  return (
    <div className="flex flex-col items-center justify-center w-full py-10">
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="w-14 h-14 mb-3 rounded-2xl overflow-hidden border border-slate-700/80 shadow-lg bg-white flex items-center justify-center">
          <Image
            src="/logo.jpg"
            alt="Memoralk Logo"
            width={56}
            height={56}
            className="w-full h-full object-cover"
            priority
          />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Memoralk</h1>
        <p className="text-sm text-slate-400 mt-1">Sign in to your orders management portal</p>
      </div>
      <SignIn />
    </div>
  );
}
