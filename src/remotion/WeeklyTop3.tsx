/**
 * CARAXES — Remotion Template : Top 3 Fournisseurs de la Semaine
 *
 * Usage:
 *   npx remotion render src/remotion/index.tsx WeeklyTop3 out/top3.mp4
 *
 * Props (injectables via JSON):
 *   - weekLabel: string          → "Semaine du 28 avril"
 *   - category: string           → "Textile"
 *   - suppliers: Supplier[]      → [{name, product, price, rating, location}]
 */

import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from 'remotion';

/* ═══════════════════════════════════════════
   Design Tokens
   ═══════════════════════════════════════════ */

const C = {
  bg: '#1a1612',
  bgWarm: '#1e1a15',
  surface: '#2a2520',
  surfaceHover: '#332e28',
  red: '#D31336',
  gold: '#c9a84c',
  goldDim: '#a08338',
  emerald: '#4eca8b',
  text: '#f0ece6',
  textMid: '#b8b0a4',
  textDim: '#8a8278',
  border: 'rgba(60, 52, 42, 0.5)',
  black: '#0d0b09',
};

const F = {
  serif: "'Playfair Display', Georgia, serif",
  sans: "'DM Sans', system-ui, sans-serif",
  mono: "'JetBrains Mono', monospace",
};

/* ═══════════════════════════════════════════
   Interfaces
   ═══════════════════════════════════════════ */

interface Supplier {
  name: string;
  product: string;
  price: string;
  rating: number;
  location: string;
}

interface WeeklyTop3Props {
  weekLabel: string;
  category: string;
  suppliers: Supplier[];
}

/* ═══════════════════════════════════════════
   Star Rating Component
   ═══════════════════════════════════════════ */

const Stars: React.FC<{ rating: number; size: number }> = ({ rating, size }) => (
  <div style={{ display: 'flex', gap: 4 }}>
    {[1, 2, 3, 4, 5].map((i) => (
      <span
        key={i}
        style={{
          fontSize: size,
          color: i <= rating ? C.gold : C.textDim,
          filter: i <= rating ? `drop-shadow(0 0 4px ${C.gold}44)` : 'none',
        }}
      >
        ★
      </span>
    ))}
  </div>
);

/* ═══════════════════════════════════════════
   Supplier Card Component
   ═══════════════════════════════════════════ */

const SupplierCard: React.FC<{
  supplier: Supplier;
  rank: number;
  startFrame: number;
}> = ({ supplier, rank, startFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - startFrame;

  const slideIn = spring({
    frame: localFrame,
    fps,
    config: { damping: 15, stiffness: 80, mass: 1 },
  });

  const medalColors = ['#D31336', '#c9a84c', '#8a8278'];
  const medalLabels = ['#1', '#2', '#3'];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 32,
        padding: '28px 36px',
        background: C.surface,
        borderRadius: 16,
        border: `1px solid ${C.border}`,
        transform: `translateX(${(1 - slideIn) * 400}px)`,
        opacity: slideIn,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Rank badge */}
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 12,
          background: medalColors[rank] || C.textDim,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: F.serif,
          fontSize: 28,
          fontWeight: 900,
          color: C.text,
          flexShrink: 0,
          boxShadow: `0 4px 16px ${medalColors[rank]}44`,
        }}
      >
        {medalLabels[rank]}
      </div>

      {/* Info */}
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontFamily: F.serif,
            fontSize: 28,
            fontWeight: 700,
            color: C.text,
            marginBottom: 6,
          }}
        >
          {supplier.name}
        </div>
        <div
          style={{
            fontFamily: F.sans,
            fontSize: 18,
            color: C.textMid,
            marginBottom: 8,
          }}
        >
          {supplier.product}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Stars rating={supplier.rating} size={18} />
          <span
            style={{
              fontFamily: F.sans,
              fontSize: 14,
              color: C.textDim,
            }}
          >
            📍 {supplier.location}
          </span>
        </div>
      </div>

      {/* Price */}
      <div
        style={{
          fontFamily: F.mono,
          fontSize: 32,
          fontWeight: 700,
          color: C.emerald,
          flexShrink: 0,
        }}
      >
        {supplier.price}
      </div>

      {/* Subtle glow on top card */}
      {rank === 0 && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${C.red}, transparent)`,
          }}
        />
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════
   Main Composition
   ═══════════════════════════════════════════ */

export const WeeklyTop3: React.FC<WeeklyTop3Props> = ({
  weekLabel = 'Semaine du 28 avril',
  category = 'Textile',
  suppliers = defaultSuppliers,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ background: C.bg, overflow: 'hidden' }}>
      {/* Background texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.03,
          backgroundImage: `radial-gradient(circle at 30% 20%, ${C.red}22 0%, transparent 50%),
                            radial-gradient(circle at 70% 80%, ${C.gold}11 0%, transparent 50%)`,
        }}
      />

      {/* ═══ INTRO (0-30f) ═══ */}
      <Sequence from={0} durationInFrames={30}>
        <AbsoluteFill
          style={{
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {(() => {
            const scale = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });
            const fade = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' });
            return (
              <div style={{ textAlign: 'center', opacity: fade }}>
                <div
                  style={{
                    fontFamily: F.sans,
                    fontSize: 20,
                    color: C.gold,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    marginBottom: 16,
                  }}
                >
                  🐉 CARAXES — {weekLabel}
                </div>
                <div
                  style={{
                    fontFamily: F.serif,
                    fontSize: 56,
                    fontWeight: 900,
                    color: C.text,
                    transform: `scale(${scale})`,
                    lineHeight: 1.1,
                  }}
                >
                  Top 3 Fournisseurs
                </div>
                <div
                  style={{
                    fontFamily: F.serif,
                    fontSize: 48,
                    fontWeight: 400,
                    fontStyle: 'italic',
                    color: C.gold,
                    marginTop: 8,
                  }}
                >
                  {category}
                </div>
              </div>
            );
          })()}
        </AbsoluteFill>
      </Sequence>

      {/* ═══ SUPPLIER CARDS (30-300f, staggered) ═══ */}
      <Sequence from={30} durationInFrames={270}>
        <AbsoluteFill
          style={{
            justifyContent: 'center',
            padding: '60px 80px',
            gap: 20,
          }}
        >
          {/* Header */}
          {(() => {
            const localFrame = frame - 30;
            const headerFade = interpolate(localFrame, [0, 15], [0, 1], {
              extrapolateRight: 'clamp',
            });
            return (
              <div
                style={{
                  fontFamily: F.sans,
                  fontSize: 18,
                  color: C.textDim,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  marginBottom: 24,
                  opacity: headerFade,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: C.emerald,
                    display: 'inline-block',
                    boxShadow: `0 0 8px ${C.emerald}`,
                  }}
                />
                {category} — {weekLabel}
              </div>
            );
          })()}

          {/* Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {suppliers.slice(0, 3).map((supplier, i) => (
              <SupplierCard
                key={i}
                supplier={supplier}
                rank={i}
                startFrame={30 + i * 25}
              />
            ))}
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* ═══ CTA (300-345f) ═══ */}
      <Sequence from={300} durationInFrames={45}>
        <AbsoluteFill
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            background: `radial-gradient(ellipse at center, ${C.bgWarm}, ${C.black})`,
          }}
        >
          {(() => {
            const localFrame = frame - 300;
            const s = spring({
              frame: localFrame,
              fps,
              config: { damping: 10, stiffness: 100 },
            });
            return (
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontFamily: F.serif,
                    fontSize: 40,
                    fontWeight: 700,
                    color: C.text,
                    marginBottom: 24,
                    transform: `scale(${s})`,
                  }}
                >
                  Besoin d'un fournisseur ?
                </div>
                <div
                  style={{
                    display: 'inline-block',
                    padding: '18px 44px',
                    background: C.red,
                    color: C.text,
                    fontFamily: F.sans,
                    fontSize: 28,
                    fontWeight: 700,
                    borderRadius: 8,
                    transform: `scale(${s})`,
                    boxShadow: `0 8px 40px ${C.red}55`,
                  }}
                >
                  Premier comparatif gratuit
                </div>
                <div
                  style={{
                    marginTop: 20,
                    fontFamily: F.mono,
                    fontSize: 20,
                    color: C.gold,
                    opacity: interpolate(localFrame, [15, 25], [0, 1], {
                      extrapolateRight: 'clamp',
                    }),
                  }}
                >
                  caraxes.fr
                </div>
              </div>
            );
          })()}
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};

/* ═══════════════════════════════════════════
   Default Data
   ═══════════════════════════════════════════ */

const defaultSuppliers: Supplier[] = [
  {
    name: 'Shaoxing Yunhe Textile',
    product: 'Hijab mousseline premium — 180×70cm',
    price: '2,80€',
    rating: 5,
    location: 'Shaoxing',
  },
  {
    name: 'Hangzhou Silkroad Co.',
    product: 'Hijab satin de luxe — foulard carré 110cm',
    price: '3,50€',
    rating: 4,
    location: 'Hangzhou',
  },
  {
    name: 'Yiwu Eastern Trading',
    product: 'Hijab jersey stretch — lot de 12 couleurs',
    price: '1,90€',
    rating: 4,
    location: 'Yiwu',
  },
];

export const weeklyTop3DefaultProps: WeeklyTop3Props = {
  weekLabel: 'Semaine du 28 avril',
  category: 'Textile',
  suppliers: defaultSuppliers,
};
