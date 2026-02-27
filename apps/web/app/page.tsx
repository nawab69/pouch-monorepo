import Header from "@/components/header";
import Hero from "@/components/hero";
import Mission from "@/components/mission";
import PhoneShowcase from "@/components/phone-showcase";
import Transactions from "@/components/transactions";
import Features from "@/components/features";
import FAQ from "@/components/faq";
import Whitelist from "@/components/whitelist";
import Footer from "@/components/footer";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Mission />
        <PhoneShowcase />
        <Transactions />
        <Features />
        <FAQ />
        <Whitelist />
      </main>
      <Footer />
    </>
  );
}
