import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AcademicService, Course, Roster, Team, academicError } from '../../core/services/academic.service';
import { CoursePickerComponent } from '../../shared/course-picker/course-picker.component';

@Component({ selector: 'app-teams', standalone: true, imports: [CommonModule, FormsModule, CoursePickerComponent], templateUrl: './teams.component.html', styleUrl: './team.css' })
export class TeamsComponent {
  @ViewChild(CoursePickerComponent) picker!: CoursePickerComponent;
  course: Course | null = null;
  team: Team | null = null;
  roster: Roster | null = null;
  name = '';
  joinCode = '';
  loading = false;
  busy = false;
  error = '';
  success = '';
  copyMessage = '';
  loadFailed = false;
  slots = [1, 2, 3, 4, 5];
  private requestId = 0;
  constructor(private api: AcademicService) {}
  selectCourse(course: Course | null): void {
    this.course = course; this.name = ''; this.copyMessage = ''; this.success = ''; void this.load();
  }
  async load(): Promise<void> {
    const request = ++this.requestId;
    this.team = null; this.roster = null; this.error = ''; this.loadFailed = false;
    if (!this.course) { this.loading = false; return; }
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
        this.error = academicError(err); this.loadFailed = true;
      }
    } finally { if (request === this.requestId) this.loading = false; }
  }
  async create(): Promise<void> {
    if (!this.course || this.busy || this.name.trim().length < 2 || this.name.trim().length > 50) return;
    this.busy = true; this.error = ''; this.success = '';
    try {
      await firstValueFrom(this.api.createTeam(this.course.id, this.name.trim()));
      this.success = 'Team created! Share the code with classmates from this course.';
      await this.load();
    } catch (err) { this.error = academicError(err); }
    finally { this.busy = false; }
  }
  async join(): Promise<void> {
    if (this.busy || !this.joinCode.trim()) return;
    this.busy = true; this.error = ''; this.success = '';
    try {
      const result = await firstValueFrom(this.api.joinTeam(this.joinCode.trim().toUpperCase()));
      this.joinCode = '';
      this.picker.selectId(result.data.course_id);
      this.success = 'You joined the team. Say hello to your classmates!';
    } catch (err) { this.error = academicError(err); }
    finally { this.busy = false; }
  }
  async copyCode(): Promise<void> {
    if (!this.team) return;
    try { await navigator.clipboard.writeText(this.team.join_code); this.copyMessage = 'Join code copied.'; }
    catch { this.copyMessage = 'Select the code above to copy it manually.'; }
  }
  statusLabel(status: string): string { return status === 'full' ? 'Full · 5 members' : status === 'ready' ? 'Ready · 3–4 members' : 'Forming · 1–2 members'; }
}
