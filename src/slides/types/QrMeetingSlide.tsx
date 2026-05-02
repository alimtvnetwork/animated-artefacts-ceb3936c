import { motion, useReducedMotion } from 'framer-motion';
import { MapPin, Mail, Phone, Globe, Calendar, ArrowUpRight, Linkedin, Github, Twitter, Facebook } from 'lucide-react';
import type { ReactNode } from 'react';
import type { SlideSpec, ContactRow, SocialLink } from '../types';
import { titleClassFor } from '../preset';
import { Capsule } from '../components/Capsule';
import { BrandedQR } from '../components/BrandedQR';
import { resolveMeeting } from '../meeting';

/**
 * Meeting / contact slide — branded QR + CTA copy.
 *
 * # Two layouts in one component
 * 1. **Compact (default)** — single rounded surface with the QR on the left
 *    and `eyebrow / title / subtitle / meetingLabel / capsules` stacked on
 *    the right. This is the original, kept for back-compat.
 * 2. **Contact (when `contactRows` is set)** — pixel-accurate to
 *    `spec/slides/12-contact-card.md`: warm-radial dark background, white QR
 *    card on the left, two-tone wordmark + amber underline + amber-tinted
 *    contact tiles + amber CTA + bare social icons on the right.
 *
 * The QR is rendered via the reusable `BrandedQR` component; bundled artwork
 * is never recolored.
 */
export function QrMeetingSlide({ spec }: { spec: SlideSpec }) {
  const c = spec.content;
  const hasContactLayout = Boolean(c.contactRows?.length || c.cta);
  return hasContactLayout ? <ContactLayout spec={spec} /> : <CompactLayout spec={spec} />;
}

/* ---------- Compact (original) layout ---------- */

function CompactLayout({ spec }: { spec: SlideSpec }) {
  const c = spec.content;
  const meeting = resolveMeeting(spec);
  return (
    <div className="flex h-full items-center justify-center px-16 pt-32 pb-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="grid md:grid-cols-[auto,1fr] gap-12 items-center bg-surface-1/80 backdrop-blur-xl border border-border rounded-3xl p-10 max-w-4xl shadow-[var(--shadow-elegant)]"
      >
        <BrandedQR
          asset={meeting.qrAsset}
          url={meeting.url}
          size={260}
          alt={meeting.label ?? 'Meeting QR code'}
        />
        <div>
          {c.eyebrow && <span className="slide-eyebrow mb-3 block">{c.eyebrow}</span>}
          {c.title && <h2 className={`slide-title-content mb-3 ${titleClassFor(spec)}`}>{c.title}</h2>}
          {c.subtitle && <p className="slide-subtitle mb-5">{c.subtitle}</p>}
          {meeting.label && (
            <div className="font-mono text-sm text-gold/90 bg-surface-2 border border-border px-4 py-2.5 rounded-lg inline-block mb-5">
              {meeting.label}
            </div>
          )}
          {c.capsules && (
            <div className="flex flex-wrap gap-2">
              {c.capsules.map((cap, i) => <Capsule key={i} spec={cap} />)}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* ---------- Contact card layout (matches spec/slides/12-contact-card.md) ---------- */

const ROW_ICON: Record<ContactRow['icon'], ReactNode> = {
  pin: <MapPin strokeWidth={2} className="h-[18px] w-[18px]" />,
  mail: <Mail strokeWidth={2} className="h-[18px] w-[18px]" />,
  phone: <Phone strokeWidth={2} className="h-[18px] w-[18px]" />,
  globe: <Globe strokeWidth={2} className="h-[18px] w-[18px]" />,
  calendar: <Calendar strokeWidth={2} className="h-[18px] w-[18px]" />,
};

const SOCIAL_ICON: Record<SocialLink['icon'], ReactNode> = {
  linkedin: <Linkedin strokeWidth={1.75} className="h-[22px] w-[22px]" />,
  mail:     <Mail     strokeWidth={1.75} className="h-[22px] w-[22px]" />,
  github:   <Github   strokeWidth={1.75} className="h-[22px] w-[22px]" />,
  twitter:  <Twitter  strokeWidth={1.75} className="h-[22px] w-[22px]" />,
  globe:    <Globe    strokeWidth={1.75} className="h-[22px] w-[22px]" />,
  // `facebook` was added in spec 19 — required member of the canonical
  // Riseup contact set. Same stroke + size to keep the row visually flush.
  facebook: <Facebook strokeWidth={1.75} className="h-[22px] w-[22px]" />,
};

/**
 * Split the title into two-tone wordmark halves. Per spec §5b: `Riseup` in
 * `--foreground`, `Asia` in `--primary`. We match the literal "Riseup" prefix
 * so the rule survives even when authors set `title: "RiseupAsia"` (the most
 * common form). Falls back to a single-tone title for any other string.
 */
function splitWordmark(title: string): { lead: string; accent: string } | null {
  const m = title.match(/^(Riseup)(.*)$/i);
  if (!m) return null;
  return { lead: m[1], accent: m[2] };
}

function ContactLayout({ spec }: { spec: SlideSpec }) {
  const c = spec.content;
  const meeting = resolveMeeting(spec);
  const rows = c.contactRows ?? [];
  const socials = c.socials ?? [];
  const wordmark = c.title ? splitWordmark(c.title) : null;
  const cta = c.cta;
  const qrStyle = c.qrStyle ?? 'riseup-finder';
  const reduced = useReducedMotion();

  return (
    <div
      className="relative flex h-full items-center justify-center pt-32 pb-20"
      style={{
        // Spec §1.1 — base #0F1115 with a subtle warm amber radial (~#2A200B)
        // centered behind the main content, plus a soft cool-gray midband to
        // lift the middle so the slide doesn't read as a flat black panel.
        // Layered top→bottom: warm core → wider warm halo → gray midtone →
        // base. Each radial uses an ellipse so the glow naturally follows the
        // 16:9 stage instead of leaving dark left/right corners.
        background: [
          'radial-gradient(ellipse 55% 60% at 50% 50%, hsla(var(--primary) / 0.18), transparent 70%)',
          'radial-gradient(ellipse 80% 80% at 50% 50%, hsla(var(--primary) / 0.10), transparent 75%)',
          'radial-gradient(ellipse 90% 90% at 50% 50%, hsla(var(--muted) / 0.35), transparent 80%)',
          'hsl(var(--background))',
        ].join(', '),
      }}
    >
      {/* v0.31 — Ken-Burns scale removed (user-rejected, mem://features/contact-card-v2).
          Entrance is now a calm fade + lift only: opacity 0→1, y 18→0 in
          0.7s expo-out. NO `scale` keyframes anywhere on this wrapper. */}
      <motion.div
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 18 }}
        animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
        transition={
          reduced
            ? { duration: 0.4, ease: 'easeOut' }
            : {
                opacity: { duration: 0.7, ease: [0.19, 1, 0.22, 1] },
                y:       { duration: 0.7, ease: [0.19, 1, 0.22, 1] },
              }
        }
        className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-8 lg:gap-10 items-start w-full max-w-[1200px] px-16"
      >
        {/* ---------- Left: QR card ----------
            v0.96 — pulled the QR column to the right edge of its grid cell
            (`lg:items-end`) and shrank the inter-column gap from 16/24 →
            8/10 so the QR sits visually closer to the contact text block.
            User feedback "QR a bit closer / a bit more right side". */}
        <div className="flex flex-col items-center lg:items-end">
          <div
            className="p-7 inline-block"
            style={{
              background: '#ffffff', // hardcoded-white-ok: QR code substrate MUST stay pure white for reliable scanner contrast — any theme tint breaks scanability
              borderRadius: 20,
              boxShadow:
                '0 20px 60px -20px hsla(var(--primary) / 0.20), 0 0 0 1px hsla(0 0% 0% / 0.06)',
            }}
          >
            {/* When `qrAsset` is set we always show the bundled artwork
                exactly as designed (e.g. /assets/brand/meeting-qr.png) — no
                canvas overlay. The riseup-finder style only kicks in when
                there's no asset and we're generating from a live URL. */}
            <BrandedQR
              asset={meeting.qrAsset}
              url={meeting.url}
              style={meeting.qrAsset ? 'clean' : qrStyle}
              wordmark="RiseupAsia"
              size={340}
              alt={meeting.label ?? c.title ?? 'Contact QR code'}
              className="!shadow-none !ring-0 !p-0 !rounded-none"
              
            />
          </div>
          <p
            className="mt-5 text-[14px] font-normal text-center"
            style={{ color: 'hsl(var(--muted-foreground))', width: 340 + 56 /* QR + p-7 padding */ }}
          >
            Scan to connect
          </p>
        </div>

        {/* ---------- Right: content stack ---------- */}
        <div className="min-w-0">
          {/* Eyebrow */}
          {c.eyebrow && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="block uppercase font-medium text-[13px]"
              style={{ letterSpacing: '0.2em', color: 'hsl(var(--muted-foreground))' }}
            >
              {c.eyebrow}
            </motion.span>
          )}

          {/* Headline + underline */}
          {c.title && (
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.18, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="relative inline-block mt-4"
            >
              <h2
                className="font-display font-bold leading-[1.05]"
                style={{
                  fontSize: 'clamp(40px, 4.4vw, 64px)',
                  letterSpacing: '-0.02em',
                  color: 'hsl(var(--foreground))',
                }}
              >
                {wordmark ? (
                  <>
                    <span>{wordmark.lead}</span>
                    <span style={{ color: 'hsl(var(--primary))' }}>{wordmark.accent}</span>
                  </>
                ) : (
                  <span className={titleClassFor(spec)}>{c.title}</span>
                )}
              </h2>
              {/* Spec §5b — short chunky accent bar, 80x3, radius 2, mt 12 */}
              <motion.div
                className="mt-3 rounded-[2px]"
                style={{ height: 3, width: 80, backgroundColor: 'hsl(var(--primary))' }}
                initial={{ scaleX: 0, transformOrigin: 'left' }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.42, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              />
            </motion.div>
          )}

          {/* Contact list — spec §5c. 20px row gap, 16px icon→text gap. */}
          <div className="mt-10 flex flex-col gap-5">
            {rows.map((row, i) => (
              <ContactListRow key={i} row={row} delay={0.55 + i * 0.08} />
            ))}

            {/* CTA inline if `cta.icon` is set; otherwise rendered below the list. */}
            {cta?.icon && (
              <CtaListRow
                cta={cta}
                icon={cta.icon}
                delay={0.55 + rows.length * 0.08}
              />
            )}
          </div>

          {/* Stand-alone CTA when `cta.icon` is NOT set. */}
          {cta && !cta.icon && (
            <motion.a
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 + rows.length * 0.08 + 0.05, duration: 0.4 }}
              href={cta.href}
              target={cta.href.startsWith('http') ? '_blank' : undefined}
              rel={cta.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="lift-hover mt-6 inline-flex items-center gap-2 font-semibold text-[15px]"
              style={{
                backgroundColor: 'hsl(var(--primary))',
                color: 'hsl(var(--primary-foreground))',
                padding: '12px 24px',
                borderRadius: 10,
                boxShadow: '0 8px 20px -8px hsla(var(--primary) / 0.5)',
                transition: 'filter 200ms ease, transform 200ms ease, box-shadow 200ms ease',
              }}
            >
              {cta.text}
              <ArrowUpRight className="h-[16px] w-[16px]" strokeWidth={2.25} />
            </motion.a>
          )}

          {/* Socials — spec §5e. Bare icons, 24px gap, 22px icon, hover → primary. */}
          {socials.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 + rows.length * 0.08 + 0.15, duration: 0.4 }}
              className="mt-8 flex items-center gap-6"
            >
              {socials.map((s, i) => (
                <a
                  key={i}
                  href={s.href}
                  aria-label={s.label ?? s.icon}
                  target={s.href.startsWith('http') ? '_blank' : undefined}
                  rel={s.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="transition-colors"
                  style={{ color: 'hsl(var(--muted-foreground))' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'hsl(var(--primary))')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'hsl(var(--muted-foreground))')}
                >
                  {SOCIAL_ICON[s.icon]}
                </a>
              ))}
            </motion.div>
          )}

          {c.capsules && (
            <div className="mt-6 flex flex-wrap gap-2">
              {c.capsules.map((cap, i) => <Capsule key={i} spec={cap} />)}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* ---------- Sub-components ---------- */

function ContactIconTile({ icon }: { icon: ContactRow['icon'] }) {
  // Spec §5c — 40x40, accent 10% bg, radius 10, icon 18px accent.
  return (
    <span
      className="flex shrink-0 items-center justify-center"
      style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: 'hsla(var(--primary) / 0.10)',
        color: 'hsl(var(--primary))',
      }}
    >
      {ROW_ICON[icon]}
    </span>
  );
}

function ContactListRow({ row, delay }: { row: ContactRow; delay: number }) {
  const Wrapper = row.href ? 'a' : 'div';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <Wrapper
        href={row.href}
        target={row.href?.startsWith('http') ? '_blank' : undefined}
        rel={row.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
        className={`flex items-center gap-4 ${row.href ? 'transition-colors' : ''}`}
        style={{ color: 'hsl(var(--foreground) / 0.75)' }}
        onMouseEnter={row.href ? (e => (e.currentTarget.style.color = 'hsl(var(--primary))')) : undefined}
        onMouseLeave={row.href ? (e => (e.currentTarget.style.color = 'hsl(var(--foreground) / 0.75)')) : undefined}
      >
        <ContactIconTile icon={row.icon} />
        <span className="text-[16px] font-normal leading-snug whitespace-pre-line">
          {row.text}
        </span>
      </Wrapper>
    </motion.div>
  );
}

function CtaListRow({
  cta,
  icon,
  delay,
}: {
  cta: NonNullable<SlideSpec['content']['cta']>;
  icon: ContactRow['icon'];
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="flex items-center gap-4"
    >
      <ContactIconTile icon={icon} />
      <a
        href={cta.href}
        target={cta.href.startsWith('http') ? '_blank' : undefined}
        rel={cta.href.startsWith('http') ? 'noopener noreferrer' : undefined}
        className="lift-hover inline-flex items-center gap-2 font-semibold text-[15px]"
        style={{
          backgroundColor: 'hsl(var(--primary))',
          color: 'hsl(var(--primary-foreground))',
          padding: '12px 24px',
          borderRadius: 10,
          boxShadow: '0 8px 20px -8px hsla(var(--primary) / 0.5)',
          transition: 'filter 200ms ease, transform 200ms ease, box-shadow 200ms ease',
        }}
      >
        {cta.text}
        <ArrowUpRight className="h-[16px] w-[16px]" strokeWidth={2.25} />
      </a>
    </motion.div>
  );
}
