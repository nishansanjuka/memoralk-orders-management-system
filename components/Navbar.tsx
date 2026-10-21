'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, RotateCcw, Menu, X, LogIn } from 'lucide-react';
import { UserButton, useUser } from '@clerk/nextjs';

interface NavbarProps {
  activeTab: 'dashboard' | 'orders' | 'history';
  setActiveTab: (tab: 'dashboard' | 'orders' | 'history') => void;
  onOpenCreateOrder: () => void;
  onResetData: () => void;
  pendingCount: number;
}

export function Navbar({
  activeTab,
  setActiveTab,
  onOpenCreateOrder,
  onResetData,
  pendingCount,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isSignedIn, isLoaded } = useUser();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="text-left group flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded-md"
            >
              <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200/80 shadow-xs flex items-center justify-center bg-white shrink-0">
                <Image
                  src="/logo.jpg"
                  alt="Memoralk Logo"
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
                Memoralk
              </span>
            </button>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 ${
                activeTab === 'dashboard'
                  ? 'text-slate-900 font-semibold border-b-2 border-slate-900'
                  : ''
              }`}
            >
              Growth Dashboard
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 flex items-center gap-1.5 ${
                activeTab === 'orders'
                  ? 'text-slate-900 font-semibold border-b-2 border-slate-900'
                  : ''
              }`}
            >
              <span>Order Queue</span>
              {pendingCount > 0 && (
                <span className="text-xs text-amber-700 font-mono font-medium">
                  ({pendingCount} pending)
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 ${
                activeTab === 'history'
                  ? 'text-slate-900 font-semibold border-b-2 border-slate-900'
                  : ''
              }`}
            >
              Status Audit History
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action + Clerk Auth Controls + Quick Utilities */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onResetData}
              title="Reset to fresh demo order data"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Data</span>
            </button>

            <button
              onClick={onOpenCreateOrder}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-indigo-600 active:scale-[0.98] transition-all shadow-sm whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>New Order</span>
            </button>

            {/* Clerk Authentication Controls */}
            <div className="flex items-center pl-1 border-l border-slate-200">
              {isLoaded && isSignedIn ? (
                <div className="flex items-center gap-2">
                  <UserButton
                    appearance={{
                      elements: {
                        userButtonAvatarBox: "w-8 h-8 rounded-full border border-slate-200",
                      },
                    }}
                  />
                </div>
              ) : (
                <Link
                  href="/sign-in"
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-slate-200 flex flex-col gap-2">
            <button
              onClick={() => {
                setActiveTab('dashboard');
                setMobileMenuOpen(false);
              }}
              className={`text-left px-3 py-2 text-sm font-medium rounded-md ${
                activeTab === 'dashboard'
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Growth Dashboard
            </button>
            <button
              onClick={() => {
                setActiveTab('orders');
                setMobileMenuOpen(false);
              }}
              className={`text-left px-3 py-2 text-sm font-medium rounded-md flex items-center justify-between ${
                activeTab === 'orders'
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>Order Queue</span>
              {pendingCount > 0 && (
                <span className="text-xs text-amber-700 font-mono font-medium">
                  {pendingCount} pending
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab('history');
                setMobileMenuOpen(false);
              }}
              className={`text-left px-3 py-2 text-sm font-medium rounded-md ${
                activeTab === 'history'
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Status Audit History
            </button>
            <div className="pt-2 border-t border-slate-100 flex justify-between items-center px-3">
              <button
                onClick={() => {
                  onResetData();
                  setMobileMenuOpen(false);
                }}
                className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 py-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Demo Data</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
