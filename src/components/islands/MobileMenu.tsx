import { useState } from 'react';

interface MobileMenuProps {
  appUrl: string;
  links: Array<{ href: string; label: string }>;
}

export default function MobileMenu({ appUrl, links }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
        aria-label="Toggle menu"
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full border-t border-[var(--color-void-light)]/50 bg-[var(--color-void-dark)]">
          <div className="px-6 py-4 space-y-4">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-neon-blue)] transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <a
              href={appUrl}
              className="block w-full text-center rounded-lg bg-gradient-to-r from-[var(--color-neon-blue)] to-[var(--color-neon-pink)] px-4 py-2 text-sm font-semibold text-[var(--color-void-black)]"
            >
              Launch Simulation
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
