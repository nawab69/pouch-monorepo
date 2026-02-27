import type { Metadata } from "next";
import Header from "@/components/header";
import Footer from "@/components/footer";

export const metadata: Metadata = {
  title: "Terms & Conditions — Pouch",
  description: "Pouch terms and conditions of use.",
};

export default function Terms() {
  return (
    <>
      <Header />
      <main className="pt-28 pb-20">
        <div className="max-w-3xl mx-auto px-6">
          <h1 className="text-3xl md:text-4xl font-bold text-wallet-text mb-2">
            Terms &amp; Conditions
          </h1>
          <p className="text-wallet-text-muted text-sm mb-12">
            Last updated: February 2026
          </p>

          <div className="space-y-10 text-wallet-text-secondary leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-wallet-text mb-3">
                Acceptance of Terms
              </h2>
              <p>
                By downloading, installing, or using Pouch, you agree to be bound
                by these Terms and Conditions. If you do not agree to these terms,
                do not use the application.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-wallet-text mb-3">
                Nature of Service
              </h2>
              <p>
                Pouch is a non-custodial cryptocurrency wallet. This means you are
                solely responsible for the security of your private keys and
                recovery phrase. We do not have access to your wallet and cannot
                recover lost private keys or seed phrases. If you lose your
                recovery phrase, your funds will be permanently inaccessible.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-wallet-text mb-3">
                No Financial Advice
              </h2>
              <p>
                Pouch does not provide financial, investment, or trading advice.
                Price data, portfolio values, and market information displayed in
                the app are for informational purposes only. You should conduct
                your own research and consult qualified professionals before
                making any financial decisions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-wallet-text mb-3">
                Token Swaps
              </h2>
              <p>
                Token swaps within Pouch are executed via Uniswap V3 smart
                contracts directly from your device. We do not control or
                guarantee swap outcomes, prices, or liquidity. You bear all risks
                associated with decentralized exchange transactions, including but
                not limited to slippage, failed transactions, and smart contract
                vulnerabilities.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-wallet-text mb-3">
                Supported Networks
              </h2>
              <p>
                Pouch currently supports Ethereum mainnet and select testnets.
                Network availability may change without prior notice. We do not
                guarantee uninterrupted access to any blockchain network.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-wallet-text mb-3">
                Limitation of Liability
              </h2>
              <p>
                To the maximum extent permitted by applicable law, Mithium and its
                affiliates shall not be liable for any loss of funds, data, or
                profits arising from: user error (including sending assets to
                incorrect addresses), smart contract bugs or vulnerabilities,
                blockchain network issues or outages, security breaches on your
                device, or any other circumstances beyond our reasonable control.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-wallet-text mb-3">
                User Responsibilities
              </h2>
              <ul className="list-disc list-inside space-y-1.5">
                <li>Securely store and back up your 12-word recovery phrase</li>
                <li>Keep your device secure with up-to-date software</li>
                <li>Verify recipient addresses before sending any transactions</li>
                <li>Understand the risks associated with cryptocurrency</li>
                <li>Comply with all applicable laws in your jurisdiction</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-wallet-text mb-3">
                Prohibited Uses
              </h2>
              <p>
                You may not use Pouch for any illegal activity, including but not
                limited to money laundering, terrorist financing, sanctions
                evasion, or any activity that violates applicable laws and
                regulations.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-wallet-text mb-3">
                Modifications
              </h2>
              <p>
                We reserve the right to modify these terms at any time. Changes
                will be posted on this page. Your continued use of Pouch after any
                modifications constitutes your acceptance of the updated terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-wallet-text mb-3">
                Governing Law
              </h2>
              <p>
                These terms shall be governed by and construed in accordance with
                the laws applicable to Mithium&apos;s jurisdiction. Any disputes
                arising from these terms or your use of Pouch shall be subject to
                the exclusive jurisdiction of the competent courts in that
                jurisdiction.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-wallet-text mb-3">
                Contact
              </h2>
              <p>
                If you have questions about these terms, please contact us at{" "}
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
