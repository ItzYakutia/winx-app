import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom, forkJoin } from 'rxjs';
import { AcademicService, Course, academicError } from '../../core/services/academic.service';

@Component({ selector: 'app-academic-profile', standalone: true, imports: [CommonModule, FormsModule, RouterLink], templateUrl: './academic-profile.component.html', styleUrl: './team.css' })
export class AcademicProfileComponent implements OnInit {
  courses: Course[] = [];
  selectedIds: number[] = [];
  skillsText = '';
  role = '';
  loading = true;
  saving = false;
  error = '';
  success = '';
  constructor(private api: AcademicService) {}
  ngOnInit(): void { this.load(); }
  load(): void {
    this.loading = true; this.error = '';
    forkJoin({ courses: this.api.courses(), selected: this.api.myCourses(), profile: this.api.profile() }).subscribe({
      next: ({ courses, selected, profile }) => {
        this.courses = courses.data ?? [];
        this.selectedIds = (selected.data ?? []).map(c => c.id);
        this.skillsText = (profile.data?.skills ?? []).join(', ');
        this.role = profile.data?.preferred_role ?? '';
        this.loading = false;
      },
      error: err => { this.loading = false; this.error = academicError(err); },
    });
  }
  get skills(): string[] {
    const seen = new Set<string>();
    return this.skillsText.split(',').map(s => s.trim()).filter(s => {
      if (!s || seen.has(s.toLowerCase())) return false;
      seen.add(s.toLowerCase()); return true;
    });
  }
  get skillsError(): string {
    if (this.skills.length > 20) return 'Choose up to 20 skills.';
    if (this.skills.some(s => [...s].length > 30)) return 'Each skill can have up to 30 characters.';
    return '';
  }
  toggleCourse(id: number): void {
    this.selectedIds = this.selectedIds.includes(id) ? this.selectedIds.filter(value => value !== id) : [...this.selectedIds, id];
    this.success = '';
  }
  async save(): Promise<void> {
    if (this.saving || this.skillsError || [...this.role.trim()].length > 50) return;
    this.saving = true; this.error = ''; this.success = '';
    let coursesSaved = false;
    try {
      await firstValueFrom(this.api.saveCourses(this.selectedIds)); coursesSaved = true;
      const result = await firstValueFrom(this.api.saveProfile({ skills: this.skills, preferred_role: this.role.trim() }));
      this.skillsText = result.data.skills.join(', '); this.role = result.data.preferred_role;
      this.success = 'Academic profile saved. You’re ready to find classmates.';
    } catch (err) {
      this.error = (coursesSaved ? 'Courses were saved, but skills and role could not be saved. ' : '') + academicError(err);
    } finally { this.saving = false; }
  }
}
