import {
  Directive,
  ElementRef,
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  OnChanges,
  Output,
} from '@angular/core';

export type SwipeDirection = 'left' | 'right';

@Directive({ selector: '[appSwipeCard]', standalone: true })
export class SwipeCardDirective implements OnChanges {
  @Input() swipeDisabled = false;
  @Output() swipeDrag = new EventEmitter<number>();
  @Output() swiped = new EventEmitter<SwipeDirection>();
  @HostBinding('style.touch-action') readonly touchAction = 'pan-y pinch-zoom';
  private pointer: { id: number; x: number; y: number; time: number; horizontal: boolean } | null =
    null;
  private suppressClickUntil = 0;
  constructor(private host: ElementRef<HTMLElement>) {}
  ngOnChanges(): void {
    if (this.swipeDisabled) this.reset();
  }

  @HostListener('pointerdown', ['$event'])
  pointerDown(event: PointerEvent): void {
    if (
      this.swipeDisabled ||
      this.pointer ||
      !event.isPrimary ||
      (event.pointerType === 'mouse' && event.button !== 0) ||
      this.interactive(event.target)
    )
      return;
    this.pointer = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      time: event.timeStamp,
      horizontal: false,
    };
  }

  @HostListener('pointermove', ['$event'])
  pointerMove(event: PointerEvent): void {
    const start = this.pointer;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x,
      dy = event.clientY - start.y;
    if (!start.horizontal) {
      if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) {
        this.reset();
        return;
      }
      if (Math.abs(dx) < 12 || Math.abs(dx) <= Math.abs(dy) * 1.2) return;
      start.horizontal = true;
      // Capture only after horizontal intent, preserving vertical page scrolling.
      this.host.nativeElement.setPointerCapture(event.pointerId);
    }
    event.preventDefault();
    const limit = this.host.nativeElement.clientWidth * 1.1;
    this.swipeDrag.emit(Math.max(-limit, Math.min(limit, dx)));
  }

  @HostListener('pointerup', ['$event'])
  pointerUp(event: PointerEvent): void {
    const start = this.pointer;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x,
      dy = event.clientY - start.y;
    const threshold = Math.max(64, Math.min(110, this.host.nativeElement.clientWidth * 0.25));
    const distance = Math.abs(dx);
    const velocity = distance / Math.max(1, event.timeStamp - start.time);
    const accepted =
      start.horizontal &&
      distance > Math.abs(dy) * 1.2 &&
      (distance >= threshold || (distance >= threshold * 0.65 && velocity > 0.65));
    this.pointer = null;
    if (start.horizontal) this.suppressClickUntil = performance.now() + 400;
    if (accepted && !this.swipeDisabled) this.swiped.emit(dx > 0 ? 'right' : 'left');
    this.swipeDrag.emit(0);
    if (this.host.nativeElement.hasPointerCapture(event.pointerId))
      this.host.nativeElement.releasePointerCapture(event.pointerId);
  }

  @HostListener('pointercancel')
  @HostListener('window:blur')
  cancel(): void {
    this.reset();
  }

  @HostListener('lostpointercapture', ['$event'])
  lostCapture(event: PointerEvent): void {
    // Ignore implicit capture moving from a child to this card.
    if (event.target === this.host.nativeElement) this.reset();
  }

  @HostListener('dragstart', ['$event'])
  dragStart(event: DragEvent): void {
    event.preventDefault();
  }

  @HostListener('click', ['$event'])
  click(event: MouseEvent): void {
    if (performance.now() < this.suppressClickUntil) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  @HostListener('keydown', ['$event'])
  keydown(event: KeyboardEvent): void {
    if (
      this.swipeDisabled ||
      event.repeat ||
      event.target !== this.host.nativeElement ||
      !['ArrowLeft', 'ArrowRight'].includes(event.key)
    )
      return;
    event.preventDefault();
    this.swiped.emit(event.key === 'ArrowRight' ? 'right' : 'left');
  }

  private interactive(target: EventTarget | null): boolean {
    return (
      target instanceof Element &&
      !!target.closest('button,a,input,select,textarea,summary,[data-no-swipe]')
    );
  }
  private reset(): void {
    const id = this.pointer?.id;
    this.pointer = null;
    this.swipeDrag.emit(0);
    if (id !== undefined && this.host.nativeElement.hasPointerCapture(id))
      this.host.nativeElement.releasePointerCapture(id);
  }
}
