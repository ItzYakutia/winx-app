import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { authError } from '../../core/services/auth-feedback';
import { safeReturnUrl } from '../../core/services/auth-session';
import { ProfileService } from '../../core/services/profile.service';
import { ModeService } from '../../core/services/mode.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: '../../shared/auth.css',
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;
  error = '';
  readonly returnUrl: string | null;
  readonly notice: string;
  constructor(
    private auth: AuthService,
    private router: Router,
    private profileService: ProfileService,
    private mode: ModeService,
    route: ActivatedRoute,
  ) {
    this.returnUrl = safeReturnUrl(route.snapshot.queryParamMap.get('returnUrl'));
    this.notice =
      route.snapshot.queryParamMap.get('reason') === 'expired'
        ? 'Сессия завершена. Войдите снова.'
        : route.snapshot.queryParamMap.get('reason') === 'signed-out'
          ? 'Вы вышли из аккаунта в другой вкладке.'
          : '';
  }
  submit(): void {
    if (this.loading) return;
    this.error = '';
    this.loading = true;
    this.auth.login(this.email.trim(), this.password).subscribe({
      next: () => this.redirect(),
      error: (error) => {
        this.error = authError(error, 'login');
        this.loading = false;
      },
    });
  }
  private redirect(): void {
    if (this.returnUrl) {
      void this.router.navigateByUrl(this.returnUrl, { replaceUrl: true });
      return;
    }
    if (this.mode.current() === 'team') {
      void this.router.navigateByUrl('/team/discover', { replaceUrl: true });
      return;
    }
    this.profileService.getMe().subscribe({
      next: (res) => {
        const p = res.data;
        const complete = p?.first_name && p?.birth_date && p?.gender && p?.interested_in?.length;
        void this.router.navigateByUrl(complete ? '/discover' : '/profile', { replaceUrl: true });
      },
      error: () => {
        if (this.auth.isLoggedIn())
          void this.router.navigateByUrl('/profile', { replaceUrl: true });
      },
    });
  }
}
