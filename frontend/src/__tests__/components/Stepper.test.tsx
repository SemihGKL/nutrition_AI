import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Stepper } from '../../components/ui/Stepper';

// Parent contrôlé, comme dans l'app : la valeur affichée vient du state du parent.
function Controlled({ initial, step = 50, max, onChange }: {
  initial: number; step?: number; max?: number; onChange?: (v: number) => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <Stepper label="Séance" value={value} step={step} max={max} onChange={v => { setValue(v); onChange?.(v); }} />
      <output data-testid="parent-value">{value}</output>
    </>
  );
}

const input = () => screen.getByRole('textbox') as HTMLInputElement;
const parentValue = () => screen.getByTestId('parent-value').textContent;

describe('Stepper — cas limites de saisie', () => {
  it('met a jour l\'affichage quand + est presse alors que le champ garde le focus (iOS)', () => {
    render(<Controlled initial={300} />);
    input().focus();
    // fireEvent.click ne déplace pas le focus : comme un tap sur iOS, le clavier reste ouvert.
    fireEvent.click(screen.getByRole('button', { name: 'augmenter' }));

    expect(parentValue()).toBe('350');
    expect(input().value).toBe('350');
  });

  it('met a jour l\'affichage quand - ramene a 0 alors que le champ garde le focus', () => {
    render(<Controlled initial={50} />);
    input().focus();
    fireEvent.click(screen.getByRole('button', { name: 'diminuer' }));

    expect(parentValue()).toBe('0');
    expect(input().value).toBe('0');
  });

  it('ne descend jamais sous 0 avec le bouton -', () => {
    render(<Controlled initial={0} />);
    fireEvent.click(screen.getByRole('button', { name: 'diminuer' }));

    expect(parentValue()).toBe('0');
    expect(input().value).toBe('0');
  });

  it('un champ vide compte immediatement comme 0 (total et anneau coherents pendant la saisie)', async () => {
    render(<Controlled initial={300} />);
    await userEvent.clear(input());

    expect(parentValue()).toBe('0');
    expect(input().value).toBe(''); // le champ reste vide pendant que l'utilisateur tape
  });

  it('vider puis retaper une valeur l\'applique', async () => {
    render(<Controlled initial={300} />);
    await userEvent.clear(input());
    await userEvent.type(input(), '450');

    expect(parentValue()).toBe('450');
    expect(input().value).toBe('450');
  });

  it('affiche 0 en quittant un champ laisse vide', async () => {
    render(<Controlled initial={300} />);
    await userEvent.clear(input());
    fireEvent.blur(input());

    expect(input().value).toBe('0');
    expect(parentValue()).toBe('0');
  });

  it('ne declenche pas onChange en quittant le champ sans modification', () => {
    const onChange = vi.fn();
    render(<Controlled initial={300} onChange={onChange} />);
    input().focus();
    fireEvent.blur(input());

    expect(onChange).not.toHaveBeenCalled();
  });

  it('ramene une saisie negative a 0', async () => {
    render(<Controlled initial={300} />);
    await userEvent.clear(input());
    await userEvent.type(input(), '-80');
    fireEvent.blur(input());

    expect(parentValue()).toBe('0');
    expect(input().value).toBe('0');
  });

  it('accepte la virgule comme separateur decimal (clavier francais)', async () => {
    render(<Controlled initial={70} step={0.1} />);
    await userEvent.clear(input());
    await userEvent.type(input(), '72,5');
    fireEvent.blur(input());

    expect(parentValue()).toBe('72.5');
    expect(input().value).toBe('72.5');
  });

  it('propose un clavier decimal quand le pas est fractionnaire', () => {
    render(<Controlled initial={70} step={0.1} />);
    expect(input()).toHaveAttribute('inputmode', 'decimal');
  });

  it('ne depasse pas le maximum avec le bouton +', () => {
    render(<Controlled initial={4980} max={5000} />);
    fireEvent.click(screen.getByRole('button', { name: 'augmenter' }));
    expect(parentValue()).toBe('5000');
    fireEvent.click(screen.getByRole('button', { name: 'augmenter' }));
    expect(parentValue()).toBe('5000');
  });

  it('ramene une saisie trop grande au maximum, des la frappe', async () => {
    render(<Controlled initial={0} max={5000} />);
    await userEvent.clear(input());
    await userEvent.type(input(), '25000');

    expect(parentValue()).toBe('5000');
    expect(input().value).toBe('5000');
  });
});
