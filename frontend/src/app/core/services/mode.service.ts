import { Injectable, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';

export type AppMode = 'social' | 'team';

@Injectable({ providedIn: 'root' })
export class ModeService {
  readonly current = signal<AppMode>(
    localStorage.getItem('winx_mode') === 'team' ? 'team' : 'social',
  );
  private lastPath: Record<AppMode, string> = {
    social: this.savedPath(
      'social',
      /^\/(discover|matches|chats(?:\/\d+)?|notifications|profile)(?:\?.*)?$/,
      '/discover',
    ),
    team: this.savedPath(
      'team',
      /^\/team\/(discover|shortlist|chats(?:\/\d+)?|teams|profile)(?:\?.*)?$/,
      '/team/discover',
    ),
  };

  constructor(private router: Router) {
    this.router.events.subscribe((event) => {
      if (!(event instanceof NavigationEnd)) return;
      const path = event.urlAfterRedirects;
      if (path === '/' || /^\/(login|register)([/?#]|$)/.test(path)) return;
      const mode: AppMode = path.startsWith('/team/') ? 'team' : 'social';
      this.lastPath[mode] = path;
      localStorage.setItem(`winx_${mode}_path`, path);
      this.current.set(mode);
      localStorage.setItem('winx_mode', mode);
    });
  }

  private savedPath(mode: AppMode, pattern: RegExp, fallback: string): string {
    const saved = localStorage.getItem(`winx_${mode}_path`) ?? '';
    return pattern.test(saved) ? saved : fallback;
  }

  home(): string {
    return this.current() === 'team' ? '/team/discover' : '/discover';
  }

  switchTo(mode: AppMode): void {
    if (this.current() === mode) return;
    void this.router.navigateByUrl(this.lastPath[mode]);
  }
}
