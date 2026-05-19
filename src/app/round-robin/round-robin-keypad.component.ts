import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-round-robin-keypad',
  standalone: true,
  imports: [CommonModule],
  templateUrl: 'round-robin-keypad.component.html',
  styleUrls: ['round-robin-keypad.component.scss'],
})
export class RoundRobinKeypadComponent implements OnChanges {
  @Input() teamAName = '';
  @Input() teamBName = '';
  @Input() initialScoreA = '00';
  @Input() initialScoreB = '00';

  @Output() close = new EventEmitter<void>();
  @Output() submit = new EventEmitter<{ scoreA: number; scoreB: number }>();

  activeSide: 'a' | 'b' = 'a';
  scoreA = '00';
  scoreB = '00';
  keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
  validationError = '';

  ngOnChanges(changes: SimpleChanges) {
    if (changes['initialScoreA']) {
      this.scoreA = this.formatValue(this.initialScoreA);
    }
    if (changes['initialScoreB']) {
      this.scoreB = this.formatValue(this.initialScoreB);
    }
    this.validationError = '';
  }

  setActive(side: 'a' | 'b') {
    this.activeSide = side;
  }

  pressKey(value: string) {
    const current = this.activeSide === 'a' ? this.scoreA : this.scoreB;
    const next = (current === '00' ? value : (current + value).slice(-2)).padStart(2, '0');
    this.setSideValue(this.activeSide, next);
  }

  backspace() {
    const current = this.activeSide === 'a' ? this.scoreA : this.scoreB;
    const trimmed = current.length > 1 ? current.slice(0, -1) : '';
    this.setSideValue(this.activeSide, trimmed.padStart(2, '0'));
  }

  clearActive() {
    this.setSideValue(this.activeSide, '00');
  }

  onClose() {
    this.close.emit();
  }

  submitScore() {
    const scoreA = parseInt(this.scoreA, 10) || 0;
    const scoreB = parseInt(this.scoreB, 10) || 0;

    if (!this.validateScorePair(scoreA, scoreB)) {
      this.validationError =
        'Invalid pickleball score. Keep scores 0–30, and if the game is finished, the winner must reach 11 or more and win by 2.';
      return;
    }

    this.validationError = '';
    this.submit.emit({ scoreA, scoreB });
  }

  displayScore(value: string) {
    return this.formatValue(value);
  }

  private setSideValue(side: 'a' | 'b', value: string) {
    if (side === 'a') {
      this.scoreA = this.formatValue(value);
    } else {
      this.scoreB = this.formatValue(value);
    }
  }

  private validateScorePair(scoreA: number, scoreB: number) {
    if (!this.isScoreValueValid(scoreA) || !this.isScoreValueValid(scoreB)) {
      return false;
    }

    if (scoreA < 11 && scoreB < 11) {
      return true;
    }

    const high = Math.max(scoreA, scoreB);
    const low = Math.min(scoreA, scoreB);

    if (high === 11) {
      return low <= 9;
    }

    return low >= 10 && high - low === 2;
  }

  private isScoreValueValid(value: number) {
    return value >= 0 && value <= 30;
  }

  private formatValue(value: string) {
    const numeric = value.replace(/[^0-9]/g, '');
    return numeric ? numeric.slice(-2).padStart(2, '0') : '00';
  }
}
