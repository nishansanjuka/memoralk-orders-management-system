"use client";

import { SignIn } from "@clerk/nextjs";
import { AuthSidePanel } from "@/components/auth/auth-side-panel";
import Image from "next/image";
import Link from "next/link";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen">
      {/* Branded Left Side Panel */}
      <AuthSidePanel
        quote="Every order carries a memory worth cherishing. Precision management ensures seamless delivery."
        attribution="Memoralk Operations"
      />

      {/* Right Form Panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-12 bg-slate-50">
        {/* Mobile Header (shown on screens < lg) */}
        <div className="mb-8 flex flex-col items-center text-center lg:hidden">
          <Link href="/" className="flex items-center gap-2.5 mb-2">
            <Image
              src="/android-chrome-512x512.png"
              alt="Memoralk Logo"
              width={40}
              height={40}
              className="size-10 rounded-xl shadow-md"
              priority
            />
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Memoralk
            </span>
          </Link>
          <p className="text-xs text-slate-500">
            Sign in to access your orders management dashboard
          </p>
        </div>

        <SignIn />
      </div>
    </div>
  );
}
