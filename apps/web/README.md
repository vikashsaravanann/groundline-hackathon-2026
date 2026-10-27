# Groundline Web

The Groundline frontend is a Next.js App Router application built with TypeScript,
Tailwind CSS, and Poppins. It includes the public landing page and the consent-led
camera, upload, and AI review experience in Studio.

## Development

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Quality checks

```bash
npm run lint
npm test
npx tsc --noEmit
npm run build
```

The frontend uses `next/font` for its Poppins and JetBrains Mono fonts. Brand
source and exported identity assets are documented in [`docs/BRAND_IMPLEMENTATION.md`](../../docs/BRAND_IMPLEMENTATION.md).
