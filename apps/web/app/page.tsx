import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import UseCases from "@/components/landing/UseCases";
import Features from "@/components/landing/Features";
import Pricing from "@/components/landing/Pricing";
import Footer from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <UseCases />
        <Features />
        <Pricing />
      </main>
      <Footer />
    </>
  );
}
