import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppVersion, formatAppVersion } from '../../components/ui/AppVersion';

describe('formatAppVersion', () => {
  it('assemble version, commit et date de build', () => {
    expect(formatAppVersion({ version: '0.1.0', commit: '14aaecb', buildDate: '2026-10-07' }))
      .toBe('Kaloriim v0.1.0 · 14aaecb · 07/10/2026');
  });

  it('omet le commit quand il est inconnu (build hors git)', () => {
    expect(formatAppVersion({ version: '0.1.0', commit: '', buildDate: '2026-10-07' }))
      .toBe('Kaloriim v0.1.0 · 07/10/2026');
  });
});

describe('AppVersion', () => {
  it('affiche la version injectee au build', () => {
    render(<AppVersion />);
    // Valeurs réelles injectées par vite.config (package.json, git, date du build).
    expect(screen.getByText(/^Kaloriim v\d+\.\d+\.\d+ · /)).toBeInTheDocument();
  });
});
