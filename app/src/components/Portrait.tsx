/**
 * Illustrated portraits.
 *
 * Deliberately drawings rather than photographs. A photograph of a
 * real-looking person in a medical record is either a real person who
 * did not consent to appearing in one, or a synthetic face
 * indistinguishable from one. Neither belongs in a prototype that will
 * be shown around, and a face in a chart carries an implication the
 * demo does not need to make.
 *
 * These are deterministic: the same patient always gets the same face,
 * seeded from their id, with hair greying by age so the panel reads as
 * a plausible spread of people rather than a set of swatches.
 */
import type { Patient } from '../domain/types';
import { age as ageOf } from '../lib/format';

const SKIN = ['#f1d2bc', '#e5b894', '#c98f68', '#a26b45', '#7c4b2e', '#5d3720'];
const HAIR_SAFE = ['#2b2320', '#4a3527', '#7b5230', '#a8723c', '#9c9690', '#d8d2c8'];
const TOP = ['#3d6e8f', '#5c7a56', '#8a5a5a', '#5d5580', '#7a6a4a', '#46707a'];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function Portrait({ patient, size = 34 }: { patient: Patient; size?: number }) {
  const h = hash(patient.id);
  const age = ageOf(patient.dob);

  const skin = SKIN[h % SKIN.length];
  // hair greys with age, so the panel reads as a plausible spread
  const greyChance = age > 70 ? 0.75 : age > 58 ? 0.45 : age > 45 ? 0.18 : 0.02;
  const grey = ((h >> 3) % 100) / 100 < greyChance;
  const hair = grey
    ? HAIR_SAFE[4 + ((h >> 5) % 2)]
    : HAIR_SAFE[(h >> 5) % 4];
  const top = TOP[(h >> 7) % TOP.length];

  const style = (h >> 11) % 6;            // 0 short 1 cropped 2 long 3 bun 4 bald 5 curly
  const beard = patient.sex === 'male' && ((h >> 13) % 3 === 0);
  const stubble = patient.sex === 'male' && !beard && ((h >> 17) % 3 === 0);
  const glasses = (h >> 19) % 3 === 0;

  const id = `p-${patient.id}`;

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img"
      aria-label={`Illustration of ${patient.name}`}
      style={{ display: 'block', borderRadius: '50%', flex: 'none' }}>
      <defs>
        <clipPath id={id}><circle cx="32" cy="32" r="32" /></clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        <rect width="64" height="64" fill="var(--panel-2)" />

        {/* shoulders */}
        <path d="M6 64c0-13 11-20 26-20s26 7 26 20z" fill={top} />
        <path d="M26 46c3 4 9 4 12 0l-2-5H28z" fill={skin} />

        {/* long hair sits behind the head */}
        {style === 2 && <path d="M14 30c0-14 7-20 18-20s18 6 18 20v16c0 4-3 6-6 4V28H20v22c-3 2-6 0-6-4z" fill={hair} />}

        {/* neck + head */}
        <rect x="28" y="36" width="8" height="8" fill={skin} />
        <ellipse cx="32" cy="27" rx="13" ry="15" fill={skin} />

        {/* ears */}
        <circle cx="19" cy="28" r="2.6" fill={skin} />
        <circle cx="45" cy="28" r="2.6" fill={skin} />

        {/* hair styles */}
        {style === 0 && <path d="M19 26c0-9 6-14 13-14s13 5 13 14c-2-6-6-8-13-8s-11 2-13 8z" fill={hair} />}
        {style === 1 && <path d="M19.5 25c1-8 6-13 12.5-13s11.5 5 12.5 13c-3-4-7-6-12.5-6s-9.5 2-12.5 6z" fill={hair} />}
        {style === 2 && <path d="M19 26c0-10 6-15 13-15s13 5 13 15c-2-7-6-9-13-9s-11 2-13 9z" fill={hair} />}
        {style === 3 && (
          <>
            <circle cx="32" cy="9" r="5" fill={hair} />
            <path d="M19 26c0-10 6-15 13-15s13 5 13 15c-2-7-6-9-13-9s-11 2-13 9z" fill={hair} />
          </>
        )}
        {style === 4 && <path d="M20 24c2-6 6-9 12-9s10 3 12 9c-3-3-7-4-12-4s-9 1-12 4z" fill={hair} opacity=".75" />}
        {style === 5 && (
          <>
            <circle cx="22" cy="19" r="6" fill={hair} />
            <circle cx="32" cy="15" r="7" fill={hair} />
            <circle cx="42" cy="19" r="6" fill={hair} />
          </>
        )}

        {/* brows and eyes */}
        <rect x="24" y="24" width="6" height="1.5" rx=".7" fill={hair} opacity=".8" />
        <rect x="34" y="24" width="6" height="1.5" rx=".7" fill={hair} opacity=".8" />
        <circle cx="27" cy="28.5" r="1.7" fill="#2a2320" />
        <circle cx="37" cy="28.5" r="1.7" fill="#2a2320" />

        {/* nose and mouth */}
        <path d="M32 29v4h2" fill="none" stroke="#00000022" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M28.5 36.5c2 1.6 5 1.6 7 0" fill="none" stroke="#00000055"
          strokeWidth="1.4" strokeLinecap="round" />

        {stubble && <path d="M21 31c1 7 6 11 11 11s10-4 11-11c1 9-4 14-11 14s-12-5-11-14z" fill={hair} opacity=".22" />}
        {beard && (
          <path d="M20.5 30c1 8 6 13 11.5 13s10.5-5 11.5-13c1.5 11-4 16-11.5 16s-13-5-11.5-16z"
            fill={hair} opacity=".92" />
        )}
        {beard && <path d="M28.5 36.5c2 1.6 5 1.6 7 0" fill="none" stroke="#00000066" strokeWidth="1.4" strokeLinecap="round" />}

        {glasses && (
          <g fill="none" stroke="#3a3a3a" strokeWidth="1.3" opacity=".85">
            <circle cx="27" cy="28.5" r="4.6" />
            <circle cx="37" cy="28.5" r="4.6" />
            <path d="M31.6 28.5h.8M22.4 27.5l-2.6.8M41.6 27.5l2.6.8" strokeLinecap="round" />
          </g>
        )}
      </g>
      <circle cx="32" cy="32" r="31.4" fill="none" stroke="var(--line)" strokeWidth="1.2" />
    </svg>
  );
}
