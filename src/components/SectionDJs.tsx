'use client';

import { motion, Variants } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useState, useRef } from 'react';

/* ============================================
   ONDE ADICIONAR FOTOS E VÍDEOS DOS DJs
   ============================================
   FOTOS: public/images/djs/dj-{id}.jpg (ou .jpeg, .png, .webp)
   VÍDEOS LOCAIS: public/videos/dj-{id}-video.mp4 (vertical)
   VÍDEOS EXTERNOS: videoUrl com link YouTube ou Vimeo (usa embed)
   ============================================ */

const djs = [
  {
    id: 'meomas',
    name: 'DJ Meomas',
    photo: '',
    videoLocal: '/videos/dj-meomas-video.mp4',
    videoUrl: '',
  },
  {
    id: 'valle',
    name: 'DJ Valle',
    photo: '/images/djs/dj-valle.jpeg',
    videoLocal: '/videos/dj-valle-video.mp4',
    videoUrl: '',
  },
];

function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

function getVimeoEmbedUrl(url: string): string | null {
  if (!url) return null;
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match ? `https://player.vimeo.com/video/${match[1]}` : null;
}

function getVideoEmbedUrl(url: string): string | null {
  return getYouTubeEmbedUrl(url) || getVimeoEmbedUrl(url);
}

/* ----- Avatar pequeno (foto do DJ) ----- */
function DJAvatar({ src, alt }: { src: string; alt: string }) {
  const [error, setError] = useState(false);
  const showPlaceholder = !src || error;

  return (
    <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-off-white/20 bg-off-white/5 ring-2 ring-off-white/5">
      {showPlaceholder ? (
        <div className="w-full h-full flex items-center justify-center text-off-white/40">
          <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={() => setError(true)}
        />
      )}
    </div>
  );
}

/* ----- Vídeo vertical com play estilizado (sem controles nativos) ----- */
function DJVerticalVideo({
  src,
  embedUrl,
  name,
}: {
  src?: string;
  embedUrl: string | null;
  name: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const isLocal = !!src;

  const handleTogglePlay = () => {
    if (!isLocal || !videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleEnded = () => setIsPlaying(false);

  if (!src && !embedUrl) return null;

  return (
    <div className="w-full flex justify-center px-0">
      {/* Container vertical 9:16, maior na tela */}
      <div className="relative w-full max-w-[280px] sm:max-w-[320px] mx-auto aspect-[9/16] rounded-xl overflow-hidden bg-black/60 border border-off-white/10 shadow-2xl">
        {isLocal ? (
          <>
            <video
              ref={videoRef}
              src={src}
              playsInline
              muted={false}
              loop={false}
              className="absolute inset-0 w-full h-full object-cover cursor-pointer"
              onClick={handleTogglePlay}
              onEnded={handleEnded}
              preload="metadata"
            />
            {/* Overlay com botão play (só quando pausado) */}
            {!isPlaying && (
              <button
                type="button"
                onClick={handleTogglePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity hover:bg-black/20 focus:outline-none focus-ring-2 focus:ring-amarelo/50 focus:ring-offset-2 focus:ring-offset-transparent rounded-xl"
                aria-label={`Reproduzir vídeo de ${name}`}
              >
                <span className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-amarelo/95 text-marrom-dark shadow-warm border-2 border-amarelo-light/50 transition-transform hover:scale-110 active:scale-95">
                  <svg className="w-7 h-7 sm:w-8 sm:h-8 ml-1" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path d="M8 5v14l11-7L8 5z" />
                  </svg>
                </span>
              </button>
            )}
          </>
        ) : embedUrl ? (
          <iframe
            src={embedUrl}
            title={`Vídeo de ${name}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full object-cover rounded-xl"
          />
        ) : null}
      </div>
    </div>
  );
}

export default function SectionDJs() {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.2 },
    },
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  return (
    <section
      id="djs"
      className="bg-music-night section-soft texture-noise overlay-night min-h-screen py-16 md:py-24 px-4 sm:px-6 relative overflow-hidden"
      ref={ref}
    >
      <div className="absolute inset-0 bg-pattern opacity-8" aria-hidden="true" />

      <motion.div
        className="relative z-10 max-w-2xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
      >
        <motion.div className="text-center mb-10 md:mb-12" variants={cardVariants}>
          <h2 className="font-titulo text-2xl sm:text-3xl md:text-4xl text-cream uppercase tracking-wide">
            Quem toca
          </h2>
          <p className="font-texto text-off-white-soft mt-2">No line-up da noite</p>
        </motion.div>

        <div className="space-y-12 md:space-y-16">
          {djs.map((dj) => {
            const embedUrl = getVideoEmbedUrl(dj.videoUrl);
            const hasVideo = dj.videoLocal || embedUrl;

            return (
              <motion.article
                key={dj.id}
                className="panel-night border-organic-lg overflow-hidden p-4 sm:p-6"
                variants={cardVariants}
              >
                {/* Cabeçalho: foto pequena + nome */}
                <div className="flex items-center gap-4 mb-5 sm:mb-6">
                  <DJAvatar src={dj.photo} alt={dj.name} />
                  <h3 className="font-titulo text-xl sm:text-2xl text-cream uppercase tracking-wide">
                    {dj.name}
                  </h3>
                </div>

                {/* Vídeo vertical com play estilizado */}
                {hasVideo && (
                  <DJVerticalVideo
                    src={dj.videoLocal}
                    embedUrl={embedUrl}
                    name={dj.name}
                  />
                )}
              </motion.article>
            );
          })}
        </div>

        <motion.div className="mt-10 text-center" variants={cardVariants}>
          <a
            href="#ingressos"
            className="inline-block font-titulo text-base md:text-lg text-off-white hover:text-amarelo uppercase tracking-wider px-6 py-3 border border-off-white/50 hover:border-amarelo rounded-lg transition-all duration-300 hover:bg-amarelo/5"
          >
            Garantir meu ingresso
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
}
