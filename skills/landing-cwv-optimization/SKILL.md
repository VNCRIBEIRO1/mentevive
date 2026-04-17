# Landing Core Web Vitals Optimization Skill — MenteVive Psicolobia

## Scope
Performance optimization for the multi-tenant landing page template (`mentevive-psicolobia`).
Stack: Next.js 16 + Tailwind CSS + Framer Motion + next/image + next/font/google.

---

## 1. Current Performance Profile

| Metric | Status | Risk | Root Cause |
|--------|--------|------|------------|
| **LCP** | ⚠️ Medium | Hero section with FloatingOrbs + staggered reveals | Complex animations blocking paint |
| **INP** | ⚠️ High | 10 client components with framer-motion (~50-70KB gzipped) | Heavy JS hydration |
| **CLS** | ✅ Good | All animations use transforms | GPU-accelerated, no layout shifts |
| **TTFB** | ✅ Good | Server components for above-fold structure | Minimal blocking |
| **Fonts** | ✅ Excellent | `display: swap` + latin subset | ~15KB per font, no FOIT |

---

## 2. Image Optimization

### 2.1 Current State
| Asset | Format | Optimized? | Action |
|-------|--------|-----------|--------|
| `pefilsobrre.jpeg` | JPEG | `priority` ✅ | Convert to WebP (save ~30-40%) |
| `bia.png` | PNG | lazy ✅ | Convert to WebP |
| `bia2.png` | PNG | lazy ✅ | Convert to WebP |
| `bia3.webp` | WebP | ✅ | Keep |
| `icon.svg` | SVG | ✅ | Keep |

### 2.2 Actions

#### Convert images to modern formats
```bash
# Install sharp CLI for bulk conversion
npx sharp-cli -i public/pefilsobrre.jpeg -o public/pefilsobrre.webp --webp
npx sharp-cli -i public/bia.png -o public/bia.webp --webp
npx sharp-cli -i public/bia2.png -o public/bia2.webp --webp
```

**No code changes needed** — `next.config.ts` already has:
```ts
images: { formats: ["image/avif", "image/webp"] }
```
Next.js Image component auto-serves WebP/AVIF when browser supports it. But having source files in WebP reduces the original payload sent to the optimizer.

#### Add explicit dimensions to all images
Ensure every `<Image>` tag has `width` and `height` to prevent CLS:
```tsx
<Image
  src="/pefilsobrre.webp"
  alt="Beatriz — Psicóloga Clínica"
  width={400}
  height={500}
  priority  // LCP candidate
/>
```

---

## 3. JavaScript Bundle Reduction (INP)

### 3.1 Framer Motion Tree-Shaking
Framer-motion v12 is large. Use selective imports:

```tsx
// ❌ Imports entire library
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";

// ✅ Tree-shakeable imports (framer-motion v12 supports this natively)
import { motion } from "framer-motion";           // Only core
import { AnimatePresence } from "framer-motion";   // Only when needed
```

#### Add to next.config.ts for optimized bundling:
```ts
// next.config.ts
const nextConfig = {
  // ...existing config
  experimental: {
    optimizePackageImports: ["framer-motion", "lucide-react"],
  },
};
```

### 3.2 Lazy Load Below-Fold Components
Currently 3 components are dynamically imported. **Extend to all below-fold heavy components:**

```tsx
// page.tsx — extend dynamic imports
const AnimatedSection = dynamic(
  () => import("@/app/components/landing/AnimatedSection"),
  { ssr: true }
);
const Contact = dynamic(
  () => import("@/app/components/landing/Contact"),
  { ssr: true, loading: () => <div className="py-20" /> }
);
const Blog = dynamic(
  () => import("@/app/components/landing/Blog"),
  { ssr: true, loading: () => <div className="py-20" /> }
);
const Testimonials = dynamic(
  () => import("@/app/components/landing/Testimonials"),
  { ssr: true }
);
```

### 3.3 Hero Optimization — Critical Path
Hero is the LCP section. Reduce its JS footprint:

1. **FloatingOrbs**: Already guarded with `useHydrated()` ✅
2. **Staggered reveal animations**: Consider CSS-only `@keyframes reveal` instead of framer-motion for initial view
3. **Defer non-visible Orb animations** until `IntersectionObserver` fires

```tsx
// Hero.tsx optimization — use CSS reveal for initial load
// Replace framer-motion fade-in with CSS `animate-reveal` class
<div className="animate-reveal" style={{ animationDelay: "0.1s" }}>
  <h1>...</h1>
</div>
```

---

## 4. CSS Animation Optimization

### 4.1 Current Animation Inventory
| Animation | Duration | Where Used | Impact |
|-----------|----------|-----------|--------|
| `liquid-float` | 8s infinite | FloatingOrbs (Hero) | Medium — GPU |
| `glow-pulse` | 3s infinite | Card hover effects | Low |
| `mesh-shift` | 15s infinite | SectionDivider SVGs | Low — SVG fill only |
| `shimmer` | 2s infinite | Button effects | Low |
| `float` | 4s infinite | Decorative elements | Low |
| `pulse-soft` | 3s infinite | Status badges | Low |
| `reveal` | 0.6s once | Entrance animations | ✅ One-shot |

### 4.2 Optimization: Pause Off-Screen Animations
Use `IntersectionObserver` to pause animations when not visible:

```css
/* Add to globals.css */
.anim-paused {
  animation-play-state: paused !important;
}
```

```tsx
// useAnimationVisibility.ts
import { useEffect, useRef, useState } from "react";

export function useAnimationVisibility<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}
```

### 4.3 Backdrop Filter Performance
`.glass` uses `backdrop-filter: blur(40px)` — expensive on mobile.

**Mitigation**:
```css
/* Reduce blur on mobile */
@media (max-width: 768px) {
  .glass { backdrop-filter: blur(16px) saturate(1.2); }
  .glass-strong { backdrop-filter: blur(20px) saturate(1.3); }
}
```

---

## 5. Hydration Safety

### 5.1 Components Needing Guard
| Component | Has `useHydrated`? | Risk |
|-----------|-------------------|------|
| FloatingOrbs | ✅ Yes | Safe |
| PortalShowcase | ✅ Yes | Safe |
| Header | ❌ No | Scroll listener fires pre-hydration |
| Blog | ❌ No | useState before hydration |
| Chatbot | ❌ No | Event listeners |

### 5.2 Fix: Guard Header Scroll Listener
```tsx
// Header.tsx
"use client";
import { useHydrated } from "@/lib/useHydrated";

export default function Header() {
  const hydrated = useHydrated();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [hydrated]);

  // ...
}
```

---

## 6. Font Optimization (Already Good)

Current setup is near-optimal:
```tsx
const fraunces = Fraunces({ subsets: ["latin"], display: "swap", variable: "--font-heading" });
const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-body" });
```

**Optional**: Reduce font weights to only those actually used:
```tsx
// Currently: weight: ["400", "500", "600", "700"]
// Check usage — if only 400+700 are used:
weight: ["400", "700"], // Save ~10KB
```

---

## 7. SEO & Structured Data (Already Good)

Current implementation includes:
- ✅ `ProfessionalService` Schema.org structured data
- ✅ `FAQPage` structured data
- ✅ Complete OpenGraph + Twitter Card metadata
- ✅ Canonical URL
- ✅ robots.ts + sitemap.ts

**Optional enhancement**: Add `LocalBusiness` schema variant for Google Maps integration.

---

## 8. Preload Critical Resources

### 8.1 Preload LCP Image
In `layout.tsx`, add preload hint:
```tsx
<head>
  <link
    rel="preload"
    as="image"
    href="/pefilsobrre.webp"
    type="image/webp"
  />
</head>
```

### 8.2 Preconnect to External Origins
If loading any external resources (analytics, fonts CDN):
```tsx
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="dns-prefetch" href="https://fonts.googleapis.com" />
```
**Note**: `next/font/google` already handles font preloading automatically.

---

## 9. Reduced Motion Support (Already Good)

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

✅ Respects user accessibility preference.

---

## 10. Measurement & Monitoring

### 10.1 Lighthouse CLI
```bash
npx lighthouse https://mentevive-psicolobia.vercel.app --output=json --output-path=./lighthouse.json
```

### 10.2 Web Vitals Reporting
Add to `layout.tsx`:
```tsx
import { useReportWebVitals } from "next/web-vitals";

export function reportWebVitals(metric) {
  // Send to analytics
  console.log(metric);
}
```

### 10.3 Bundle Analysis
```bash
ANALYZE=true npm run build
# Or use @next/bundle-analyzer
```

---

## 11. Checklist

### Quick Wins (< 30 min)
- [ ] Convert PNG/JPEG images to WebP
- [ ] Add `optimizePackageImports: ["framer-motion", "lucide-react"]` to next.config
- [ ] Add hydration guard to Header scroll listener
- [ ] Reduce backdrop-filter blur on mobile
- [ ] Preload LCP image in layout

### Medium Effort (1-2 hours)
- [ ] Extend dynamic imports to all below-fold heavy components
- [ ] Implement IntersectionObserver for animation pausing
- [ ] Replace Hero entrance animations with CSS-only `animate-reveal`
- [ ] Audit and reduce font weight variants

### Advanced (requires testing)
- [ ] Run Lighthouse audit and benchmark current scores
- [ ] Set up Web Vitals reporting
- [ ] Bundle analysis to identify framer-motion chunk size
- [ ] Consider replacing framer-motion with CSS animations for simple fades
