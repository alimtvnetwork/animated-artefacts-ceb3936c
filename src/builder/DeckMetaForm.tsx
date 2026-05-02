/**
 * Deck-meta form. Edits the draft deck's name, slug, presenter, theme, and
 * preset. Every field flows back into the draft store immediately so the
 * preview pane and slide list reflect changes live.
 */
import { useId } from 'react';
import type { DeckSpec } from '../slides/types';
import { THEMES, type ThemeId } from '../slides/themes';
import { TextField, SelectField, Field } from './FormPrimitives';

interface Props {
  deck: DeckSpec;
  onChange: (patch: Partial<DeckSpec>) => void;
}

const PRESET_OPTIONS = [
  { value: 'premium', label: 'Premium (Ubuntu Bold + clamp + auto colors)' },
] as const;

export function DeckMetaForm({ deck, onChange }: Props) {
  const slugId = useId();
  return (
    <section className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Deck name" value={deck.deckName} onChange={v => onChange({ deckName: v })} placeholder="Untitled Deck" />
        <Field label="Slug">
          <input
            id={slugId}
            value={deck.deckSlug}
            onChange={e => onChange({ deckSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
            placeholder="kebab-case-slug"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
          />
        </Field>
      </div>
      <TextField label="Presenter" value={deck.presenter} onChange={v => onChange({ presenter: v })} placeholder="Full name shown in the brand header" />
      <div className="grid grid-cols-2 gap-3">
        <SelectField
          label="Theme"
          value={(deck.theme ?? 'noir-gold') as ThemeId}
          options={Object.values(THEMES).map(t => ({ value: t.id, label: t.label }))}
          onChange={v => onChange({ theme: v })}
        />
        <SelectField
          label="Preset"
          value={deck.preset ?? 'premium'}
          options={PRESET_OPTIONS}
          onChange={v => onChange({ preset: v })}
          hint="Auto-applies to every slide added below."
        />
      </div>
    </section>
  );
}
