import { Component } from '@angular/core';
import { ProfileService } from '../../service/profile';
import { Profile } from '../../profile';

@Component({
  selector: 'app-view-profile-modal',
  imports: [],
  templateUrl: './view-profile-modal.html',
  styleUrl: './view-profile-modal.css',
})
export class ViewProfileModal {
  constructor(
    private profileService: ProfileService,
    protected Profile: Profile,
  ) {}
  back() {
    this.profileService.isOpenModalName.set(false);
  }
}
