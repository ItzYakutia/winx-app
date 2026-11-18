import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NotificationService, Notification } from '../../core/services/notification.service';
import { IconComponent } from '../../shared/icon/icon.component';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.css',
})
export class NotificationsComponent implements OnInit {
  notifications: Notification[] = [];
  loading = true;

  constructor(private notifService: NotificationService) {}

  ngOnInit(): void {
    this.notifService.list().subscribe({
      next: (res) => {
        this.notifications = res.data ?? [];
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  delete(notif: Notification): void {
    this.notifService.delete(notif.id).subscribe({
      next: () => {
        this.notifications = this.notifications.filter((n) => n.id !== notif.id);
      },
    });
  }

  getIcon(type: string): string {
    const icons: Record<string, string> = {
      match: 'heart',
      message: 'chat',
      like: 'heart',
      default: 'bell',
    };
    return icons[type] ?? icons['default'];
  }
}
