import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ModeService } from '../../core/services/mode.service';

@Component({
  selector: 'app-navbar', standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <header class="mode-header" [class.team]="mode.current() === 'team'" [class.chat-open]="router.url.startsWith('/chats/')">
      <a class="navbar-brand" [routerLink]="mode.home()"><span aria-hidden="true">✦</span> Winx</a>
      <div class="mode-switch" role="group" aria-label="App mode">
        <button type="button" [class.selected]="mode.current() === 'social'" [attr.aria-pressed]="mode.current() === 'social'" (click)="mode.switchTo('social')">♡ Social</button>
        <button type="button" [class.selected]="mode.current() === 'team'" [attr.aria-pressed]="mode.current() === 'team'" (click)="mode.switchTo('team')">✦ Team Mode</button>
      </div>
      <nav class="navbar-links" aria-label="Main navigation">
        <a *ngFor="let link of links" [routerLink]="link.path" routerLinkActive="active" class="nav-link">
          <span class="nav-icon" aria-hidden="true">{{ link.icon }}</span><span class="nav-label">{{ link.label }}</span>
        </a>
        <button class="logout-btn" (click)="auth.logout()">Logout</button>
      </nav>
    </header>
  `,
  styleUrl: './navbar.component.css',
})
export class NavbarComponent {
  private socialLinks = [
    { path: '/discover', label: 'Explore', icon: '🔥' },
    { path: '/matches', label: 'Matches', icon: '💕' },
    { path: '/chats', label: 'Chats', icon: '💬' },
    { path: '/notifications', label: 'Notifs', icon: '🔔' },
    { path: '/profile', label: 'Profile', icon: '👤' },
  ];
  private teamLinks = [
    { path: '/team/discover', label: 'Find peers', icon: '⌕' },
    { path: '/team/shortlist', label: 'Saved', icon: '☆' },
    { path: '/team/teams', label: 'My team', icon: '♧' },
    { path: '/team/profile', label: 'Profile', icon: '▤' },
  ];
  constructor(public auth: AuthService, public mode: ModeService, public router: Router) {}
  get links() { return this.mode.current() === 'team' ? this.teamLinks : this.socialLinks; }
}
