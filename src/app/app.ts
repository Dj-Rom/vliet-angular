import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { AppStateService } from './core/services/app-state.service';
import { Navigation } from './shared/navi/navigation';
import { AddNameModal } from './shared/global-modals/add-name-modal/add-name-modal';
import { ModalService } from './core/services/modal.service';
import { AreYourSureModal } from './shared/global-modals/are-your-sure-modal/are-your-sure-modal';
import { AvailableCapacityModal } from './shared/global-modals/available-capacity-modal/available-capacity-modal';
import { MoreMenuModal } from './shared/global-modals/more-menu-modal/more-menu-modal';
import { MoreMenuService } from './core/services/more-menu.service';
import { _Alert } from './shared/alert/alert';
import { MoreMenuWaybill } from './shared/global-modals/more-menu-modal/more-menu-waybill/more-menu-waybill';
import { MoreMenuClient } from './shared/global-modals/more-menu-modal/more-menu-client/more-menu-client';
import { PwaInstallModal } from './shared/pwa-istall-modal/pwa-install-modal';
import { FirebaseClientService } from './firebase/firebase.service';
import { SpinnerComponent } from './shared/spinner/spinner';
import { LoadingService } from './core/services/loading.service';
import {
  Router,
  NavigationStart,
  NavigationEnd,
  NavigationCancel,
  NavigationError,
  RouterOutlet,
} from '@angular/router';
import { AlertService } from './core/services/alert.service';
import { UpdateService } from './core/services/update.service';
import { SwipeComponent } from './helpers/swipe';
import { UpdateModal } from './shared/global-modals/update-modal/update-modal';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    Navigation,
    NgIf,
    AddNameModal,
    AreYourSureModal,
    AvailableCapacityModal,
    MoreMenuModal,
    MoreMenuWaybill,
    MoreMenuClient,
    PwaInstallModal,
    SpinnerComponent,
    _Alert,
    SwipeComponent,
    UpdateModal,
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App {
  readonly loading;
  protected readonly title = 'vliet-transport';

  constructor(
    public appState: AppStateService,
    protected fb: FirebaseClientService,
    protected modalService: ModalService,
    protected moreMenuService: MoreMenuService,
    protected router: Router,
    protected alert: AlertService,
    public updateService: UpdateService,
    private loadingService: LoadingService,
  ) {
    this.loading = this.loadingService.isLoading;
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.loadingService.start();
      }
      if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.loadingService.stop();
      }
    });
  }

  onActivate() {
    // route resolved — loading already stopped by NavigationEnd
  }

  onDeactivate() {}
}

