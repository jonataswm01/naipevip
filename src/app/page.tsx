import Hero from '@/components/Hero';
import SectionAbout from '@/components/SectionAbout';
import SectionMusic from '@/components/SectionMusic';
import SectionBar from '@/components/SectionBar';
import SectionInfo from '@/components/SectionInfo';
import SectionTickets from '@/components/SectionTickets';
import SectionSecurity from '@/components/SectionSecurity';
import SectionCTA from '@/components/SectionCTA';
import Footer from '@/components/Footer';
import NavBar from '@/components/NavBar';

export default function Home() {
  return (
    <>
      {/* Navbar flutuante - aparece após o primeiro scroll */}
      <NavBar />

      <main className="min-h-screen">
        {/* Seção 1 - Hero */}
        <Hero />
        {/* Seção 2 - Ingressos (Conversão direta) */}
        <SectionTickets />
        {/* Seção 3 - Segurança & Simplicidade (Remove objeções) */}
        <SectionSecurity />
        {/* Seção 4 - Informações do Evento */}
        <SectionInfo />
        {/* Seção 5 - Bar & Ambiente */}
        <SectionBar />
        {/* Seção 6 - O Que É a Tardezinha */}
        <SectionAbout />
        {/* Seção 7 - Música & Experiência */}
        <SectionMusic />
        {/* Seção 8 - CTA Final */}
        <SectionCTA />
        {/* Footer */}
        <Footer />
      </main>
    </>
  );
}
