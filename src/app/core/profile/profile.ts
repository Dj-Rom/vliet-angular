import { Component } from '@angular/core';
import {AuthService} from '../../services/auth-service';
import {User} from 'firebase/auth';


@Component({
  selector: 'app-profile',
  imports: [],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile {
user: User | null = null;

isEditFullName: boolean = false;
  isEditEmail: boolean = false;
  isEditPassword: boolean = false;

constructor(private authService: AuthService) {
  this.user = authService.getUser();
  console.log(this.user)
}

  logout() {
    this.authService.logout();
  }
}
