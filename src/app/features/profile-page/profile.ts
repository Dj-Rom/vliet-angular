import { Component, computed } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { User } from 'firebase/auth';
import { ProfileService } from './service/profile';
import { ViewProfileModal } from './modals/view-profile-modal/view-profile-modal';
import { NgIf } from '@angular/common';
import { UpdateService } from '../../core/services/update.service';
import { PwaService } from '../../core/services/pwa.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ViewProfileModal, NgIf],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile {
  currentUser = computed(() => this.authService.currentUser());
  displayName = computed(() => this.authService.displayName() || this.authService.getUser()?.displayName || '');
  userEmail = computed(() => this.authService.userEmail() || this.authService.getUser()?.email || '');

  get user(): User | null {
    return this.authService.getUser();
  }

  constructor(
    private authService: AuthService,
    protected profileService: ProfileService,
    public updateService: UpdateService,
    public pwaService: PwaService,
  ) { }

  logout() {
    this.authService.logout();
  }

  protected goToProfile() {
    this.profileService.isOpenModalName.set(true);
  }

  checkUpdates() {
    this.updateService.checkForUpdateManual();
  }

  openInstallPrompt() {
    this.pwaService.openInstallPrompt();
  }
}
