import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, forkJoin } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { Profile, ProfileService, Interest } from '../../core/services/profile.service';
import { OnboardingService, needsOnboarding } from '../../core/services/onboarding.service';
import { AcademicService, Course, academicError } from '../../core/services/academic.service';
import { AppMode, ModeService } from '../../core/services/mode.service';
import { safeReturnUrl } from '../../core/services/auth-session';
import { IconComponent } from '../../shared/icon/icon.component';
import { courseName } from '../../shared/text';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.css',
})
export class OnboardingComponent implements OnInit {
  @ViewChild('stepTitle') stepTitle?: ElementRef<HTMLHeadingElement>;
  step = 1;
  loading = true;
  loadFailed = false;
  optionsReady = false;
  busy = false;
  error = '';
  profile: Profile = {};
  name = '';
  city = '';
  selectedMode: AppMode = 'team';
  courses: Course[] = [];
  courseIds: number[] = [];
  skillsText = '';
  role = '';
  interests: Interest[] = [];
  interestIds: number[] = [];
  interestedIn = 'everyone';
  about = '';
  birthDate = '';
  gender = '';
  readonly today = new Date().toLocaleDateString('en-CA');
  label = courseName;
  readonly returnUrl: string | null;

  constructor(
    public auth: AuthService,
    private profiles: ProfileService,
    private onboarding: OnboardingService,
    private academic: AcademicService,
    private modes: ModeService,
    private router: Router,
    route: ActivatedRoute,
  ) {
    this.returnUrl = safeReturnUrl(route.snapshot.queryParamMap.get('returnUrl'));
  }

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    this.loading = true;
    this.loadFailed = false;
    this.error = '';
    try {
      this.profile = (await this.onboarding.profile()) || {};
      if (!needsOnboarding(this.profile)) {
        void this.router.navigateByUrl(this.returnUrl || this.modes.home(), {
          replaceUrl: true,
        });
        return;
      }
      this.name = this.profile.first_name || '';
      this.city = this.profile.location?.city || '';
      this.selectedMode =
        this.profile.preferences?.['onboarding_mode'] === 'social' ? 'social' : 'team';
      this.step = Math.min(
        3,
        Math.max(1, Number(this.profile.preferences?.['onboarding_step']) || 1),
      );
      this.about = this.profile.about_me || '';
      this.birthDate = this.profile.birth_date || '';
      this.gender = this.profile.gender || '';
      this.interestIds = this.profile.interest_ids || [];
      this.interestedIn = this.profile.interested_in?.[0] || 'everyone';
      if (this.step === 3) await this.loadOptions();
    } catch (error) {
      this.loadFailed = true;
      this.error = academicError(error);
    } finally {
      this.loading = false;
    }
  }

  get socialReady(): boolean {
    return (
      !!this.gender &&
      this.birthDate.length === 10 &&
      Number.isFinite(Date.parse(this.birthDate)) &&
      this.birthDate >= '1900-01-01' &&
      this.birthDate <= this.today
    );
  }

  get skills(): string[] {
    return [
      ...new Set(
        this.skillsText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      ),
    ];
  }

  get skillsError(): string {
    if (this.skills.length > 20) return 'Добавьте до 20 навыков.';
    return this.skills.some((s) => [...s].length > 30) ? 'Название навыка — до 30 символов.' : '';
  }

  toggleCourse(id: number): void {
    this.courseIds = this.courseIds.includes(id)
      ? this.courseIds.filter((v) => v !== id)
      : [...this.courseIds, id];
  }
  toggleInterest(id: number): void {
    if (this.interestIds.includes(id)) this.interestIds = this.interestIds.filter((v) => v !== id);
    else if (this.interestIds.length < 20) this.interestIds = [...this.interestIds, id];
  }

  private async loadOptions(): Promise<void> {
    this.optionsReady = false;
    if (this.selectedMode === 'team') {
      const result = await firstValueFrom(
        forkJoin({
          courses: this.academic.courses(),
          selected: this.academic.myCourses(),
          profile: this.academic.profile(),
        }),
      );
      this.courses = result.courses.data || [];
      this.courseIds = (result.selected.data || []).map((c) => c.id);
      this.skillsText = (result.profile.data?.skills || []).join(', ');
      this.role = result.profile.data?.preferred_role || '';
    } else {
      this.interests = (await firstValueFrom(this.profiles.getInterests())).data || [];
    }
    this.optionsReady = true;
  }

  async advance(): Promise<void> {
    if (this.busy || this.loading || this.loadFailed || (this.step === 3 && !this.optionsReady))
      return;
    if (this.step === 1 && (!this.name.trim() || !this.city.trim())) return;
    if (
      this.step === 3 &&
      this.selectedMode === 'team' &&
      (!this.courseIds.length || this.skillsError)
    )
      return;
    if (this.step === 3 && this.selectedMode === 'social' && !this.socialReady) return;
    this.busy = true;
    this.error = '';
    try {
      const nextStep = Math.min(3, this.step + 1);
      const preferences = {
        ...this.profile.preferences,
        onboarding_step: nextStep,
        onboarding_mode: this.selectedMode,
        onboarding_complete: this.step === 3,
      };
      if (this.step === 3 && this.selectedMode === 'team') {
        // Save the completion marker only after both academic writes succeed.
        await firstValueFrom(this.academic.saveCourses(this.courseIds));
        await firstValueFrom(
          this.academic.saveProfile({
            skills: this.skills,
            preferred_role: this.role.trim(),
          }),
        );
      }
      const payload: Partial<Profile> = {
        first_name: this.name.trim(),
        location: { ...this.profile.location, city: this.city.trim() },
        preferences,
      };
      if (this.step === 3 && this.selectedMode === 'social') {
        payload.birth_date = this.birthDate;
        payload.gender = this.gender;
        payload.interested_in = [this.interestedIn];
        payload.interest_ids = this.interestIds;
        payload.about_me = this.about.trim();
      }
      const response = await firstValueFrom(this.profiles.store(payload));
      this.profile = response.data;
      if (this.step === 3) {
        this.onboarding.complete();
        // An explicit initial choice takes priority over a previous browser's mode.
        this.modes.current.set(this.selectedMode);
        localStorage.setItem('winx_mode', this.selectedMode);
        const target = this.selectedMode === 'team' ? '/team/discover' : '/discover';
        void this.router.navigateByUrl(target, { replaceUrl: true });
      } else {
        this.step = nextStep;
        if (this.step === 3) await this.loadOptions();
        this.focusTitle();
      }
    } catch (error) {
      this.error = academicError(error, 'Не удалось сохранить. Ваши данные остались в форме.');
    } finally {
      this.busy = false;
    }
  }

  async retry(): Promise<void> {
    if (this.loadFailed) {
      await this.load();
      return;
    }
    this.busy = true;
    this.error = '';
    try {
      await this.loadOptions();
    } catch (error) {
      this.error = academicError(error);
    } finally {
      this.busy = false;
    }
  }

  async back(): Promise<void> {
    if (this.busy || this.step === 1) return;
    this.step--;
    this.error = '';
    this.focusTitle();
  }

  private focusTitle(): void {
    setTimeout(() => this.stepTitle?.nativeElement.focus());
  }
}
