import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ModeService } from '../../core/services/mode.service';
import { AuthService } from '../../core/services/auth.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent],
  template: `
    <header
      class="mode-header"
      [class.chat-open]="router.url.startsWith('/chats/') || router.url.startsWith('/team/chats/')"
    >
      <div class="header-inner">
        <a class="navbar-brand" [routerLink]="mode.home()" aria-label="Winx — главная"
          >winx<span>.</span></a
        >
        <select
          class="mode-select"
          aria-label="Режим"
          [ngModel]="mode.current()"
          (ngModelChange)="mode.switchTo($event)"
        >
          <option value="social">Знакомства</option>
          <option value="team">Тиммейты</option>
        </select>
        <nav class="navbar-links" aria-label="Основная навигация">
          <a
            *ngFor="let link of links"
            [routerLink]="link.path"
            [class.active]="isActive(link.path)"
            [attr.aria-current]="isActive(link.path) ? 'page' : null"
            class="nav-link"
          >
            <app-icon [name]="link.icon" [size]="21" /><span>{{ link.label }}</span>
          </a>
        </nav>
        <details class="account-menu" #accountMenu>
          <summary aria-label="Аккаунт" title="Аккаунт">
            <app-icon name="user" [size]="20" /><span class="account-label">Аккаунт</span>
          </summary>
          <div class="account-popover" role="group" aria-label="Меню аккаунта">
            <p>{{ auth.getEmail() || 'Мой аккаунт' }}</p>
            <a
              [routerLink]="mode.current() === 'team' ? '/team/profile' : '/profile'"
              (click)="closeAccount()"
              ><app-icon name="user" [size]="17" />Мой профиль</a
            >
            <button type="button" (click)="closeAccount(); auth.logout()">
              <app-icon name="logout" [size]="17" />Выйти
            </button>
          </div>
        </details>
      </div>
    </header>
  `,
  styleUrl: './navbar.component.css',
})
export class NavbarComponent {
  @ViewChild('accountMenu', { static: true }) accountMenu!: ElementRef<HTMLDetailsElement>;
  closeAccount(): void {
    this.accountMenu.nativeElement.open = false;
  }
  @HostListener('document:click', ['$event'])
  outside(event: MouseEvent): void {
    if (!this.accountMenu.nativeElement.contains(event.target as Node)) this.closeAccount();
  }
  @HostListener('document:keydown.escape')
  escape(): void {
    if (this.accountMenu.nativeElement.open) {
      this.closeAccount();
      this.accountMenu.nativeElement.querySelector('summary')?.focus();
    }
  }
  private socialLinks = [
    { path: '/discover', label: 'Люди', icon: 'search' },
    { path: '/chats', label: 'Общение', icon: 'chat' },
    { path: '/profile', label: 'Профиль', icon: 'user' },
  ];
  private teamLinks = [
    { path: '/team/discover', label: 'Поиск', icon: 'search' },
    { path: '/team/chats', label: 'Чаты', icon: 'chat' },
    { path: '/team/teams', label: 'Команда', icon: 'users' },
    { path: '/team/profile', label: 'Профиль', icon: 'user' },
  ];
  constructor(
    public mode: ModeService,
    public router: Router,
    public auth: AuthService,
  ) {}
  get links() {
    return this.mode.current() === 'team' ? this.teamLinks : this.socialLinks;
  }
  isActive(path: string): boolean {
    const url = this.router.url.split('?')[0];
    if (path === '/team/discover') return url === path;
    if (path === '/team/chats') return url === path || url.startsWith('/team/chats/');
    if (path === '/chats')
      return url.startsWith('/chats') || url === '/matches' || url === '/notifications';
    return url === path;
  }
}
