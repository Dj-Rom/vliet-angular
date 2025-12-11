import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-time-counter',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './time-counter.html',
  styleUrls: [
    './time-counter.css',
  ]
})
export class TimeCounter {
  dataStart: string = '';
  dataFinish: string = '';
  result: string = '';
  timeCounterForm = new FormControl('');

  constructor() {}

  setDateTime(input: string, isStart: boolean) {
    if (isStart) this.dataStart = input;
    else this.dataFinish = input;
  }

  getResult() {
    if (!this.dataStart || !this.dataFinish) {
      this.result = '⚠️ Please select both start and end times!';
      return;
    }

    const start = new Date(this.dataStart).getTime();
    const finish = new Date(this.dataFinish).getTime();

    if (isNaN(start) || isNaN(finish)) {
      this.result = '❌ Invalid date format!';
      return;
    }

    const diffMs = finish - start;
    if (diffMs < 0) {
      this.result = '🚫 End time is earlier than start time!';
      return;
    }

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    this.result =
      diffDays > 0
        ? `${diffDays}d ${diffHours % 24}h ${diffMinutes % 60}min`
        : diffHours > 0
          ? `${diffHours}h ${diffMinutes % 60}min`
          : `${diffMinutes}min`;
  }

  reset() {
    this.dataStart = '';
    this.dataFinish = '';
    this.result = '';
  }
}
