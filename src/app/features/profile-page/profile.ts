import { Component } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { User } from 'firebase/auth';
import { _Alert } from '../../shared/alert/alert';
import { ProfileService } from './service/profile';
import { ViewProfileModal } from './modals/view-profile-modal/view-profile-modal';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-profile',
  imports: [ViewProfileModal, NgIf],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile {
  user: User | null = null;

  isEditFullName = false;
  isEditEmail = false;
  isEditPassword = false;

  constructor(
    private authService: AuthService,
    protected profileService: ProfileService,
  ) {
    this.user = authService.getUser();
  }
  logout() {
    this.authService.logout();
  }

  protected goToProfile() {
    this.profileService.isOpenModalName.set(true);
  }
}
