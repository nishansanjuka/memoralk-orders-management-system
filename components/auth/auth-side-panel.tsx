import Image from "next/image";
import Link from "next/link";

interface AuthSidePanelProps {
  quote?: string;
  attribution?: string;
}

export function AuthSidePanel({
  quote = "Framing memories, not just photos.",
  attribution = "Memoralk Orders & Digital Systems",
}: AuthSidePanelProps) {
  return (
    <div className="relative hidden w-1/2 flex-col justify-between bg-slate-950 lg:flex min-h-screen">
      {/* Top Logo */}
      <Link href="/" className="relative z-20 flex items-center gap-3 p-8">
        <Image
          src="/android-chrome-512x512.png"
          alt="Memoralk Logo"
          width={36}
          height={36}
          className="size-9 rounded-xl border border-slate-700/60 shadow-md"
          priority
        />
        <div className="flex flex-col">
          <span className="text-base font-bold tracking-tight text-white leading-tight">
            Memoralk
          </span>
          <span className="text-[11px] font-medium text-slate-400">
            Order Management Portal
          </span>
        </div>
      </Link>

      {/* Branded Cover Backdrop */}
      <div className="absolute inset-0 overflow-hidden">
        <Image
          src="/cover.jpg"
          alt="Memoralk Branding"
          aria-hidden
          fill
          className="object-cover opacity-60 select-none pointer-events-none"
          sizes="(min-width: 1024px) 50vw, 0px"
          priority
        />
        {/* Scrim Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/70" />
      </div>

      {/* Quote Overlay pinned to bottom */}
      <div className="relative z-20 mt-auto p-8">
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-md shadow-2xl">
          <blockquote className="text-sm font-medium leading-relaxed text-slate-200">
            &ldquo;{quote}&rdquo;
          </blockquote>
          <p className="mt-3 text-xs font-semibold text-amber-400">&mdash; {attribution}</p>
        </div>
      </div>
    </div>
  );
}
