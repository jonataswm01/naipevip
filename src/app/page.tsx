import Hero from '@/components/Hero';
import SectionAbout from '@/components/SectionAbout';
import SectionMusic from '@/components/SectionMusic';
import SectionBar from '@/components/SectionBar';

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Seção 1 - Hero */}
      <Hero />
      {/* Seção 2 - O Que É a Tardezinha */}
      <SectionAbout />
      {/* Seção 3 - Música & Experiência */}
      <SectionMusic />
      {/* Seção 4 - Bar & Ambiente */}
      <SectionBar />
    </main>
  );
}
