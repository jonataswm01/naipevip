'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
interface NavItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  highlight?: boolean;
  isExternalLink?: boolean;
  iconOnly?: boolean;
}

// 2 CTAs: Atrações (scroll para quem toca) + Ingressos (scroll para seção de ingressos)
const navItems: NavItem[] = [
  {
    id: 'djs',
    label: 'Atrações',
    icon: '🎧',
    href: '#djs',
  },
  {
    id: 'ingressos',
    label: 'Ingressos',
    icon: '🎟️',
    href: '#ingressos',
    highlight: true,
  },
];

export default function NavBar() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeSection, setActiveSection] = useState('djs');

  // Detecta scroll para mostrar/ocultar navbar
  useEffect(() => {
    const handleScroll = () => {
      // Mostra navbar assim que sair da Hero section (após scrollar 100px)
      const scrollThreshold = 100;
      setIsVisible(window.scrollY > scrollThreshold);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Verifica estado inicial

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Detecta seção ativa baseado no scroll (djs, ingressos)
  useEffect(() => {
    const handleSectionDetection = () => {
      const sections = ['djs', 'ingressos'];
      const scrollPosition = window.scrollY + window.innerHeight / 2;

      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(sectionId);
            return;
          }
        }
      }

      // No topo ou entre seções: destaca Atrações
      setActiveSection('djs');
    };

    window.addEventListener('scroll', handleSectionDetection, { passive: true });
    return () => window.removeEventListener('scroll', handleSectionDetection);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, item: NavItem) => {
    if (item.isExternalLink) {
      e.preventDefault();
      window.open(item.href, '_blank', 'noopener,noreferrer');
      return;
    }

    e.preventDefault();

    if (item.href === '#') {
      // Scroll para o topo
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setActiveSection('inicio');
      return;
    }

    const targetId = item.href.replace('#', '');
    const element = document.getElementById(targetId);

    if (element) {
      const offsetTop = element.offsetTop - 20; // Pequeno offset
      window.scrollTo({ top: offsetTop, behavior: 'smooth' });
      setActiveSection(targetId);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.nav
          className="fixed bottom-4 left-1/2 z-50"
          initial={{ opacity: 0, y: 20, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 20, x: '-50%' }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {/* Container da navbar com efeito glass */}
          <div className="flex items-center gap-5 px-3 py-2 bg-marrom-dark/85 backdrop-blur-md border border-amarelo/20 rounded-full shadow-warm">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              const isHighlight = item.highlight;

              return (
                <motion.a
                  key={item.id}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item)}
                  className={`
                    relative flex items-center gap-1.5 rounded-full
                    font-titulo text-xs uppercase tracking-wider
                    transition-all duration-300
                    ${item.iconOnly ? 'px-3 py-2.5' : 'px-4 py-2.5'}
                    ${isHighlight
                      ? isActive
                        ? 'bg-amarelo text-marrom-dark shadow-glow'
                        : 'bg-amarelo/20 text-amarelo hover:bg-amarelo/30'
                      : isActive
                        ? 'bg-off-white/10 text-cream'
                        : 'text-off-white-soft hover:text-cream hover:bg-off-white/5'
                    }
                  `}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Ícone */}
                  <span className={item.iconOnly ? 'text-base' : 'text-sm'}>{item.icon}</span>
                  
                  {/* Label - só mostra se não for iconOnly */}
                  {!item.iconOnly && item.label && (
                    <span>{item.label}</span>
                  )}

                  {/* Indicador de ativo (glow sutil) */}
                  {isActive && !isHighlight && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-off-white/5"
                      layoutId="activeIndicator"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </motion.a>
              );
            })}
          </div>

          {/* Safe area padding para iPhones com notch */}
          <div className="h-[env(safe-area-inset-bottom)]" />
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
