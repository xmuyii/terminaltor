import { ClientGameMessage, ServerGameMessage } from '../lib/gameProtocol';
import { LANGUAGE_WORDS } from './wordlists';

export type MessageHandler = (msg: ServerGameMessage) => void;
export const MAX_ROOM_CAPACITY = 16;

/**
 * Word scoring sequence:
 * 3 letters = 1 pt, 4 letters = 2 pts, 5 letters = 3 pts, 6 letters = 4 pts,
 * 7 letters = 5 pts, 8 letters = 6 pts, 9 letters = 8 pts, 10 letters = 10 pts,
 * 11 letters = 12 pts, 12 letters = 14 pts (and +2 pts per letter beyond 12)
 */
export function calculateWordPoints(len: number, hasMidroundBonus: boolean = false): number {
  let pts: number;
  if (len <= 2) pts = 0;
  else if (len === 3) pts = 1;
  else if (len === 4) pts = 2;
  else if (len === 5) pts = 3;
  else if (len === 6) pts = 4;
  else if (len === 7) pts = 5;
  else if (len === 8) pts = 6;
  else if (len === 9) pts = 8;
  else if (len === 10) pts = 10;
  else if (len === 11) pts = 12;
  else if (len === 12) pts = 14;
  else pts = 14 + (len - 12) * 2;

  if (hasMidroundBonus) {
    pts = Math.floor(pts * 1.5);
  }
  return pts;
}

export class ArcadeSocket {
  private handlers: MessageHandler[] = [];
  private ws: WebSocket | null = null;
  private roomCode: string;
  private mode: 'wordforge' | 'debugshunting';
  private username: string;

  constructor(roomCode: string, mode: 'wordforge' | 'debugshunting', username: string) {
    this.roomCode = roomCode;
    this.mode = mode;
    this.username = username;
  }

  connect(): void {
    // Try native WebSocket or fallback to local event loop
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/arcade/ws?room=${encodeURIComponent(this.roomCode)}&mode=${this.mode}&username=${encodeURIComponent(this.username)}`;

    try {
      this.ws = new WebSocket(wsUrl);
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit(data);
        } catch (e) {
          console.warn('Failed to parse incoming WS message:', e);
        }
      };
      this.ws.onerror = () => {
        // Fallback simulation
      };
    } catch {
      // Offline/local fallback
    }
  }

  send(msg: ClientGameMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  onMessage(handler: MessageHandler): () => void {
    this.handlers.push(handler);
    return () => {
      this.handlers = this.handlers.filter((h) => h !== handler);
    };
  }

  emit(msg: ServerGameMessage): void {
    this.handlers.forEach((h) => h(msg));
  }

  disconnect(): void {
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }
    this.handlers = [];
  }
}
