import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { FirebaseClientService, SharedAddress } from '../../../firebase/firebase.service';
import { AddLocationModalService } from '../../../core/services/add-location-modal.service';
import { AuthService } from '../../../core/services/auth.service';
import { FormsModule } from '@angular/forms';
import { AlertService } from '../../../core/services/alert.service';
import { MoreMenuService } from '../../../core/services/more-menu.service';

@Component({
  selector: 'app-add-location-modal',
  standalone: true,
  imports: [FormsModule, NgIf],
  templateUrl: './view-client-modal.html',
  styleUrls: [
    './view-client-modal.css',
    '../../waybiils/pages/add-new-waybill-page/add-new-waybill-page.css',
  ],
})
export class ViewClientModal {
  item: SharedAddress | null = null;
  isOpen = false;
  isEdit = false;
  pressTimer: any;
  startPress(event: TouchEvent | MouseEvent | EventTarget) {
    this.pressTimer = setTimeout(() => {
      if ('target' in event) {
        const target = event.target as HTMLInputElement | null;
        if (target) {
          this.onLongPress(target.innerText);
        }
      }
    }, 600);
  }

  endPress() {
    clearTimeout(this.pressTimer);
  }

  onLongPress(text: string) {
    this.CopyGPS(text);
  }

  constructor(
    private modalService: AddLocationModalService,
    private authService: AuthService,
    private fb: FirebaseClientService,
    private alert: AlertService,
    protected moreMenuService: MoreMenuService,
  ) {
    this.modalService.client$.subscribe((client: SharedAddress | null) => (this.item = client));
    this.modalService.isOpen$.subscribe((isOpen: boolean) => (this.isOpen = isOpen));
  }

  isAuth() {
    return this.authService.getUser() !== null;
  }

  edit() {
    this.isEdit = !this.isEdit;
  }

  back() {
    this.modalService.close();
    this.isEdit = false;
  }

  save() {
    if (this.isAuth()) {
      if (this.item) {
        this.fb.updateSharedAddress(this.item?.id!, this.item).then(
          () => {
            this.alert.show('success', 'Client saved successfully!');
            this.modalService.close();
            this.isEdit = false;
          },
          (error) => {
            this.alert.show('error', `Failed to update address: ${error}`);
          },
        );
      }
    }
  }

  protected CopyGPS(text = this.item!.gps) {
    try {
      navigator.clipboard.writeText(text);
      this.alert.show('success', 'Copied!');
    } catch (error) {
      this.alert.show('error', "Can't copy!");
    }
  }

  protected CopyLink(text = this.item!.google_link) {
    try {
      navigator.clipboard.writeText(text);
      this.alert.show('success', 'Copied!');
    } catch (error) {
      this.alert.show('error', "Can't copy!");
    }
  }

  protected async navigate() {
    const [lat, lon] = this.item!.gps.split(',').map((v) => v.trim());

    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad/i.test(navigator.userAgent);

    if (isMobile) {
      const hasTomTom = await this.checkAppInstalled('tomtomgo://');

      if (hasTomTom) {
        // Open TomTom app
        window.location.href = `tomtomgo://x-callback-url/navigate?lat=${lat}&lon=${lon}`;
      } else {
        // Fallback to Google Maps
        if (isIOS) {
          window.location.href = `comgooglemaps://?q=${lat},${lon}&center=${lat},${lon}`;
        } else {
          window.location.href = `geo:${lat},${lon}?q=${lat},${lon}`;
        }
      }
    } else {
      // Desktop - open Google Maps in browser
      window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`, '_blank');
    }
  }

  private checkAppInstalled(urlScheme: string): Promise<boolean> {
    return new Promise((resolve) => {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = urlScheme;

      document.body.appendChild(iframe);

      // If app opens, page will blur
      const timeout = setTimeout(() => {
        document.body.removeChild(iframe);
        resolve(false); // App not installed
      }, 1000);

      window.addEventListener(
        'blur',
        () => {
          clearTimeout(timeout);
          document.body.removeChild(iframe);
          resolve(true); // App is installed
        },
        { once: true },
      );
    });
  }
}
