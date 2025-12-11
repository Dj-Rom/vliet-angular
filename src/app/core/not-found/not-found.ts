import { Component } from '@angular/core';

@Component({
  selector: 'app-not-found',
  standalone: true,
  template: `
    <div class="wrapper">
      <img
        class="cat"
        src="assets/not-found-cat.png"
        alt="Sad cat"
      />
      <h1 class="title">Нет такой страницы</h1>
      <p class="subtitle">Кажется, вы забрели не туда...</p>
    </div>
  `,
  styles: [`
    .wrapper {
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      padding: 20px;
      background: #fef0db;
      font-family: Arial, sans-serif;
    }

    .cat {
      width: 200px;
      height: auto;
      margin-bottom: 20px;
      animation: float 3s ease-in-out infinite;
    }

    .title {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 10px;
    }

    .subtitle {
      font-size: 16px;
      color: #666;
    }

    @keyframes float {
      0% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
      100% { transform: translateY(0); }
    }
  `]
})
export class NotFound {}
