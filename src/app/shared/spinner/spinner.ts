import { Component } from '@angular/core';

@Component({
  selector: 'app-spinner',
  template: `
    <div class="spinner-container">
      <div class="spinner"></div>
    </div>
  `,
  styles: [
    `
      .spinner-container {
        position: fixed;
        top: 0%;
        background: black;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100vw;
        padding-top: 0vh;
        height: 100vh;
        z-index: 1000;
        opacity: 1;
      }
      .spinner {
        width: 48px;
        height: 48px;
        border: 5px solid #ccc;
        border-top-color: #1976d2;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class SpinnerComponent {}
