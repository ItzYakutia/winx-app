import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import {
  RecommendationService,
  RecommendationProfile,
} from '../../core/services/recommendation.service';
import { MatchService } from '../../core/services/match.service';
import { IconComponent } from '../../shared/icon/icon.component';
import { optionName } from '../../shared/text';
import { SwipeCardDirective, SwipeDirection } from '../../shared/swipe-card/swipe-card.directive';

type SwipeState = 'idle' | 'left' | 'right';

@Component({
  selector: 'app-discover',
  standalone: true,
  imports: [CommonModule, DecimalPipe, IconComponent, SwipeCardDirective],
  templateUrl: './discover.component.html',
  styleUrl: './discover.component.css',
})
export class DiscoverComponent implements OnInit {
  profiles: RecommendationProfile[] = [];
  currentIndex = 0;
  loading = true;
  swipeState: SwipeState = 'idle';
  matchMessage = '';
  detailsOpen = false;
  dragX = 0;
  get dragTransform(): string | null {
    return this.swipeState === 'idle' && this.dragX
      ? 'translateX(' + this.dragX + 'px) rotate(' + this.dragX / 22 + 'deg)'
      : null;
  }
  swipe(direction: SwipeDirection): void {
    direction === 'right' ? this.swipeRight() : this.swipeLeft();
  }
  optionName = optionName;
  private failedPhotos = new Set<string>();

  constructor(
    private recommendations: RecommendationService,
    private matchService: MatchService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading = true;
    this.recommendations.list(20, 0).subscribe({
      next: (res) => {
        this.profiles = res.data ?? [];
        this.loading = false;
      },
      error: () => {
        this.profiles = [];
        this.loading = false;
      },
    });
  }

  get current(): RecommendationProfile | null {
    return this.profiles[this.currentIndex] ?? null;
  }

  get hasMore(): boolean {
    return this.currentIndex < this.profiles.length;
  }

  swipeLeft(): void {
    const profile = this.current;
    if (!profile?.user_id || this.swipeState !== 'idle') return;
    this.swipeState = 'left';
    this.matchService.swipeLeft(profile.user_id).subscribe({ error: () => {} });
    setTimeout(() => this.next(), 420);
  }

  swipeRight(): void {
    const profile = this.current;
    if (!profile?.user_id || this.swipeState !== 'idle') return;
    this.swipeState = 'right';
    const name = profile.name || 'them';
    this.matchService.swipeRight(profile.user_id).subscribe({
      next: (res) => {
        if (res.message?.toLowerCase().includes('match')) {
          this.matchMessage = `Взаимная симпатия с ${name}`;
          setTimeout(() => (this.matchMessage = ''), 3000);
        }
      },
      error: () => {},
    });
    setTimeout(() => this.next(), 420);
  }

  private next(): void {
    this.detailsOpen = false;
    this.currentIndex++;
    this.swipeState = 'idle';
    if (this.currentIndex >= this.profiles.length) {
      this.load();
      this.currentIndex = 0;
    }
  }

  getPhotoUrl(profile: RecommendationProfile | null): string {
    const url = profile?.photo_url || '';
    return this.failedPhotos.has(url) ? '' : url;
  }

  photoFailed(url: string): void {
    this.failedPhotos.add(url);
  }
}
