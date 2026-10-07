import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DateVignette } from '../../components/dashboard/DateVignette';

describe('DateVignette — vignette de date cliquable', () => {
  it('affiche le weekday et le jour pour la date donnée', () => {
    render(<DateVignette date="2026-06-22" onClick={vi.fn()} />);
    expect(screen.getByText('lundi')).toBeInTheDocument();
    expect(screen.getByText('22 juin')).toBeInTheDocument();
  });

  it('appelle onClick au clic et est accessible via un role button explicite', async () => {
    const onClick = vi.fn();
    render(<DateVignette date="2026-06-22" onClick={onClick} />);

    await userEvent.click(screen.getByRole('button', { name: 'Changer de jour' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
