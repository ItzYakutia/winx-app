import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatchService, Match } from '../../core/services/match.service';
import { ChatService } from '../../core/services/chat.service';
import { IconComponent } from '../../shared/icon/icon.component';

@Component({
  selector: 'app-matches',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  templateUrl: './matches.component.html',
  styleUrl: './matches.component.css',
})
export class MatchesComponent implements OnInit {
  matches: Match[] = [];
  matchToChatId: Record<number, number> = {};
  loading = true;

  constructor(
    private matchService: MatchService,
    private chatService: ChatService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    forkJoin({
      matches: this.matchService.list(),
      chats: this.chatService.listChats(),
    }).subscribe({
      next: ({ matches, chats }) => {
        this.matches = matches.data ?? [];
        this.matchToChatId = {};
        for (const chat of chats.data ?? []) {
          this.matchToChatId[chat.match_id] = chat.id;
        }
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  getChatId(match: Match): number | null {
    return this.matchToChatId[match.id] ?? null;
  }

  openChat(match: Match): void {
    const chatId = this.getChatId(match);
    if (chatId) this.router.navigate(['/chats', chatId]);
  }

  unmatch(match: Match): void {
    if (!confirm(`Убрать совпадение с ${match.name || 'этим человеком'}?`)) return;
    this.matchService.delete(match.id).subscribe({
      next: () => {
        this.matches = this.matches.filter((m) => m.id !== match.id);
      },
    });
  }
}
