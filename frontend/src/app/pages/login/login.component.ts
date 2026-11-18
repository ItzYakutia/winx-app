import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';
import { ModeService } from '../../core/services/mode.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;
  error = '';

  constructor(private auth: AuthService, private router: Router, private profileService: ProfileService, private mode: ModeService) {}

  submit(): void {
    this.error = '';
    this.loading = true;
    this.auth.login(this.email, this.password).subscribe({
      next: () => this.checkProfileAndRedirect(),
      error: (err) => {
        this.error = err?.error?.message || 'Invalid email or password';
        this.loading = false;
      },
    });
  }

  private checkProfileAndRedirect(): void {
    if (this.mode.current() === 'team') {
      this.router.navigate(['/team/discover']);
      return;
    }
    this.profileService.getMe().subscribe({
      next: (res) => {
        const p = res.data;
        const complete = p?.first_name && p?.birth_date && p?.gender && p?.interested_in?.length;
        this.router.navigate([complete ? '/discover' : '/profile']);
      },
      error: () => this.router.navigate(['/profile']),
    });
  }
}
