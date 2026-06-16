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
    <main className={`legal-root ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Particles />
      <LegalDocumentView type={type} />
    </main>
  );
}
