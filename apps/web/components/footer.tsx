import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="border-t border-wallet-border bg-wallet-bg">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Pouch"
              width={28}
              height={28}
              className="rounded-md"
            />
            <div>
              <span className="font-semibold text-wallet-text">Pouch</span>
              <p className="text-xs text-wallet-text-muted">
                Your keys, your crypto.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="text-sm text-wallet-text-secondary hover:text-wallet-text transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-wallet-text-secondary hover:text-wallet-text transition-colors"
            >
              Terms & Conditions
            </Link>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-wallet-border text-center">
          <p className="text-xs text-wallet-text-muted">
            &copy; {new Date().getFullYear()} Mithium. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
