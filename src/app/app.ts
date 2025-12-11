import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {FirebaseClientService} from './firebase/firebase.service';
import {Navigation} from './core/navigation/navigation';
import {NgIf} from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navigation, NgIf],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  isLoggedIn: any;
  constructor(fb: FirebaseClientService) {
    this.isLoggedIn = fb.isLoggedIn();
  }
  protected readonly title = signal('vliet-transport');
}
