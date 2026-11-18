import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AcademicService, Candidate, Course, academicError } from '../../core/services/academic.service';
import { CoursePickerComponent } from '../../shared/course-picker/course-picker.component';

@Component({ selector: 'app-course-deck', standalone: true, imports: [CommonModule, RouterLink, CoursePickerComponent], templateUrl: './course-deck.component.html', styleUrl: './team.css' })
export class CourseDeckComponent {
  course: Course | null = null;
  candidates: Candidate[] = [];
  loading = false;
  saving = false;
  error = '';
  feedback = '';
  dragX = 0;
  private pointer: { id: number; x: number; y: number } | null = null;
  private requestId = 0;
  constructor(private api: AcademicService) {}
  get current(): Candidate | null { return this.candidates[0] ?? null; }
  initials(name: string): string { return name.trim().split(/\s+/).map(s => s[0]).slice(0, 2).join('').toUpperCase() || '✦'; }
  selectCourse(course: Course | null): void { this.course = course; this.candidates = []; this.feedback = ''; this.load(); }
  load(): void {
    const request = ++this.requestId;
    this.error = '';
    if (!this.course) { this.loading = false; return; }
    this.loading = true;
    this.api.deck(this.course.id).subscribe({
      next: res => { if (request !== this.requestId) return; this.candidates = res.data ?? []; this.loading = false; },
      error: err => { if (request !== this.requestId) return; this.error = academicError(err); this.loading = false; },
    });
  }
  choose(choice: 'like' | 'pass'): void {
    const candidate = this.current;
    if (this.saving || !candidate || !this.course) return;
    this.saving = true; this.error = ''; this.feedback = '';
    this.api.choose(this.course.id, candidate.user_id, choice).subscribe({
      next: () => {
        this.candidates = this.candidates.filter(c => c.user_id !== candidate.user_id);
        this.saving = false;
        this.feedback = choice === 'like' ? `${candidate.name || 'Classmate'} added to Saved.` : 'Passed. Your decision stays private.';
        if (!this.candidates.length) this.load();
      },
      error: err => { this.saving = false; this.error = academicError(err); },
    });
  }
  pointerDown(event: PointerEvent): void {
    if (this.saving || !event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
    this.pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }
  pointerMove(event: PointerEvent): void {
    if (this.pointer?.id === event.pointerId) this.dragX = Math.max(-120, Math.min(120, event.clientX - this.pointer.x));
  }
  pointerUp(event: PointerEvent): void {
    const start = this.pointer; this.cancelGesture();
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x, dy = event.clientY - start.y;
    if (Math.abs(dx) >= 70 && Math.abs(dx) > Math.abs(dy) * 1.4) this.choose(dx > 0 ? 'like' : 'pass');
  }
  cancelGesture(): void { this.pointer = null; this.dragX = 0; }
}
