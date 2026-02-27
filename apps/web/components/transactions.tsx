import PhoneMockup from "./phone-mockup";

export default function Transactions() {
  return (
    <section className="py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Text */}
          <div className="flex-1 text-center lg:text-left">
            <span className="pill-label">Transactions</span>
            <h2 className="mt-6 font-display text-3xl md:text-4xl leading-snug text-wallet-text">
              Fast & Low-Cost Transactions
            </h2>
            <p className="mt-4 font-mono text-base text-wallet-text-secondary leading-relaxed max-w-md">
              Send and receive crypto instantly with zero platform fees — you only pay gas fees that go directly to the blockchain. No hidden charges, no middlemen.
            </p>
          </div>

          {/* Phone on accent card */}
          <div className="flex-1">
            <div className="bg-wallet-accent rounded-3xl p-8 md:p-12 flex items-center justify-center">
              <PhoneMockup
                src="/screenshots/send.png"
                alt="Pouch send transaction screen"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
