/**
 * CARAXES — Remotion Template : Prix Alibaba vs Prix Négocié
 *
 * Usage:
 *   npx remotion render src/remotion/index.tsx PriceComparison out/price-comparison.mp4
 *
 * Props (injectables via JSON pour scaler):
 *   - productName: string       → "Hijab mousseline premium"
 *   - priceAlibaba: number      → 8.50
 *   - priceCaraxes: number      → 3.20
 *   - currency: string          → "€"
 *   - productEmoji: string      → "🧕"
 *   - ctaText: string           → "Premier devis gratuit"
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
   Design Tokens — CARAXES Cinematic Noir
   ═══════════════════════════════════════════ */

const COLORS = {
  bg: '#1a1612',
  bgWarm: '#1e1a15',
  surface: '#2a2520',
  red: '#D31336',
  redDeep: '#9e1030',
  gold: '#c9a84c',
  goldDim: '#a08338',
  text: '#f0ece6',
  textMid: '#b8b0a4',
  textDim: '#8a8278',
  black: '#0d0b09',
};

const FONTS = {
  serif: "'Playfair Display', Georgia, serif",
  sans: "'DM Sans', system-ui, sans-serif",
  mono: "'JetBrains Mono', monospace",
};

/* ═══════════════════════════════════════════
   Props Interface
   ═══════════════════════════════════════════ */

interface PriceComparisonProps {
  productName: string;
  priceAlibaba: number;
  priceCaraxes: number;
  currency?: string;
  productEmoji?: string;
  ctaText?: string;
}

/* ═══════════════════════════════════════════
   Animated Counter Component
   ═══════════════════════════════════════════ */

const AnimatedNumber: React.FC<{
  value: number;
  startFrame: number;
  duration: number;
  color: string;
  fontSize: number;
  currency: string;
}> = ({ value, startFrame, duration, color, fontSize, currency }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 30, stiffness: 80, mass: 1 },
  });

  const displayValue = interpolate(progress, [0, 1], [0, value]);

  const scale = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 12, stiffness: 200, mass: 0.5 },
  });

  return (
    <div
      style={{
        fontSize,
        fontFamily: FONTS.mono,
        fontWeight: 700,
        color,
        transform: `scale(${scale})`,
        letterSpacing: '-0.02em',
      }}
    >
      {displayValue.toFixed(2)}{currency}
    </div>
  );
};

/* ═══════════════════════════════════════════
   Savings Badge Component
   ═══════════════════════════════════════════ */

const SavingsBadge: React.FC<{
  savings: number;
  startFrame: number;
}> = ({ savings, startFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 10, stiffness: 150, mass: 0.8 },
  });

  const pulse = Math.sin((frame - startFrame) * 0.1) * 0.03 + 1;

  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${COLORS.red}, ${COLORS.redDeep})`,
        color: COLORS.text,
        padding: '16px 40px',
        borderRadius: 12,
        fontFamily: FONTS.sans,
        fontWeight: 700,
        fontSize: 42,
        transform: `scale(${enter * pulse})`,
        opacity: enter,
        boxShadow: `0 8px 32px ${COLORS.red}44`,
        letterSpacing: '0.02em',
      }}
    >
      -{savings.toFixed(0)}% vs Alibaba
    </div>
  );
};

/* ═══════════════════════════════════════════
   Gold Divider Component
   ═══════════════════════════════════════════ */

const GoldDivider: React.FC<{ width: number; startFrame: number }> = ({
  width,
  startFrame,
}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(
    frame - startFrame,
    [0, 20],
    [0, 1],
    { extrapolateRight: 'clamp' }
  );

  return (
    <div
      style={{
        width: width * progress,
        height: 2,
        background: `linear-gradient(90deg, transparent, ${COLORS.gold}, transparent)`,
        margin: '0 auto',
      }}
    />
  );
};

/* ═══════════════════════════════════════════
   Main Composition
   ═══════════════════════════════════════════ */

export const PriceComparison: React.FC<PriceComparisonProps> = ({
  productName = 'Hijab mousseline premium',
  priceAlibaba = 8.50,
  priceCaraxes = 3.20,
  currency = '€',
  productEmoji = '🧕',
  ctaText = 'Premier devis gratuit',
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const savings = ((priceAlibaba - priceCaraxes) / priceAlibaba) * 100;

  /* ── Background grain texture ── */
  const grainOpacity = 0.04 + Math.sin(frame * 0.3) * 0.01;

  return (
    <AbsoluteFill
      style={{
        background: COLORS.bg,
        overflow: 'hidden',
      }}
    >
      {/* Subtle animated grain overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: grainOpacity,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '128px 128px',
          transform: `translate(${(frame % 30) * 2}px, ${(frame % 20) * 2}px)`,
        }}
      />

      {/* ═══ SEQUENCE 1 : Logo Intro (0-30 frames / 0-1s) ═══ */}
      <Sequence from={0} durationInFrames={30}>
        <AbsoluteFill
          style={{
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {(() => {
            const logoScale = spring({
              frame,
              fps,
              config: { damping: 12, stiffness: 100, mass: 0.8 },
            });
            const logoOpacity = interpolate(frame, [0, 8], [0, 1], {
              extrapolateRight: 'clamp',
            });
            return (
              <>
                {/* Diamond logo */}
                <div
                  style={{
                    width: 80,
                    height: 80,
                    background: COLORS.red,
                    transform: `rotate(45deg) scale(${logoScale})`,
                    opacity: logoOpacity,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 8,
                    boxShadow: `0 0 60px ${COLORS.red}66`,
                  }}
                >
                  <span
                    style={{
                      transform: 'rotate(-45deg)',
                      fontFamily: FONTS.serif,
                      fontSize: 36,
                      fontWeight: 900,
                      color: COLORS.text,
                    }}
                  >
                    C
                  </span>
                </div>
                {/* Logo text */}
                <div
                  style={{
                    marginTop: 20,
                    fontFamily: FONTS.serif,
                    fontSize: 28,
                    fontWeight: 600,
                    color: COLORS.gold,
                    letterSpacing: '0.2em',
                    opacity: interpolate(frame, [10, 20], [0, 1], {
                      extrapolateRight: 'clamp',
                    }),
                  }}
                >
                  CARAXES
                </div>
              </>
            );
          })()}
        </AbsoluteFill>
      </Sequence>

      {/* ═══ SEQUENCE 2 : Product + Prix Alibaba (30-90 frames / 1-3s) ═══ */}
      <Sequence from={30} durationInFrames={60}>
        <AbsoluteFill
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            padding: 60,
          }}
        >
          {(() => {
            const localFrame = frame - 30;

            const emojiScale = spring({
              frame: localFrame,
              fps,
              config: { damping: 10, stiffness: 120, mass: 1 },
            });

            const textSlide = spring({
              frame: localFrame - 5,
              fps,
              config: { damping: 20, stiffness: 100 },
            });

            const priceAppear = spring({
              frame: localFrame - 15,
              fps,
              config: { damping: 15, stiffness: 80 },
            });

            return (
              <div style={{ textAlign: 'center' }}>
                {/* Product emoji */}
                <div
                  style={{
                    fontSize: 100,
                    transform: `scale(${emojiScale})`,
                    marginBottom: 24,
                  }}
                >
                  {productEmoji}
                </div>

                {/* Product name */}
                <div
                  style={{
                    fontFamily: FONTS.serif,
                    fontSize: 40,
                    fontWeight: 700,
                    color: COLORS.text,
                    opacity: textSlide,
                    transform: `translateY(${(1 - textSlide) * 30}px)`,
                    marginBottom: 12,
                  }}
                >
                  {productName}
                </div>

                <GoldDivider width={200} startFrame={10} />

                {/* Alibaba label */}
                <div
                  style={{
                    marginTop: 32,
                    fontFamily: FONTS.sans,
                    fontSize: 22,
                    fontWeight: 500,
                    color: COLORS.textDim,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    opacity: priceAppear,
                  }}
                >
                  Prix Alibaba
                </div>

                {/* Alibaba price */}
                <div style={{ opacity: priceAppear }}>
                  <AnimatedNumber
                    value={priceAlibaba}
                    startFrame={45}
                    duration={30}
                    color={COLORS.textMid}
                    fontSize={72}
                    currency={currency}
                  />
                </div>

                {/* Per unit */}
                <div
                  style={{
                    fontFamily: FONTS.sans,
                    fontSize: 18,
                    color: COLORS.textDim,
                    opacity: priceAppear,
                    marginTop: 4,
                  }}
                >
                  par unit&eacute;
                </div>
              </div>
            );
          })()}
        </AbsoluteFill>
      </Sequence>

      {/* ═══ SEQUENCE 3 : Prix CARAXES Reveal (90-150 frames / 3-5s) ═══ */}
      <Sequence from={90} durationInFrames={60}>
        <AbsoluteFill
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            padding: 60,
          }}
        >
          {(() => {
            const localFrame = frame - 90;

            const wipeProgress = interpolate(localFrame, [0, 15], [0, 1], {
              extrapolateRight: 'clamp',
              easing: Easing.out(Easing.cubic),
            });

            const caraxesAppear = spring({
              frame: localFrame - 15,
              fps,
              config: { damping: 12, stiffness: 100, mass: 0.8 },
            });

            return (
              <div style={{ textAlign: 'center', width: '100%' }}>
                {/* VS Split */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 60,
                    marginBottom: 40,
                  }}
                >
                  {/* Alibaba side (faded) */}
                  <div
                    style={{
                      textAlign: 'center',
                      opacity: 0.5,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: FONTS.sans,
                        fontSize: 18,
                        color: COLORS.textDim,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        marginBottom: 8,
                      }}
                    >
                      Alibaba
                    </div>
                    <div
                      style={{
                        fontFamily: FONTS.mono,
                        fontSize: 52,
                        fontWeight: 700,
                        color: COLORS.textDim,
                        textDecoration: 'line-through',
                        textDecorationColor: COLORS.red,
                        textDecorationThickness: 3,
                      }}
                    >
                      {priceAlibaba.toFixed(2)}{currency}
                    </div>
                  </div>

                  {/* VS badge */}
                  <div
                    style={{
                      fontFamily: FONTS.serif,
                      fontSize: 32,
                      fontWeight: 900,
                      color: COLORS.gold,
                      opacity: wipeProgress,
                    }}
                  >
                    VS
                  </div>

                  {/* CARAXES side */}
                  <div
                    style={{
                      textAlign: 'center',
                      opacity: caraxesAppear,
                      transform: `translateY(${(1 - caraxesAppear) * 40}px)`,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: FONTS.sans,
                        fontSize: 18,
                        color: COLORS.gold,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        marginBottom: 8,
                        fontWeight: 700,
                      }}
                    >
                      CARAXES
                    </div>
                    <AnimatedNumber
                      value={priceCaraxes}
                      startFrame={105}
                      duration={30}
                      color={COLORS.text}
                      fontSize={64}
                      currency={currency}
                    />
                  </div>
                </div>

                {/* Gold line */}
                <GoldDivider width={500} startFrame={20} />

                {/* Savings badge */}
                <div style={{ marginTop: 32 }}>
                  <SavingsBadge savings={savings} startFrame={130} />
                </div>
              </div>
            );
          })()}
        </AbsoluteFill>
      </Sequence>

      {/* ═══ SEQUENCE 4 : CTA Final (150-180 frames / 5-6s) ═══ */}
      <Sequence from={150} durationInFrames={30}>
        <AbsoluteFill
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            background: `radial-gradient(ellipse at center, ${COLORS.bgWarm}, ${COLORS.black})`,
          }}
        >
          {(() => {
            const localFrame = frame - 150;

            const ctaScale = spring({
              frame: localFrame,
              fps,
              config: { damping: 10, stiffness: 100, mass: 0.8 },
            });

            const urlFade = interpolate(localFrame, [10, 20], [0, 1], {
              extrapolateRight: 'clamp',
            });

            return (
              <div style={{ textAlign: 'center' }}>
                {/* CTA Button */}
                <div
                  style={{
                    display: 'inline-block',
                    padding: '20px 48px',
                    background: COLORS.red,
                    color: COLORS.text,
                    fontFamily: FONTS.sans,
                    fontSize: 32,
                    fontWeight: 700,
                    borderRadius: 8,
                    transform: `scale(${ctaScale})`,
                    boxShadow: `0 8px 40px ${COLORS.red}55`,
                    letterSpacing: '0.02em',
                  }}
                >
                  {ctaText}
                </div>

                {/* URL */}
                <div
                  style={{
                    marginTop: 24,
                    fontFamily: FONTS.mono,
                    fontSize: 22,
                    color: COLORS.gold,
                    opacity: urlFade,
                    letterSpacing: '0.05em',
                  }}
                >
                  caraxes.fr
                </div>

                {/* Tagline */}
                <div
                  style={{
                    marginTop: 12,
                    fontFamily: FONTS.sans,
                    fontSize: 16,
                    color: COLORS.textDim,
                    opacity: urlFade,
                  }}
                >
                  Votre homme de confiance en Chine
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
   Default Props (for preview / CLI render)
   ═══════════════════════════════════════════ */

export const priceComparisonDefaultProps: PriceComparisonProps = {
  productName: 'Hijab mousseline premium',
  priceAlibaba: 8.50,
  priceCaraxes: 3.20,
  currency: '€',
  productEmoji: '🧕',
  ctaText: 'Premier devis gratuit',
};
