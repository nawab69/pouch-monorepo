"use client";

import { useState } from "react";

const faqs = [
  {
    question: "Is my crypto safe with this wallet?",
    answer:
      "Yes. Pouch is a non-custodial wallet, meaning your private keys are encrypted and stored exclusively on your device. We never have access to your funds or keys. Your wallet is further protected by PIN and biometric authentication.",
  },
  {
    question: "Which cryptocurrencies are supported?",
    answer:
      "Pouch supports Ethereum and all ERC-20 tokens on Ethereum mainnet. You can add any token by its contract address, and we automatically fetch token metadata and real-time prices.",
  },
  {
    question: "How can I restore my wallet?",
    answer:
      "You can restore your wallet at any time using your 12-word recovery phrase. During wallet creation, you are prompted to securely write down and verify this phrase. Keep it in a safe place — it is the only way to recover your wallet.",
  },
  {
    question: "How long do transactions take?",
    answer:
      "Transaction times depend on the Ethereum network congestion and the gas fee you set. Typically, transactions are confirmed within 15 seconds to a few minutes. You can track the status of each transaction in real-time within the app.",
  },
  {
    question: "Are there any fees for using the wallet?",
    answer:
      "Pouch does not charge any fees for sending or receiving crypto. The only costs are standard Ethereum network gas fees, which go directly to network validators. Token swaps may include a small Uniswap protocol fee.",
  },
  {
    question: "Can I use this wallet for NFTs?",
    answer:
      "NFT support is on our roadmap. Currently, Pouch focuses on ERC-20 token management, swaps, and WalletConnect integration for connecting to NFT marketplaces and other dApps.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 md:py-28">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-14">
          <span className="pill-label">FAQs</span>
          <h2 className="mt-6 font-display text-3xl md:text-4xl leading-snug text-wallet-text">
            Frequently asked questions
          </h2>
        </div>

        <div>
          {faqs.map((faq, index) => (
            <div key={index} className="faq-item">
              <button
                className="faq-toggle"
                onClick={() => toggle(index)}
                aria-expanded={openIndex === index}
              >
                <span>{faq.question}</span>
                <span className="faq-icon">
                  {openIndex === index ? "−" : "+"}
                </span>
              </button>
              <div className={`faq-content ${openIndex === index ? "open" : ""}`}>
                <p>{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
