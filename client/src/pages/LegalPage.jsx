import React, { useState } from 'react';
import LegalDocumentView from '../components/LegalDocumentView';
import { generateParticles } from '../utils/uiUtils';
import '../styles/LegalPage.css';

function Particles() {
  const [pts] = useState(() => generateParticles(20));
  return (
    <div className="legal-particles" aria-hidden="true">
      {pts.map((p) => (
        <span
          key={p.id}
          className="legal-particle"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
            animationDuration: p.dur,
          }}
        />
      ))}
    </div>
  );
}

export default function LegalPage({ sidebarCollapsed, type }) {
  return (
    <main
      className={`relative box-border min-h-[100dvh] max-w-[100vw] overflow-x-hidden bg-[#05040f] px-[clamp(16px,5vw,56px)] pt-[clamp(32px,5vw,60px)] pb-20 font-['Source_Sans_3',sans-serif] text-[#f0e8ff] transition-[width,margin-left] duration-[350ms] ease-[cubic-bezier(0.4,0,0.2,1)] w-[calc(100%_-_var(--sidebar-current-width,260px))] ml-[var(--sidebar-current-width,260px)] max-[768px]:w-full max-[768px]:ml-0 ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}
    >
      <Particles />
      <LegalDocumentView type={type} />
    </main>
  );
}
