import { Component, OnInit, HostListener } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth-service';
import { FirebaseClientService } from '../../../firebase/firebase.service';

@Component({
  selector: 'app-mobile',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './mobile.html',
  styleUrl: './mobile.css'
})
export class Mobile implements OnInit {

  menuOpen = false;
  isMobile = window.innerWidth < 768;
  isLoggedIn: boolean = false;
  user: string | null = null;
  currentActiveNavigationButton = '';

  constructor(
    private authService: AuthService,
    private fb: FirebaseClientService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initUser();
  }

  // 🔍 Автообновление состояния при ресайзе окна
  @HostListener('window:resize')
  onResize() {
    this.isMobile = window.innerWidth < 768;
  }

  // 🎯 Получение пользователя
  private initUser(): void {
    const email = this.authService.getUser()?.email;

    if (email) {
      this.user = email.split('@')[0];
      this.isLoggedIn = true;
    } else {
      this.isLoggedIn = false;
    }
  }



  isActive(path: string): boolean {

    let arr = document.getElementsByClassName("active");
    if(arr.length>0){
      arr[0].classList.remove("active");
    }
    document.getElementById(`${path}`)?.classList.add("active");
    return this.router.url === path;
  }


}
