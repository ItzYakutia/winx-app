import { Component, Input } from '@angular/core';

// Small, shared line icons keep navigation and controls visually consistent.
const paths: Record<string, string> = {
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3',
  heart: 'M12 20S3 14.5 3 8.5a4.5 4.5 0 0 1 9-1 4.5 4.5 0 0 1 9 1C21 14.5 12 20 12 20Z',
  users:
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  bookmark: 'M6 3h12v18l-6-4-6 4V3Z',
  chat: 'M4 4h16v13H9l-5 4V4ZM8 9h8M8 13h5',
  bell: 'M6 9a6 6 0 0 1 12 0c0 6 2 8 2 8H4s2-2 2-8ZM10 21h4',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 6 0 0 1 16 0',
  logout: 'M9 4H4v16h5M14 8l4 4-4 4M8 12h13',
  arrow: 'M4 12h16M14 6l6 6-6 6',
  back: 'M20 12H4M10 6l-6 6 6 6',
  close: 'M6 6l12 12M6 18 18 6',
  check: 'm5 12 4 4L19 6',
  pin: 'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0ZM15 10a3 3 0 1 0-6 0 3 3 0 0 0 6 0Z',
  upload: 'M12 16V3M7 8l5-5 5 5M4 15v6h16v-6',
  send: 'm22 2-7 20-4-9-9-4L22 2ZM11 13 22 2',
  book: 'M12 5C9 3 5 3 2 5v15c3-2 7-2 10 0 3-2 7-2 10 0V5c-3-2-7-2-10 0ZM12 5v15',
  chevron: 'm9 5 7 7-7 7',
  plus: 'M12 5v14M5 12h14',
  copy: 'M8 8h12v13H8V8ZM16 8V3H3v13h5',
};

@Component({
  selector: 'app-icon',
  standalone: true,
  template: `<svg
    [attr.width]="size"
    [attr.height]="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.7"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path [attr.d]="path" />
  </svg>`,
  styles: [
    ':host { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; vertical-align: middle; } svg { display: block; }',
  ],
})
export class IconComponent {
  @Input() name = 'search';
  @Input() size = 20;
  get path(): string {
    return paths[this.name] ?? paths['search'];
  }
}
