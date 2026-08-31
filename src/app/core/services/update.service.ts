import { Injectable, signal, OnDestroy } from '@angular/core';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase.service';
import { environment } from '../../../environments/environment';
import { AlertService } from './alert.service';

export interface RemoteVersionInfo {
  version: string;
  forceUpdate?: boolean;
  message?: string;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class UpdateService implements OnDestroy {
  readonly currentVersion = environment.appVersion;

  isUpdateAvailable = signal<boolean>(false);
  isChecking = signal<boolean>(false);
  remoteVersion = signal<string>(this.currentVersion);
  updateMessage = signal<string>('Dostępna jest nowa wersja aplikacji ze świeżymi funkcjami i poprawkami.');
  isForceUpdate = signal<boolean>(false);

  private checkIntervalTimer?: any;
  private unsubscribeFirestore?: () => void;

  constructor(
    private swUpdate: SwUpdate,
    private alert: AlertService,
  ) {
    this.initServiceWorkerListener();
    this.initFirestoreRemoteListener();
    this.initLifecycleListeners();
  }

  /* ─────────────────────────── */
  /* SERVICE WORKER LISTENER     */
  /* ─────────────────────────── */
  private initServiceWorkerListener(): void {
    if (!this.swUpdate.isEnabled) {
      console.log('[UpdateService] SW not enabled (dev mode or unsupported browser).');
      return;
    }

    this.swUpdate.versionUpdates.subscribe((event: VersionEvent) => {
      switch (event.type) {
        case 'VERSION_DETECTED':
          console.log(`[UpdateService] Downloading new version: ${event.version.hash}`);
          break;
        case 'VERSION_READY':
          console.log(`[UpdateService] Current: ${event.currentVersion.hash}, New: ${event.latestVersion.hash}`);
          this.isUpdateAvailable.set(true);
          this.updateMessage.set('Nowa wersja aplikacji została pobrana i jest gotowa do uruchomienia.');
          break;
        case 'VERSION_INSTALLATION_FAILED':
          console.warn(`[UpdateService] Installation failed for: ${event.version.hash}`, event.error);
          break;
      }
    });

    // Check on startup
    this.checkServiceWorkerUpdate();
  }

  /* ─────────────────────────── */
  /* FIRESTORE REMOTE LISTENER   */
  /* ─────────────────────────── */
  private initFirestoreRemoteListener(): void {
    try {
      const versionDocRef = doc(db, 'system', 'version');

      this.unsubscribeFirestore = onSnapshot(
        versionDocRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data() as RemoteVersionInfo;
            if (data?.version) {
              this.handleRemoteVersionData(data);
            }
          }
        },
        (error) => {
          console.warn('[UpdateService] Remote version listener error (offline fallback):', error);
        },
      );
    } catch (err) {
      console.warn('[UpdateService] Could not register firestore listener:', err);
    }
  }

  private handleRemoteVersionData(data: RemoteVersionInfo): void {
    const remoteVer = data.version.trim();
    this.remoteVersion.set(remoteVer);

    if (this.isNewerVersion(remoteVer, this.currentVersion)) {
      this.isUpdateAvailable.set(true);
      this.isForceUpdate.set(!!data.forceUpdate);
      if (data.message) {
        this.updateMessage.set(data.message);
      }
      this.checkServiceWorkerUpdate();
    }
  }

  private isNewerVersion(remote: string, current: string): boolean {
    if (!remote || !current) return false;
    if (remote === current) return false;

    const rParts = remote.split('.').map((p) => parseInt(p, 10) || 0);
    const cParts = current.split('.').map((p) => parseInt(p, 10) || 0);

    for (let i = 0; i < Math.max(rParts.length, cParts.length); i++) {
      const r = rParts[i] ?? 0;
      const c = cParts[i] ?? 0;
      if (r > c) return true;
      if (r < c) return false;
    }

    return false; // equal
  }

  /* ─────────────────────────── */
  /* LIFECYCLE & BACKGROUND SYNC */
  /* ─────────────────────────── */
  private initLifecycleListeners(): void {
    if (typeof window === 'undefined') return;

    // Check on tab focus / visibility return
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.checkServiceWorkerUpdate();
      }
    });

    window.addEventListener('focus', () => {
      this.checkServiceWorkerUpdate();
    });

    window.addEventListener('online', () => {
      this.checkServiceWorkerUpdate();
      this.checkFirestoreVersionDirect();
    });

    // Check periodically every 5 minutes
    this.checkIntervalTimer = setInterval(() => {
      this.checkServiceWorkerUpdate();
      this.checkFirestoreVersionDirect();
    }, 5 * 60 * 1000);
  }

  private async checkServiceWorkerUpdate(): Promise<boolean> {
    if (!this.swUpdate.isEnabled) return false;
    try {
      return await this.swUpdate.checkForUpdate();
    } catch (e) {
      console.warn('[UpdateService] Check for update failed:', e);
      return false;
    }
  }

  private async checkFirestoreVersionDirect(): Promise<boolean> {
    try {
      const snap = await getDoc(doc(db, 'system', 'version'));
      if (snap.exists()) {
        const data = snap.data() as RemoteVersionInfo;
        if (data?.version) {
          this.handleRemoteVersionData(data);
          return this.isNewerVersion(data.version.trim(), this.currentVersion);
        }
      }
      return false;
    } catch { }
    return false;
  }

  /* ─────────────────────────── */
  /* PUBLIC ACTIONS              */
  /* ─────────────────────────── */

  async checkForUpdateManual(): Promise<void> {
    this.isChecking.set(true);
    try {
      const [swFound, firestoreNewer] = await Promise.all([
        this.checkServiceWorkerUpdate(),
        this.checkFirestoreVersionDirect(),
      ]);

      if (swFound || firestoreNewer || this.isUpdateAvailable()) {
        this.alert.show('success', `🆕 Dostępna nowa wersja (${this.remoteVersion()})!`);
      } else {
        this.alert.show('success', `✅ Aplikacja jest aktualna — wersja ${this.currentVersion}`);
      }
    } catch {
      this.alert.show('error', 'Nie udało się sprawdzić aktualizacji.');
    } finally {
      this.isChecking.set(false);
    }
  }

  async applyUpdate(): Promise<void> {
    try {
      if (this.swUpdate.isEnabled) {
        await this.swUpdate.activateUpdate();
      }

      if (typeof window !== 'undefined' && 'caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch (err) {
      console.warn('[UpdateService] Activate update error:', err);
    } finally {
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }
  }

  dismissUpdate(): void {
    if (!this.isForceUpdate()) {
      this.isUpdateAvailable.set(false);
    }
  }

  /**
   * Distant Update Trigger: allows admin / developer to broadcast a new version signal
   * to all connected users and devices via Firestore in real time.
   */
  async publishRemoteVersion(version: string, message?: string, forceUpdate = false): Promise<void> {
    try {
      await setDoc(
        doc(db, 'system', 'version'),
        {
          version: version.trim(),
          message: message || 'Dostępna nowa wersja aplikacji',
          forceUpdate,
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
      this.alert.show('success', `🚀 Wysłano sygnał aktualizacji dla wersji ${version}!`);
    } catch (err: any) {
      this.alert.show('error', `Błąd publikacji aktualizacji: ${err.message}`);
      throw err;
    }
  }

  ngOnDestroy(): void {
    if (this.checkIntervalTimer) {
      clearInterval(this.checkIntervalTimer);
    }
    if (this.unsubscribeFirestore) {
      this.unsubscribeFirestore();
    }
  }
}
