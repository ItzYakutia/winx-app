import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { Profile, ProfileService } from './profile.service';

export function needsOnboarding(profile: Profile | null): boolean {
  if (!profile) return true;
  if (profile.preferences?.['onboarding_complete'] === true) return false;
  if (profile.preferences?.['onboarding_step']) return true;
  // Existing filled-in profiles can keep using the app.
  return !profile.first_name?.trim() || !profile.location?.city?.trim();
}

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private completedSession: string | null = null;
  constructor(
    private profiles: ProfileService,
    private auth: AuthService,
  ) {}

  async profile(): Promise<Profile | null> {
    const session = this.auth.sessionId();
    try {
      const response = await firstValueFrom(this.profiles.getMe());
      this.auth.assertSession(session);
      return response.data;
    } catch (error) {
      this.auth.assertSession(session);
      if (error instanceof HttpErrorResponse && error.status === 404) return null;
      throw error;
    }
  }

  async required(): Promise<boolean> {
    const session = this.auth.sessionId();
    if (session && session === this.completedSession) return false;
    const required = needsOnboarding(await this.profile());
    this.auth.assertSession(session);
    if (!required) this.completedSession = session;
    return required;
  }

  complete(): void {
    this.completedSession = this.auth.sessionId();
  }
}
