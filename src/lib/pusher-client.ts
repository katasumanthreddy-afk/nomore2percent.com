'use client';

import PusherClient from 'pusher-js';

// BROWSER-ONLY — used by the chat widget component to listen for
// new messages in real-time without polling.
let pusherClientInstance: PusherClient | null = null;

export function getPusherClient() {
  if (!pusherClientInstance) {
    pusherClientInstance = new PusherClient(
      process.env.NEXT_PUBLIC_PUSHER_KEY!,
      { cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER! }
    );
  }
  return pusherClientInstance;
}
