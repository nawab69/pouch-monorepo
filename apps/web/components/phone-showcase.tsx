import PhoneMockup from "./phone-mockup";

export default function PhoneShowcase() {
  return (
    <section id="security" className="py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Phone screenshots on left */}
          <div className="bg-gray-200 rounded-3xl p-8 md:p-10 flex items-end justify-center gap-5 overflow-hidden">
            <PhoneMockup
              src="/screenshots/create-pin.png"
              alt="Pouch create PIN screen"
            />
            <div className="hidden sm:block translate-y-8">
              <PhoneMockup
                src="/screenshots/recovery-phrase.png"
                alt="Pouch 12-word recovery phrase screen"
              />
            </div>
          </div>

          {/* Security content on right */}
          <div className="flex-1 text-center lg:text-left">
            <span className="pill-label">Security</span>
            <h2 className="mt-6 font-display text-3xl md:text-4xl lg:text-[2.75rem] leading-snug text-wallet-text">
              Secure & Private
            </h2>
            <p className="mt-5 font-mono text-base text-wallet-text-secondary leading-relaxed max-w-md mx-auto lg:mx-0">
              Your private keys are encrypted and stored exclusively on your device. We never have access to your funds or data — a truly non-custodial wallet built on industry-leading security standards.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
