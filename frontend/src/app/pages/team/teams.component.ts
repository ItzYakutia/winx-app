import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  AcademicService,
  Candidate,
  Course,
  Roster,
  Team,
  academicError,
} from '../../core/services/academic.service';
import { CoursePickerComponent } from '../../shared/course-picker/course-picker.component';
import { IconComponent } from '../../shared/icon/icon.component';
import { SheetComponent } from '../../shared/sheet/sheet.component';
import { ProfileService } from '../../core/services/profile.service';

@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [CommonModule, FormsModule, CoursePickerComponent, IconComponent, SheetComponent],
  templateUrl: './teams.component.html',
  styleUrl: './team.css',
})
export class TeamsComponent {
  @ViewChild(CoursePickerComponent) picker!: CoursePickerComponent;
  course: Course | null = null;
  team: Team | null = null;
  roster: Roster | null = null;
  member: Candidate | null = null;
  panel: 'create' | 'join' | 'code' | null = null;
  name = '';
  joinCode = '';
  loading = false;
  busy = false;
  error = '';
  copyMessage = '';
  loadFailed = false;
  myId = 0;
  private requestId = 0;
  constructor(
    private api: AcademicService,
    profiles: ProfileService,
  ) {
    profiles
      .getMe()
      .subscribe({ next: (r) => (this.myId = r.data?.user_id || 0), error: () => {} });
  }
  async remove(memberId: number): Promise<void> {
    if (!this.course || this.busy) return;
    const self = memberId === this.myId;
    if (
      !confirm(
        self
          ? 'Выйти из команды? Права создателя при необходимости перейдут следующему участнику.'
          : 'Удалить участника из команды? Его переписки с командой будут закрыты.',
      )
    )
      return;
    this.busy = true;
    this.error = '';
    try {
      await firstValueFrom(this.api.removeMember(this.course.id, memberId));
      this.member = null;
      await this.load();
    } catch (error) {
      this.error = academicError(error);
    } finally {
      this.busy = false;
    }
  }
  selectCourse(course: Course | null): void {
    this.course = course;
    this.panel = null;
    this.member = null;
    this.name = '';
    this.copyMessage = '';
    void this.load();
  }
  open(panel: 'create' | 'join' | 'code'): void {
    this.error = '';
    this.copyMessage = '';
    this.panel = panel;
  }
  close(): void {
    if (!this.busy) {
      this.panel = null;
      this.member = null;
      this.error = '';
    }
  }
  async load(): Promise<void> {
    const request = ++this.requestId;
    this.team = null;
    this.roster = null;
    this.error = '';
    this.loadFailed = false;
    if (!this.course) {
      this.loading = false;
      return;
    }
    const courseId = this.course.id;
    this.loading = true;
    try {
      const result = await firstValueFrom(this.api.myTeam(courseId));
      if (request !== this.requestId) return;
      this.team = result.data;
      const roster = await firstValueFrom(this.api.roster(courseId));
      if (request === this.requestId) this.roster = roster.data;
    } catch (err) {
      if (request !== this.requestId) return;
      if (!(err instanceof HttpErrorResponse && err.status === 404 && !this.team)) {
        this.error = academicError(err);
        this.loadFailed = true;
      }
    } finally {
      if (request === this.requestId) this.loading = false;
    }
  }
  async create(): Promise<void> {
    if (!this.course || this.busy || this.name.trim().length < 2 || this.name.trim().length > 50)
      return;
    this.busy = true;
    this.error = '';
    try {
      await firstValueFrom(this.api.createTeam(this.course.id, this.name.trim()));
      this.panel = null;
      await this.load();
    } catch (err) {
      this.error = academicError(err);
    } finally {
      this.busy = false;
    }
  }
  async join(): Promise<void> {
    if (this.busy || !this.joinCode.trim()) return;
    this.busy = true;
    this.error = '';
    try {
      const result = await firstValueFrom(this.api.joinTeam(this.joinCode.trim().toUpperCase()));
      this.joinCode = '';
      this.panel = null;
      if (this.course?.id === result.data.course_id) await this.load();
      else this.picker.selectId(result.data.course_id);
    } catch (err) {
      this.error = academicError(err);
    } finally {
      this.busy = false;
    }
  }
  async copyCode(): Promise<void> {
    if (!this.team) return;
    try {
      await navigator.clipboard.writeText(this.team.join_code);
      this.copyMessage = 'Код скопирован';
    } catch {
      this.copyMessage = 'Выделите код и скопируйте вручную.';
    }
  }
  initials(name: string): string {
    return (
      name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((s) => s[0])
        .join('') || '?'
    );
  }
  statusLabel(status: string): string {
    return status === 'full'
      ? 'Команда собрана'
      : status === 'ready'
        ? 'Готовы к работе'
        : 'Набираем людей';
  }
}
