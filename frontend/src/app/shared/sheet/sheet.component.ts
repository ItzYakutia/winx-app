import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-sheet',
  standalone: true,
  imports: [IconComponent],
  template: `
    <dialog
      #dialog
      aria-labelledby="sheet-title"
      (cancel)="dismiss($event)"
      (click)="backdrop($event)"
    >
      <section class="sheet-frame">
        <header>
          <h2 id="sheet-title">{{ title }}</h2>
          <button
            type="button"
            class="icon-button"
            aria-label="Закрыть"
            [disabled]="locked"
            (click)="dismiss()"
          >
            <app-icon name="close" [size]="20" />
          </button>
        </header>
        <div class="sheet-content"><ng-content /></div>
      </section>
    </dialog>
  `,
  styles: [
    `
      dialog {
        width: min(520px, calc(100% - 40px));
        max-height: calc(100dvh - 40px);
        margin: auto;
        padding: 0;
        border: 1px solid var(--line);
        border-radius: 14px;
        background: var(--surface);
        color: var(--ink);
      }
      dialog::backdrop {
        background: rgba(22, 20, 15, 0.32);
      }
      .sheet-frame {
        display: flex;
        flex-direction: column;
        max-height: calc(100dvh - 42px);
      }
      header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 18px 24px;
        border-bottom: 1px solid var(--line);
        flex-shrink: 0;
      }
      h2 {
        font-size: 18px;
        font-weight: 700;
        letter-spacing: -0.025em;
      }
      header .icon-button {
        width: 32px;
        height: 32px;
        border: 0;
      }
      .sheet-content {
        display: flex;
        flex-direction: column;
        min-height: 0;
        overflow: hidden;
      }
      @media (max-width: 640px) {
        dialog {
          width: 100%;
          max-width: 100%;
          margin: auto 0 0;
          border-radius: 16px 16px 0 0;
          max-height: calc(100dvh - 20px);
        }
        .sheet-frame {
          max-height: calc(100dvh - 22px);
          padding-bottom: env(safe-area-inset-bottom);
        }
        header {
          padding: 16px 20px;
        }
      }
    `,
  ],
})
export class SheetComponent implements AfterViewInit, OnDestroy {
  @Input() title = '';
  @Input() locked = false;
  @Output() closed = new EventEmitter<void>();
  @ViewChild('dialog', { static: true }) dialog!: ElementRef<HTMLDialogElement>;
  ngAfterViewInit(): void {
    this.dialog.nativeElement.showModal();
  }
  ngOnDestroy(): void {
    this.dialog.nativeElement.close();
  }
  dismiss(event?: Event): void {
    event?.preventDefault();
    if (!this.locked) this.closed.emit();
  }
  backdrop(event: MouseEvent): void {
    if (event.target === this.dialog.nativeElement) this.dismiss();
  }
}
