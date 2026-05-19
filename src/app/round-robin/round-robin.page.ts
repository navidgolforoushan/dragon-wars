import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
} from '@ionic/angular/standalone';
import { RoundRobinKeypadComponent } from './round-robin-keypad.component';

interface MatchItem {
  label: string;
  homeName: string;
  awayName: string;
  home: [string, string];
  away: [string, string];
  scoreA: number;
  scoreB: number;
  meta: string;
}

@Component({
  standalone: true,
  selector: 'app-round-robin',
  templateUrl: 'round-robin.page.html',
  styleUrls: ['round-robin.page.scss'],
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonButton, RoundRobinKeypadComponent],
})
export class RoundRobinPage {
  keypadOpen = false;
  selectedMatchIndex: number | null = null;
  selectedKeypadTeamA = '';
  selectedKeypadTeamB = '';
  selectedKeypadScoreA = '00';
  selectedKeypadScoreB = '00';

  matches: MatchItem[] = [
    {
      label: 'Game 1.1',
      homeName: 'Astra / Nyx',
      awayName: 'Max / Nicole',
      home: ['Astra', 'Nyx'],
      away: ['Max', 'Nicole'],
      scoreA: 1,
      scoreB: 4,
      meta: 'Court 2 · 7:10 PM',
    },
    {
      label: 'Game 1.2',
      homeName: 'Alex / Maria',
      awayName: 'Chris / Anna',
      home: ['Alex', 'Maria'],
      away: ['Chris', 'Anna'],
      scoreA: 2,
      scoreB: 4,
      meta: 'Court 4 · 7:50 PM',
    },
  ];

  constructor(private router: Router) {}

  openKeypad(index: number) {
    this.selectedMatchIndex = index;
    const match = this.matches[index];
    this.selectedKeypadTeamA = match.homeName;
    this.selectedKeypadTeamB = match.awayName;
    this.selectedKeypadScoreA = this.formatTwoDigits(match.scoreA);
    this.selectedKeypadScoreB = this.formatTwoDigits(match.scoreB);
    this.keypadOpen = true;
  }

  closeKeypad() {
    this.keypadOpen = false;
    this.selectedMatchIndex = null;
  }

  updateScore(scores: { scoreA: number; scoreB: number }) {
    if (this.selectedMatchIndex === null) {
      return;
    }
    this.matches[this.selectedMatchIndex].scoreA = scores.scoreA;
    this.matches[this.selectedMatchIndex].scoreB = scores.scoreB;
    this.closeKeypad();
  }

  formatTwoDigits(value: number) {
    return value.toString().padStart(2, '0');
  }

  startMatch() {
    this.router.navigate(['/home']);
  }
}
