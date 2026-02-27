"use client";

import { useState } from "react";
import { FaShieldAlt, FaExchangeAlt, FaFingerprint, FaPlug } from "react-icons/fa";

const features = [
  {
    icon: <FaShieldAlt className="text-xl" />,
    title: "Non-Custodial Wallet",
    description: "Full control over your private keys",
  },
  {
    icon: <FaExchangeAlt className="text-xl" />,
    title: "Built-in Exchange",
    description: "Swap cryptocurrencies directly within the app",
    highlighted: true,
  },
  {
    icon: <FaFingerprint className="text-xl" />,
    title: "Biometric Security",
    description: "Face ID & authentication for extra protection",
  },
  {
    icon: <FaPlug className="text-xl" />,
    title: "WalletConnect",
    description: "Connect to dApps effortlessly",
  },
];

export default function Features() {
  const [hovered, setHovered] = useState<number | null>(1);

  return (
    <section id="features" className="py-20 md:py-28 bg-gray-100">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <span className="pill-label">Features</span>
          <h2 className="mt-6 font-display text-3xl md:text-4xl lg:text-[2.75rem] leading-snug text-wallet-text">
            We offer a safe, user-friendly,<br className="hidden md:block" />
            and efficient Crypto App
          </h2>
          <p className="mt-4 font-mono text-base text-wallet-text-secondary max-w-xl mx-auto">
            We envision a decentralized future where individuals have complete control over their financial assets
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feature, index) => {
            const isActive = hovered === index;
            return (
              <div
                key={feature.title}
                className={`rounded-2xl p-6 flex flex-col justify-between min-h-[280px] transition-colors duration-200 cursor-pointer ${
                  isActive
                    ? "bg-wallet-accent"
                    : "bg-white"
                }`}
                onMouseEnter={() => setHovered(index)}
                onMouseLeave={() => setHovered(null)}
              >
                <div>
                  <div
                    className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-16 ${
                      isActive
                        ? "bg-white text-wallet-text"
                        : "border border-wallet-border text-wallet-text"
                    }`}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-wallet-text mb-2">
                    {feature.title}
                  </h3>
                  <p className="font-mono text-sm text-wallet-text-secondary leading-relaxed">
                    {feature.description}
                  </p>
                </div>
                <div className="mt-5">
                  <span
                    className={`inline-flex items-center gap-1.5 font-mono text-sm px-4 py-2 rounded-full transition-colors ${
                      isActive
                        ? "bg-wallet-text text-white"
                        : "bg-wallet-accent text-wallet-text"
                    }`}
                  >
                    Learn more &#8599;
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
