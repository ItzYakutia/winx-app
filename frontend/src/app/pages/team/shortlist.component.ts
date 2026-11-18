import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  AcademicService,
  Candidate,
  Course,
  academicError,
} from '../../core/services/academic.service';
import { CoursePickerComponent } from '../../shared/course-picker/course-picker.component';
import { IconComponent } from '../../shared/icon/icon.component';
import { SheetComponent } from '../../shared/sheet/sheet.component';

@Component({
  selector: 'app-shortlist',
  standalone: true,
  imports: [CommonModule, RouterLink, CoursePickerComponent, IconComponent, SheetComponent],
  templateUrl: './shortlist.component.html',
  styleUrl: './team.css',
})
export class ShortlistComponent {
  course: Course | null = null;
  candidates: Candidate[] = [];
  selected: Candidate | null = null;
  loading = false;
  pendingId = 0;
  offset = 0;
  error = '';
  private requestId = 0;
  constructor(private api: AcademicService) {}
  selectCourse(course: Course | null): void {
    this.course = course;
    this.selected = null;
    this.offset = 0;
    this.candidates = [];
    this.load();
  }
  load(offset = this.offset): void {
    const request = ++this.requestId;
    this.error = '';
    if (!this.course) {
      this.loading = false;
      return;
    }
    this.loading = true;
    this.api.shortlist(this.course.id, offset).subscribe({
      next: (res) => {
        if (request !== this.requestId) return;
        this.offset = offset;
        this.candidates = res.data ?? [];
        this.loading = false;
        if (!this.candidates.length && offset > 0) this.load(Math.max(0, offset - 50));
      },
      error: (err) => {
        if (request !== this.requestId) return;
        this.loading = false;
        this.error = academicError(err);
      },
    });
  }
  remove(candidate: Candidate): void {
    if (!this.course || this.pendingId) return;
    this.pendingId = candidate.user_id;
    this.error = '';
    this.api.choose(this.course.id, candidate.user_id, 'pass').subscribe({
      next: () => {
        this.pendingId = 0;
        this.selected = null;
        this.load();
      },
      error: (err) => {
        this.pendingId = 0;
        this.error = academicError(err);
      },
    });
  }
}
