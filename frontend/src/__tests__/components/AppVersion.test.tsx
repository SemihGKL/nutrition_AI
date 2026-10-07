import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppVersion, formatAppVersion } from '../../components/ui/AppVersion';

describe('formatAppVersion', () => {
  it('assemble version, signature et date de build', () => {
    expect(formatAppVersion({ version: '0.3.0', buildDate: '2026-10-07' }))
      .toBe('Kaloriim v0.3.0 · by GOKOL Semi · 07/10/2026');
  });
});

describe('AppVersion', () => {
  it('affiche la version injectee au build et la signature', () => {
    render(<AppVersion />);
    expect(screen.getByText(/^Kaloriim v\d+\.\d+\.\d+ · by GOKOL Semi · \d{2}\/\d{2}\/\d{4}$/)).toBeInTheDocument();
  });
});
