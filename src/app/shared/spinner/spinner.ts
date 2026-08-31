import { Component } from '@angular/core';

@Component({
  selector: 'app-spinner',
  standalone: true,
  template: `
    <div class="loader-backdrop">
      <div class="loader-ring">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        position: fixed;
        inset: 0;
        z-index: 9999;
        pointer-events: all;
      }

      .loader-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.72);
        backdrop-filter: blur(2px);
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.15s ease;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to   { opacity: 1; }
      }

      /* Dual-ring spinner */
      .loader-ring {
        display: inline-block;
        position: relative;
        width: 56px;
        height: 56px;
      }

      .loader-ring div {
        box-sizing: border-box;
        display: block;
        position: absolute;
        width: 48px;
        height: 48px;
        margin: 4px;
        border: 4px solid transparent;
        border-top-color: #4c8dff;
        border-radius: 50%;
        animation: ring-spin 0.9s cubic-bezier(0.5, 0, 0.5, 1) infinite;
      }

      .loader-ring div:nth-child(1) { animation-delay: -0.27s; border-top-color: #4c8dff; }
      .loader-ring div:nth-child(2) { animation-delay: -0.18s; border-top-color: #70a4ff; }
      .loader-ring div:nth-child(3) { animation-delay: -0.09s; border-top-color: #9bbeff; }
      .loader-ring div:nth-child(4) { animation-delay:     0s;  border-top-color: #c4d8ff; }

      @keyframes ring-spin {
        0%   { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `,
  ],
})
export class SpinnerComponent {}

