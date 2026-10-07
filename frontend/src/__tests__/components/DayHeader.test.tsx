import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DayHeader } from '../../components/dashboard/DayHeader';

describe('DayHeader — vignette de date centrée', () => {
  it('appelle onOpenCalendar au clic sur la vignette de date', async () => {
    const onOpenCalendar = vi.fn();
    render(
      <DayHeader
        date="2026-06-22"
        streakCount={3}
        canGoForward={false}
        onPrev={vi.fn()}
        onNext={vi.fn()}
        onOpenCalendar={onOpenCalendar}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Changer de jour' }));

    expect(onOpenCalendar).toHaveBeenCalledTimes(1);
  });

  it('conserve les boutons jour précédent et jour suivant', async () => {
    const onPrev = vi.fn();
    const onNext = vi.fn();
    render(
      <DayHeader
        date="2026-06-22"
        streakCount={3}
        canGoForward
        onPrev={onPrev}
        onNext={onNext}
        onOpenCalendar={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'jour précédent' }));
    await userEvent.click(screen.getByRole('button', { name: 'jour suivant' }));

    expect(onPrev).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledTimes(1);
  });
});
