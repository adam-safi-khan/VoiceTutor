'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from '@/lib/utils/auth';

interface HeaderProps {
  userName?: string;
  showNav?: boolean;
}

export function Header({ userName, showNav = true }: HeaderProps) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <header className="bg-white border-b border-[var(--oxford-blue)]/5">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span 
              className="text-2xl font-semibold text-[var(--oxford-blue)]"
              style={{ fontFamily: 'var(--font-crimson), Georgia, serif' }}
            >
              Alaris
            </span>
          </Link>

          {showNav && (
            <>
              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-6">
                <Link 
                  href="/session" 
                  className="text-[var(--slate)] hover:text-[var(--oxford-blue)] transition text-sm font-medium"
                >
                  Session
                </Link>
                <Link 
                  href="/account" 
                  className="text-[var(--slate)] hover:text-[var(--oxford-blue)] transition text-sm font-medium"
                >
                  Account
                </Link>
                {userName && (
                  <div className="flex items-center gap-4 pl-4 border-l border-gray-200">
                    <span className="text-sm text-[var(--slate)]">
                      {userName}
                    </span>
                    <button
                      onClick={handleSignOut}
                      className="text-sm text-[var(--slate)] hover:text-[var(--oxford-blue)] transition"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </nav>

              {/* Mobile Hamburger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-[var(--oxford-blue)]"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </>
          )}
        </div>

        {/* Mobile Menu */}
        {showNav && mobileMenuOpen && (
          <nav className="md:hidden mt-4 pt-4 border-t border-[var(--oxford-blue)]/5 space-y-4">
            <Link 
              href="/session" 
              className="block text-[var(--slate)] hover:text-[var(--oxford-blue)] transition font-medium py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Session
            </Link>
            <Link 
              href="/account" 
              className="block text-[var(--slate)] hover:text-[var(--oxford-blue)] transition font-medium py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Account
            </Link>
            {userName && (
              <>
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-sm text-[var(--slate)] mb-2">
                    Signed in as <span className="font-medium">{userName}</span>
                  </p>
                  <button
                    onClick={handleSignOut}
                    className="text-sm text-[var(--oxford-blue)] hover:underline font-medium"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
