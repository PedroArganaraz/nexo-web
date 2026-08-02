import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/sections/Hero";
import NexoInteractive from "@/components/NexoInteractive";
import SobreElEstudio from "@/components/sections/SobreElEstudio";
import Servicios from "@/components/sections/Servicios";
import Proceso from "@/components/sections/Proceso";
import Portfolio from "@/components/sections/Portfolio";
import SobreNexo from "@/components/sections/SobreNexo";
import Contacto from "@/components/sections/Contacto";
import Footer from "@/components/layout/Footer";
import WhatsAppButton from "@/components/ui/WhatsAppButton";
import { getProyectos } from "@/lib/proyectos";

export default async function Home() {
  const projects = await getProyectos();

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <NexoInteractive />
        <SobreElEstudio />
        <Servicios />
        <Proceso />
        <Portfolio projects={projects} />
        <SobreNexo />
        <Contacto />
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
