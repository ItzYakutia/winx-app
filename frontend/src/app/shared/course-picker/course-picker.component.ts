import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AcademicService, Course, academicError } from '../../core/services/academic.service';

@Component({
  selector: 'app-course-picker', standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  styles: [`
    .course-picker { background: #fff; border: 1px solid #dfd5f3; border-radius: 16px; padding: 18px; margin-bottom: 24px; }
    label { display: flex; flex-direction: column; gap: 8px; font-size: 13px; font-weight: 800; color: #766c87; }
    select { width: 100%; min-width: 0; border-color: #dfd5f3; }
    .subtle-link { display: inline-block; color: #7252cf; font-size: 13px; font-weight: 700; margin-top: 10px; text-decoration: none; }
    .compact { padding: 25px 10px; }
  `],
  template: `
    <div class="course-picker">
      <div *ngIf="loading" role="status">Loading your courses…</div>
      <div *ngIf="error" class="error-msg" role="alert">{{ error }} <button class="btn btn-ghost" (click)="load()">Retry</button></div>
      <ng-container *ngIf="!loading && !error">
        <label *ngIf="courses.length" for="active-course">Your course
          <select id="active-course" class="form-control" [ngModel]="selectedId" (ngModelChange)="selectId(+$event)" [disabled]="disabled">
            <option *ngFor="let item of courses" [ngValue]="item.id">{{ item.code }} · {{ item.title }}</option>
          </select>
        </label>
        <div *ngIf="!courses.length" class="empty-state compact">
          <h3>Start with your courses</h3><p>Select the subjects you’re taking to find classmates and form a team.</p>
          <a routerLink="/team/profile" class="btn btn-primary mt-16">Set up academic profile</a>
        </div>
        <a *ngIf="courses.length" routerLink="/team/profile" class="subtle-link">Edit my courses →</a>
      </ng-container>
    </div>
  `,
})
export class CoursePickerComponent implements OnInit {
  @Input() disabled = false;
  @Output() courseChange = new EventEmitter<Course | null>();
  courses: Course[] = [];
  selectedId = 0;
  loading = true;
  error = '';
  constructor(private api: AcademicService, private route: ActivatedRoute) {}
  ngOnInit(): void { this.load(); }
  load(): void {
    this.loading = true; this.error = '';
    this.api.myCourses().subscribe({
      next: res => {
        this.courses = res.data ?? []; this.loading = false;
        const preferred = Number(this.route.snapshot.queryParamMap.get('course') || localStorage.getItem('winx_team_course'));
        this.selectId(this.courses.some(c => c.id === preferred) ? preferred : this.courses[0]?.id ?? 0);
      },
      error: err => { this.loading = false; this.error = academicError(err); this.courseChange.emit(null); },
    });
  }
  selectId(id: number): void {
    this.selectedId = id;
    const course = this.courses.find(c => c.id === id) ?? null;
    if (course) localStorage.setItem('winx_team_course', String(id));
    this.courseChange.emit(course);
  }
}
