/**
 * Lightweight form primitives shared across the builder. We avoid the
 * shadcn `Form` component (which is RHF-bound) because the builder is a
 * simple controlled form — every change feeds the live preview directly.
 */
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Trash2, Plus } from 'lucide-react';
import type { ReactNode } from 'react';

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground/70">{hint}</p>}
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <Input value={value ?? ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </Field>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  hint,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <Textarea value={value ?? ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} />
    </Field>
  );
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  hint,
}: {
  label: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (v: T) => void;
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <select
        value={value}
        onChange={e => onChange(e.target.value as T)}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </Field>
  );
}

/**
 * Generic repeater UI for arrays of structured items (keywords, capsules,
 * steps, contact rows, socials). Renders each item via a render-prop and
 * provides add/remove controls.
 */
export function Repeater<T>({
  label,
  items,
  onChange,
  newItem,
  renderItem,
  hint,
}: {
  label: string;
  items: T[];
  onChange: (next: T[]) => void;
  newItem: () => T;
  renderItem: (item: T, update: (next: T) => void, index: number) => ReactNode;
  hint?: string;
}) {
  const update = (i: number, next: T) => onChange(items.map((it, idx) => (idx === i ? next : it)));
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, newItem()]);

  return (
    <Field label={label} hint={hint}>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2 p-2 border border-border rounded-md bg-surface-1/40">
            <div className="flex-1 space-y-2">{renderItem(item, next => update(i, next), i)}</div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => remove(i)}
              aria-label={`Remove ${label} item ${i + 1}`}
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button type="button" size="sm" variant="outline" onClick={add} className="w-full">
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Add
        </Button>
      </div>
    </Field>
  );
}
