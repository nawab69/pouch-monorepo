import { FaApple, FaGooglePlay } from "react-icons/fa";
import PhoneMockup from "./phone-mockup";

export default function Hero() {
  return (
    <section id="download" className="relative pt-24 pb-16 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        <div className="relative flex flex-col lg:flex-row gap-5">
          {/* Left — white card with text */}
          <div className="lg:w-1/2 bg-white rounded-2xl p-8 md:p-12 flex flex-col justify-center min-h-[520px]">
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl leading-[1.1] text-wallet-text animate-fade-in-up">
              Secure &<br />
              Easy-to-Use<br />
              Crypto Wallet
            </h1>
            <p className="mt-6 font-mono text-base text-wallet-text-secondary max-w-md animate-fade-in-up animation-delay-100">
              Store, Send & Receive<br />
              Cryptocurrencies with Confidence
            </p>

            <div className="mt-8 animate-fade-in-up animation-delay-200">
              <a
                href="#features"
                className="inline-flex items-center gap-2 bg-wallet-accent text-wallet-text px-6 py-3 rounded-full font-mono font-bold text-sm hover:bg-wallet-accent-dark transition-colors"
              >
                Get Started &#8599;
              </a>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3 animate-fade-in-up animation-delay-300">
              <a
                href="#"
                className="inline-flex items-center gap-2 border border-wallet-border text-wallet-text px-5 py-2.5 rounded-full font-mono text-sm hover:bg-wallet-card-light transition-colors"
              >
                App Store <FaApple className="text-lg" />
              </a>
              <a
                href="#"
                className="inline-flex items-center gap-2 border border-wallet-border text-wallet-text px-5 py-2.5 rounded-full font-mono text-sm hover:bg-wallet-card-light transition-colors"
              >
                Google Play <FaGooglePlay className="text-base" />
              </a>
            </div>
          </div>

          {/* Right — accent card with phone */}
          <div className="lg:w-1/2 animate-fade-in-up animation-delay-300">
            <div className="bg-wallet-accent rounded-2xl h-full relative flex items-end justify-center overflow-hidden min-h-[520px]">
              {/* Portfolio floating card */}
              <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm rounded-xl px-5 py-4 shadow-sm z-10">
                <p className="text-xs text-wallet-text-secondary font-mono">My portfolio</p>
                <p className="text-xl font-bold text-wallet-text mt-0.5">$38,867.45</p>
              </div>

              {/* Phone mockup */}
              <div className="relative z-5 translate-y-6 scale-90">
                <PhoneMockup
                  src="/screenshots/dashboard.png"
                  alt="Pouch dashboard showing crypto portfolio"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
