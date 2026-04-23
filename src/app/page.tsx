import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/sections/Hero";
import SobreElEstudio from "@/components/sections/SobreElEstudio";
import Servicios from "@/components/sections/Servicios";
import Proceso from "@/components/sections/Proceso";
import Portfolio from "@/components/sections/Portfolio";
import SobreNexo from "@/components/sections/SobreNexo";
import Contacto from "@/components/sections/Contacto";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/ui/WhatsAppButton";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <SobreElEstudio />
        <Servicios />
        <Proceso />
        <Portfolio />
        <SobreNexo />
        <Contacto />
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
