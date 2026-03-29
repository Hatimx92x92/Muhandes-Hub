// =============================================================================
// Muhandes HUB — Typesense Client Configuration
// =============================================================================

import Typesense from 'typesense';
import type { Client } from 'typesense';

let client: Client | null = null;

export function getTypesenseClient(): Client | null {
  if (!process.env.TYPESENSE_HOST || !process.env.TYPESENSE_API_KEY) {
    return null;
  }

  if (!client) {
    client = new Typesense.Client({
      nodes: [
        {
          host: process.env.TYPESENSE_HOST,
          port: Number(process.env.TYPESENSE_PORT || '443'),
          protocol: process.env.TYPESENSE_PROTOCOL || 'https',
        },
      ],
      apiKey: process.env.TYPESENSE_API_KEY,
      connectionTimeoutSeconds: 5,
    });
  }

  return client;
}

/** Search-only client for browser (uses scoped search key) */
export function getTypesenseSearchClient(): Client | null {
  const host = process.env.NEXT_PUBLIC_TYPESENSE_HOST;
  const key = process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_KEY;

  if (!host || !key) return null;

  return new Typesense.Client({
    nodes: [
      {
        host,
        port: Number(process.env.NEXT_PUBLIC_TYPESENSE_PORT || '443'),
        protocol: process.env.NEXT_PUBLIC_TYPESENSE_PROTOCOL || 'https',
      },
    ],
    apiKey: key,
    connectionTimeoutSeconds: 5,
  });
}
