"use client";
import React from "react";
import Book from "./Book";


/* ------------------------------------------------------------------
 * LIGHT VERSION — design notes
 * ------------------------------------------------------------------
 * The previous version had three continuous, competing costs:
 *   1. A requestAnimationFrame loop writing --mx/--my every frame for
 *      mouse parallax — forces a style recalc across every element
 *      referencing those vars, 60x/sec, forever, whether or not the
 *      mouse is moving.
 *   2. Multiple large `filter: blur(60–80px)` layers animating
 *      opacity/transform simultaneously (3 glows + a rotating
 *      "nebula" wash) — blur is one of the most GPU-expensive filters
 *      to keep animating.
 *   3. Doodles animating `filter: drop-shadow(...)` on a loop —
 *      animating `filter` generally forces repaints rather than being
 *      handed to the compositor the way transform/opacity are.
 *
 * All three are removed here. There is no JS animation loop at all —
 * no mousemove listener, no rAF. Everything below fades in ONCE on
 * mount and then sits still: static gradients instead of animated
 * ones, static doodle opacity, no drop-shadow loops. This leaves
 * essentially zero ongoing main-thread/GPU cost to compete with the
 * book flip animation.
 *
 * If you want a little life back later, the cheapest thing to
 * re-add is a single opacity-only "breathe" on ONE glow (no blur
 * animation, no transform, no JS) — opacity is compositor-only and
 * close to free.
 * ------------------------------------------------------------------ */

type CustomStyle = React.CSSProperties & Record<string, string | number>;

const DEFAULT_PHOTOS = [
  { src: "/pipis/pipi1.jpg", top: "4%", left: "3%", size: 168, rotate: -16, radius: "2.5rem", delay: 0 },
  { src: "/pipis/pipi3.jpg", top: "9%", left: "78%", size: 190, rotate: 12, radius: "3rem", delay: 0.15 },
  { src: "/pipis/pipi5.jpg", top: "34%", left: "16%", size: 150, rotate: 9, radius: "50%", delay: 0.3 },
  { src: "/pipis/pipi7.jpg", top: "44%", left: "70%", size: 200, rotate: -11, radius: "3rem", delay: 0.1 },
  { src: "/pipis/pipi9.jpg", top: "70%", left: "9%", size: 188, rotate: 15, radius: "3.5rem", delay: 0.25 },
  { src: "/pipis/pipi11.jpg", top: "80%", left: "82%", size: 160, rotate: -19, radius: "50%", delay: 0.4 },
];

type PhotoFrameProps = {
  src: string;
  top: string;
  left: string;
  size: number;
  rotate: number;
  radius: string;
  delay: number;
};

function PhotoFrame({ src, top, left, size, rotate, radius, delay }: PhotoFrameProps) {
  return (
    <div
      className="db-photo"
      style={{
        top, left, width: size, height: size, borderRadius: radius,
        "--rot": `${rotate}deg`, "--delay": `${delay}s`,
      } as CustomStyle}
    >
      <img
        src={src}
        alt=""
        draggable={false}
        onError={(e) => {
          e.currentTarget.style.display = "none";
          e.currentTarget.parentElement?.classList.add("db-photo--fallback");
        }}
      />
      <div className="db-photo-sheen" />
    </div>
  );
}

const HeartDoodle = (props: React.JSX.IntrinsicAttributes & React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 100 90" {...props}>
    <path d="M50 82C22 62 6 44 6 26 6 12 17 3 30 3c9 0 17 5 20 13 3-8 11-13 20-13 13 0 24 9 24 23 0 18-16 36-44 56z"
      fill="none" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const FlowerDoodle = (props: React.JSX.IntrinsicAttributes & React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 100 100" {...props}>
    <g fill="none" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M50 50c0-16-8-28-4-40 8 6 14 20 12 34" />
      <path d="M50 50c14-6 22-18 34-18-2 10-12 22-26 26" />
      <path d="M50 50c8 14 6 28 14 38-10-2-22-14-24-28" />
      <path d="M50 50c-14 6-20 20-32 22 4-10 12-22 26-26" />
      <path d="M50 50c-8-12-4-26-12-36 10 2 20 12 22 26" />
      <circle cx="50" cy="50" r="6" />
    </g>
  </svg>
);
const StarDoodle = (props: React.JSX.IntrinsicAttributes & React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 100 100" {...props}>
    <path d="M50 8c3 16 8 26 14 32 12 3 22 8 28 10-10 4-20 9-28 12-6 10-11 22-14 30-3-8-8-20-14-30-8-3-18-8-28-12 10-2 20-7 28-10 6-6 11-16 14-32z"
      fill="none" strokeWidth="3" strokeLinejoin="round" />
  </svg>
);
const SwirlDoodle = (props: React.JSX.IntrinsicAttributes & React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 100 100" {...props}>
    <path d="M20 70c-10-14-4-34 16-38 22-4 34 14 28 30-5 13-22 18-30 8-6-8-2-20 8-22 8-2 14 6 10 12"
      fill="none" strokeWidth="3.5" strokeLinecap="round" />
  </svg>
);

const DOODLES = [
  { Comp: HeartDoodle, top: "7%", left: "30%", size: 128, rotate: -9, opacity: 0.14, delay: 0.1, color: "var(--db-blush)" },
  { Comp: FlowerDoodle, top: "20%", left: "58%", size: 108, rotate: 16, opacity: 0.13, delay: 0.2, color: "var(--db-moss)" },
  { Comp: StarDoodle, top: "48%", left: "40%", size: 96, rotate: 10, opacity: 0.16, delay: 0.3, color: "var(--db-gold)" },
  { Comp: HeartDoodle, top: "58%", left: "63%", size: 88, rotate: 22, opacity: 0.13, delay: 0.15, color: "var(--db-plum)" },
  { Comp: FlowerDoodle, top: "76%", left: "27%", size: 104, rotate: -14, opacity: 0.14, delay: 0.25, color: "var(--db-moss)" },
  { Comp: SwirlDoodle, top: "12%", left: "12%", size: 90, rotate: 6, opacity: 0.12, delay: 0.35, color: "var(--db-blush)" },
  { Comp: StarDoodle, top: "85%", left: "70%", size: 78, rotate: -20, opacity: 0.14, delay: 0.05, color: "var(--db-gold)" },
];

function DoodleBackground({ images = DEFAULT_PHOTOS }) {
  return (
    <div className="db-root" aria-hidden="true">
      <div className="db-vignette" />
      {/* one static ambient glow, opacity-only fade-in, no blur
          animation and no JS — effectively free once painted */}
      <div className="db-glow" />
      {images.map((p, i) => <PhotoFrame key={i} {...p} />)}
      {DOODLES.map(({ Comp, top, left, size, rotate, opacity, delay, color }, i) => (
        <div key={i} className="db-doodle" style={{
          top, left, width: size, height: size, color, opacity,
          "--rot": `${rotate}deg`, "--delay": `${delay}s`,
        } as CustomStyle}>
          <Comp />
        </div>
      ))}
    </div>
  );
}

/* ---------- demo page ---------- */

export default function DoodleBackgroundDemo() {
  return (
    <div className="db-page">
      <style>{`
        .db-page {
          position: relative;
          min-height: 640px;
          width: 100%;
          overflow: hidden;
          background: #14100E;
          font-family: 'Manrope', ui-sans-serif, system-ui, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;1,9..144,400&family=Manrope:wght@400;500;600&display=swap');

        .db-root {
          --db-ink: #14100E;
          --db-blush: #E8A99C;
          --db-moss: #9DBF87;
          --db-gold: #E3BD79;
          --db-plum: #D79AC2;
          position: absolute; inset: 0; overflow: hidden; pointer-events: none;
          /* static gradient does the "depth" job the animated nebula
             used to do, at zero ongoing cost */
          background: radial-gradient(120% 90% at 50% 0%, #211a17 0%, #14100e 55%, #0d0b0a 100%);
        }

        /* single static glow — pre-blurred at paint time, only
           animates opacity once on entrance, never re-blurred */
        .db-glow {
          position: absolute;
          top: -12%; left: 10%;
          width: 42vmax; height: 42vmax;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(232,169,156,0.18), transparent 65%);
          filter: blur(50px);
          opacity: 0;
          animation: db-glow-in 1.5s ease-out forwards;
        }

        .db-vignette {
          position: absolute; inset: 0;
          background: radial-gradient(120% 100% at 50% 50%, transparent 45%, rgba(0,0,0,0.55) 100%);
          pointer-events: none;
        }

        /* photos: fade + settle ONCE on mount, then static. No
           continuous transform, no parallax, no ongoing filter work. */
        .db-photo {
          position: absolute; overflow: hidden;
          box-shadow: 0 18px 40px -16px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05);
          filter: saturate(0.92) contrast(1.05) brightness(0.95);
          opacity: 0;
          transform: rotate(var(--rot)) scale(0.94);
          animation: db-fade-in 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          animation-delay: var(--delay);
        }
        .db-photo img { width: 100%; height: 100%; object-fit: cover; opacity: 0.78; display: block; }
        .db-photo-sheen {
          position: absolute; inset: 0;
          background: linear-gradient(155deg, rgba(255,255,255,0.10) 0%, transparent 30%, rgba(0,0,0,0.22) 100%);
          pointer-events: none;
        }
        .db-photo--fallback {
          background:
            radial-gradient(circle at 30% 20%, rgba(232,169,156,0.35), transparent 60%),
            radial-gradient(circle at 75% 80%, rgba(157,191,135,0.3), transparent 55%),
            #221b18;
          border: 1px solid rgba(255,255,255,0.08);
        }

        /* doodles: static opacity, fade in once, no drift, no
           drop-shadow pulse — those were the priciest bit before */
        .db-doodle {
          position: absolute;
          transform: rotate(var(--rot));
          opacity: 0;
          animation: db-fade-in 0.8s ease-out forwards;
          animation-delay: var(--delay);
        }
        .db-doodle svg { width: 100%; height: 100%; display: block; stroke: currentColor; }

        @keyframes db-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes db-glow-in {
          from { opacity: 0; }
          to { opacity: 0.7; }
        }
        @media (prefers-reduced-motion: reduce) {
          .db-photo, .db-doodle, .db-glow { animation: none; opacity: 1; }
        }

        .db-content {
          position: relative;
          z-index: 10;
          text-align: center;
          padding: 2rem;
        }
        .db-eyebrow {
          font-size: 0.72rem;
          letter-spacing: 0.32em;
          text-transform: uppercase;
          color: #E8A99C;
          margin-bottom: 1.1rem;
          font-weight: 600;
        }
        .db-title {
          font-family: 'Fraunces', serif;
          font-weight: 500;
          font-size: clamp(2.6rem, 6vw, 4.4rem);
          color: #F3ECE6;
          line-height: 1.05;
          margin: 0 0 1rem 0;
        }
        .db-title em {
          font-style: italic;
          font-weight: 300;
          color: #E8A99C;
        }
        .db-sub {
          font-size: 1rem;
          color: #B9ACA5;
          max-width: 420px;
          margin: 0 auto;
          line-height: 1.6;
        }
      `}</style>

      <DoodleBackground />
      

     <div className="flex  h-screen overflow-hidden flex-col flex-1 items-center justify-center bg-transparent font-sans ">
                                <Book/>  
                   </div>
    </div>
  );
}