'use client';
import { ConvexProvider, ConvexReactClient } from "convex/react";

// Lazy singleton — avoids SSR crash when env var is absent during static generation
let convex: ConvexReactClient | null = null;
function getConvexClient(): ConvexReactClient | null {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) return null;
  if (!convex) convex = new ConvexReactClient(url);
  return convex;
}

export function ConvexClientProvider({ children }: { children: React.ReactNode }) {
  const client = getConvexClient();
  if (!client) return <>{children}</>;
  return <ConvexProvider client={client}>{children}</ConvexProvider>;
}
