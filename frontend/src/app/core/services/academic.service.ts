import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ApiResponse } from './profile.service';

export interface Course { id: number; code: string; title: string; }
export interface AcademicProfile { skills: string[]; preferred_role: string; }
export interface Candidate extends AcademicProfile { user_id: number; name: string; }
export interface Team {
  id: number; course_id: number; name: string; join_code: string;
  member_count: number; status: 'forming' | 'ready' | 'full';
}
export interface Roster {
  team_id: number; team_name: string; size: number; status: Team['status'];
  course: Course; members: Candidate[];
}

// Academic pages handle their own errors; existing Social flows are unchanged.
export function academicError(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (!(error instanceof HttpErrorResponse)) return fallback;
  if (error.status === 0) return 'Cannot reach the server. Check your connection and try again.';
  if (error.status === 401) return 'Your session has expired. Sign in again to continue.';
  const message = error.error?.message;
  if (typeof message === 'string' && message.trim()) return message;
  if (message && typeof message === 'object') {
    return Object.values(message).filter(value => typeof value === 'string').join(' · ') || fallback;
  }
  return fallback;
}

@Injectable({ providedIn: 'root' })
export class AcademicService {
  private readonly base = '/api/v1/profile/academic';
  constructor(private http: HttpClient) {}
  courses() { return this.http.get<ApiResponse<Course[]>>(`${this.base}/courses`); }
  myCourses() { return this.http.get<ApiResponse<Course[]>>(`${this.base}/courses/me`); }
  saveCourses(course_ids: number[]) { return this.http.put<ApiResponse<Course[]>>(`${this.base}/courses/me`, { course_ids }); }
  profile() { return this.http.get<ApiResponse<AcademicProfile>>(`${this.base}/me`); }
  saveProfile(profile: AcademicProfile) { return this.http.put<ApiResponse<AcademicProfile>>(`${this.base}/me`, profile); }
  deck(course_id: number) { return this.http.get<ApiResponse<Candidate[]>>(`${this.base}/deck`, { params: { course_id, limit: 50 } }); }
  choose(course_id: number, candidate_id: number, choice: 'like' | 'pass') {
    return this.http.put<ApiResponse<null>>(`${this.base}/choices`, { course_id, candidate_id, choice });
  }
  shortlist(course_id: number, offset = 0) {
    return this.http.get<ApiResponse<Candidate[]>>(`${this.base}/shortlist`, { params: { course_id, limit: 50, offset } });
  }
  myTeam(course_id: number) { return this.http.get<ApiResponse<Team>>(`${this.base}/teams/me`, { params: { course_id } }); }
  roster(course_id: number) { return this.http.get<ApiResponse<Roster>>(`${this.base}/teams/roster`, { params: { course_id } }); }
  createTeam(course_id: number, name: string) { return this.http.post<ApiResponse<Team>>(`${this.base}/teams`, { course_id, name }); }
  joinTeam(join_code: string) { return this.http.post<ApiResponse<Team>>(`${this.base}/teams/join`, { join_code }); }
}
