import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, Subscription } from 'rxjs';
import { ApiResponse } from './profile.service';
import { AuthService } from './auth.service';

export interface Chat {
  id: number;
  match_id: number;
  user_one_id: number;
  user_two_id: number;
  created_at: string;
}

export interface Message {
  id: number;
  chat_id: number;
  sender_id: number;
  content: string;
  created_at: string;
}

export interface WsMessage {
  id?: number;
  error?: string;
  type: string;
  chat_id?: number;
  content?: string;
  sender_id?: number;
  created_at?: string;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  readonly connected = signal(false);
  private ws: WebSocket | null = null;
  private messagesSubject = new Subject<WsMessage>();
  private tokenSub?: Subscription;
  private accessSub?: Subscription;
  private connectedToken: string | null = null;

  constructor(
    private http: HttpClient,
    private auth: AuthService,
  ) {}

  listChats(limit = 20, offset = 0) {
    return this.http.get<ApiResponse<Chat[]>>('/api/v1/chats', {
      params: { limit, offset },
    });
  }

  getMessages(chatId: number, limit = 50, offset = 0) {
    return this.http.get<ApiResponse<Message[]>>(`/api/v1/chats/${chatId}/messages`, {
      params: { limit, offset },
    });
  }

  connectWs(): Observable<WsMessage> {
    this.disconnectWs();
    this.messagesSubject = new Subject<WsMessage>();
    this.tokenSub = this.auth.tokenChanges$.subscribe((token) => {
      if (token) this.openSocket(token);
      else this.disconnectWs();
    });
    this.accessSub = this.auth.accessForRequest().subscribe({
      next: (token) => {
        if (token) this.openSocket(token);
      },
      error: () => {},
    });
    return this.messagesSubject.asObservable();
  }

  private openSocket(token: string): void {
    if (this.connectedToken === token && this.ws && this.ws.readyState <= WebSocket.OPEN) return;
    this.ws?.close();
    this.connectedToken = token;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws?token=${encodeURIComponent(token)}`;
    const socket = (this.ws = new WebSocket(wsUrl));
    this.connected.set(false);
    socket.onopen = () => {
      if (socket === this.ws) this.connected.set(true);
    };

    socket.onmessage = (event) => {
      if (socket !== this.ws) return;
      try {
        const raw = JSON.parse(event.data);
        const msg: WsMessage =
          raw.type === 'message' && raw.data ? { type: 'message', ...raw.data } : raw;
        this.messagesSubject.next(msg);
      } catch {}
    };

    // Keep subscribers when a rotated token replaces the old connection.
    socket.onclose = () => {
      if (socket === this.ws) {
        this.ws = null;
        this.connected.set(false);
      }
    };
  }

  sendMessage(chatId: number, content: string): boolean {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'message', chat_id: chatId, content }));
      return true;
    }
    return false;
  }

  disconnectWs(): void {
    this.tokenSub?.unsubscribe();
    this.accessSub?.unsubscribe();
    this.ws?.close();
    this.ws = null;
    this.connected.set(false);
    this.connectedToken = null;
    this.messagesSubject.complete();
  }
}
