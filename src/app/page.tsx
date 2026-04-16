import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/sections/Hero";
import Servicios from "@/components/sections/Servicios";
import Portfolio from "@/components/sections/Portfolio";
import SobreNexo from "@/components/sections/SobreNexo";
import Contacto from "@/components/sections/Contacto";
import Footer from "@/components/layout/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Servicios />
        <Portfolio />
        <SobreNexo />
        <Contacto />
      </main>
      <Footer />
    </>
  );
}
