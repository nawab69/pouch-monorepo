"use client";

import { useState } from "react";

export default function Whitelist() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/whitelist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage("You're on the list! We'll be in touch soon.");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error || "Something went wrong.");
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <section className="py-20 md:py-28">
      <div className="max-w-xl mx-auto px-6 text-center">
        <span className="pill-label">Early Access</span>
        <h2 className="mt-6 font-display text-3xl md:text-4xl leading-snug text-wallet-text">
          Join the Whitelist
        </h2>
        <p className="mt-5 font-mono text-base text-wallet-text-secondary leading-relaxed">
          Be among the first to experience Pouch. Get early access and exclusive updates.
        </p>

        {status === "success" ? (
          <div className="mt-10 rounded-2xl bg-wallet-card-light p-8">
            <p className="font-mono text-base text-wallet-positive font-bold">
              {message}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-10 flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 rounded-full border border-wallet-border bg-wallet-card px-5 py-3 font-mono text-sm text-wallet-text placeholder:text-wallet-text-muted outline-none focus:border-wallet-accent-dark transition-colors"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="rounded-full bg-wallet-accent px-6 py-3 font-mono font-bold text-sm text-wallet-text hover:bg-wallet-accent-dark transition-colors disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
            >
              {status === "loading" ? "Joining..." : "Join Waitlist"}
            </button>
          </form>
        )}

        {status === "error" && message && (
          <p className="mt-4 font-mono text-sm text-wallet-negative">{message}</p>
        )}
      </div>
    </section>
  );
}
