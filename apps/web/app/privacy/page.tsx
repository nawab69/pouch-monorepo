import type { Metadata } from "next";
import Header from "@/components/header";
import Footer from "@/components/footer";

export const metadata: Metadata = {
  title: "Privacy Policy — Pouch",
  description: "Pouch privacy policy. Learn how we handle your data.",
};

export default function PrivacyPolicy() {
  return (
    <>
      <Header />
      <main className="pt-28 pb-20">
        <div className="max-w-3xl mx-auto px-6">
          <h1 className="text-3xl md:text-4xl font-bold text-wallet-text mb-2">
            Privacy Policy
          </h1>
          <p className="text-wallet-text-muted text-sm mb-12">
            Last updated: February 2026
          </p>

          <div className="space-y-10 text-wallet-text-secondary leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-wallet-text mb-3">
                Introduction
              </h2>
              <p>
                Pouch is a non-custodial cryptocurrency wallet. We are committed
                to respecting your privacy and minimizing the data we collect. This
                policy explains what information we handle and how we handle it.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-wallet-text mb-3">
                Information We Collect
              </h2>
              <p>
                We collect only public wallet addresses, solely for the purpose of
                delivering push notifications about your transactions. We do not
                collect your name, email address, phone number, or any other
                personal information. We do not use analytics tracking.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-wallet-text mb-3">
                Information We Do NOT Collect
              </h2>
              <ul className="list-disc list-inside space-y-1.5">
                <li>Private keys or seed phrases</li>
                <li>Transaction details or history</li>
                <li>Personal information (name, email, phone number)</li>
                <li>Usage analytics or behavioral data</li>
                <li>Location data</li>
                <li>Device identifiers beyond what is needed for push notifications</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-wallet-text mb-3">
                Data Storage
              </h2>
              <p>
                Your private keys and recovery phrase are stored exclusively on
                your device. They are encrypted with your PIN and protected by
                biometric authentication when enabled. We have no access to your
                private keys at any time.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-wallet-text mb-3">
                Third-Party Services
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-wallet-text">Uniswap V3</h3>
                  <p>
                    Token swap transactions are executed directly via Uniswap V3
                    smart contracts from your device. We do not route, intercept,
                    or store any transaction data.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-wallet-text">CoinGecko</h3>
                  <p>
                    Price data is fetched through our cache server to provide
                    real-time token prices. No user data is sent to CoinGecko.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium text-wallet-text">WalletConnect</h3>
                  <p>
                    WalletConnect provides a peer-to-peer connection protocol for
                    connecting to decentralized applications. We do not store
                    WalletConnect session data.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-wallet-text mb-3">
                Push Notifications
              </h2>
              <p>
                If you enable push notifications, your public wallet address is
                stored on our server to deliver transaction alerts. You can
                disable push notifications at any time through the app settings,
                which will remove your wallet address from our notification
                system.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-wallet-text mb-3">
                Changes to This Policy
              </h2>
              <p>
                We may update this privacy policy from time to time. Any changes
                will be posted on this page with an updated revision date. We
                encourage you to review this policy periodically.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-wallet-text mb-3">
                Contact
              </h2>
              <p>
                If you have questions about this privacy policy, please contact us
                at{" "}
                <a
                  href="mailto:contact@mithium.io"
                  className="text-wallet-accent-dark hover:underline"
                >
                  contact@mithium.io
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
