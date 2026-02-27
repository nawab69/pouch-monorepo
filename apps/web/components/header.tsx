"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-wallet-bg/90 backdrop-blur-md">
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="Pouch"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="text-lg font-semibold text-wallet-text">Pouch</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          <a
            href="#features"
            className="text-sm text-wallet-text-secondary hover:text-wallet-text transition-colors"
          >
            Features
          </a>
          <a
            href="#security"
            className="text-sm text-wallet-text-secondary hover:text-wallet-text transition-colors"
          >
            Security
          </a>
          <a
            href="#faq"
            className="text-sm text-wallet-text-secondary hover:text-wallet-text transition-colors"
          >
            FAQ
          </a>
        </div>

        <a
          href="#download"
          className="hidden md:inline-flex items-center px-5 py-2.5 bg-wallet-text text-white rounded-full text-sm font-medium hover:bg-black transition-colors"
        >
          Download App
        </a>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-wallet-text"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            {mobileOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-wallet-bg/95 backdrop-blur-md border-b border-wallet-border px-6 pb-4 flex flex-col gap-3">
          <a
            href="#features"
            className="text-sm text-wallet-text-secondary py-2"
            onClick={() => setMobileOpen(false)}
          >
            Features
          </a>
          <a
            href="#security"
            className="text-sm text-wallet-text-secondary py-2"
            onClick={() => setMobileOpen(false)}
          >
            Security
          </a>
          <a
            href="#faq"
            className="text-sm text-wallet-text-secondary py-2"
            onClick={() => setMobileOpen(false)}
          >
            FAQ
          </a>
          <a
            href="#download"
            className="text-sm font-medium bg-wallet-text text-white rounded-full px-5 py-2.5 text-center"
            onClick={() => setMobileOpen(false)}
          >
            Download App
          </a>
        </div>
      )}
    </header>
  );
}
