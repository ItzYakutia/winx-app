import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { authError } from '../../core/services/auth-feedback';
import { safeReturnUrl } from '../../core/services/auth-session';
import { ModeService } from '../../core/services/mode.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: '../../shared/auth.css',
})
export class RegisterComponent {
  email = '';
  password = '';
  consentAccepted = false;
  loading = false;
  error = '';
  success = false;
  readonly returnUrl: string | null;
  constructor(
    private auth: AuthService,
    private router: Router,
    private mode: ModeService,
    route: ActivatedRoute,
  ) {
    this.returnUrl = safeReturnUrl(route.snapshot.queryParamMap.get('returnUrl'));
  }
  submit(): void {
    if (this.loading) return;
    this.error = '';
    if (!this.consentAccepted) {
      this.error = 'Нужно согласие на обработку данных.';
      return;
    }
    this.loading = true;
    this.auth.register(this.email.trim(), this.password, this.consentAccepted).subscribe({
      next: () => {
        this.success = true;
        this.auth.login(this.email.trim(), this.password).subscribe({
          next: () =>
            void this.router.navigateByUrl(
              this.returnUrl || (this.mode.current() === 'team' ? '/team/profile' : '/profile'),
              { replaceUrl: true },
            ),
          error: () => {
            this.loading = false;
            this.error = 'Аккаунт создан. Войдите с указанной почтой и паролем.';
          },
        });
      },
      error: (error) => {
        this.error = authError(error, 'register');
        this.loading = false;
      },
    });
  }
}
