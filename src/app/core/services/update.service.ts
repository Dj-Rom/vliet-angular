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
  isApplying = signal<boolean>(false);
  remoteVersion = signal<string>(this.currentVersion);
  updateMessage = signal<string>('Dostępna jest nowa wersja aplikacji ze świeżymi funkcjami i poprawkami.');
  isForceUpdate = signal<boolean>(false);

  private checkIntervalTimer?: any;
  private unsubscribeFirestore?: () => void;
  private isDismissedForSession = false;
  private isSwVersionReady = false;

  /** Prevents overlapping SW check/apply cycles (iOS Safari SW API is flaky under concurrency) */
  private isUpdateCycleActive = false;

  /** Detect iOS (iPhone / iPad / iPod or iPad-as-desktop) */
  private readonly isIos: boolean =
    typeof navigator !== 'undefined' &&
    (/iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

  constructor(
    private swUpdate: SwUpdate,
    private alert: AlertService,
  ) {
    this.cleanupUpdateParam();
    this.checkSessionAttempted();
    this.initServiceWorkerListener();
    this.initFirestoreRemoteListener();
    this.initLifecycleListeners();
  }

  private checkSessionAttempted(): void {
    if (typeof window === 'undefined' || !window.sessionStorage) return;
    try {
      const attempted = sessionStorage.getItem('vliet_update_attempted');
      if (attempted && !this.isNewerVersion(attempted, this.currentVersion)) {
        sessionStorage.removeItem('vliet_update_attempted');
      }
    } catch { }
  }

  private cleanupUpdateParam(): void {
    if (typeof window !== 'undefined' &&
      (window.location.search.includes('_upd') || window.location.search.includes('_v='))) {
      try {
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete('_upd');
        cleanUrl.searchParams.delete('_v');
        const newSearch = cleanUrl.searchParams.toString();
        const newUrl = cleanUrl.pathname + (newSearch ? `?${newSearch}` : '') + cleanUrl.hash;
        window.history.replaceState({}, document.title, newUrl);
      } catch { }
    }
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
          this.updateMessage.set('Trwa pobieranie nowej wersji aplikacji...');
          break;
        case 'VERSION_READY':
          console.log(`[UpdateService] Current: ${event.currentVersion.hash}, New: ${event.latestVersion.hash}`);
          this.isSwVersionReady = true;
          this.isUpdateAvailable.set(true);
          this.updateMessage.set('Nowa wersja aplikacji została pobrana i jest gotowa do uruchomienia.');
          break;
        case 'VERSION_INSTALLATION_FAILED':
          console.warn(`[UpdateService] Installation failed for: ${event.version.hash}`, event.error);
          break;
      }
    });

    // Handle unrecoverable SW states (e.g. hash mismatch / deleted files on server)
    this.swUpdate.unrecoverable.subscribe((event) => {
      console.warn('[UpdateService] Service worker unrecoverable state detected:', event.reason);
      const lastReload = sessionStorage.getItem('vliet_unrecoverable_reload');
      const now = Date.now();
      if (!lastReload || now - parseInt(lastReload, 10) > 15000) {
        sessionStorage.setItem('vliet_unrecoverable_reload', now.toString());
        window.location.reload();
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
      // Prevent infinite loop if user just clicked update and CDN propagation is in progress
      const recentlyAttempted =
        typeof window !== 'undefined' && window.sessionStorage
          ? sessionStorage.getItem('vliet_update_attempted')
          : null;

      if (recentlyAttempted === remoteVer && !data.forceUpdate && !this.isSwVersionReady) {
        console.log(`[UpdateService] Update to ${remoteVer} was recently attempted; checking in background.`);
        this.checkServiceWorkerUpdate();
        return;
      }

      if (!this.isDismissedForSession || data.forceUpdate) {
        this.isUpdateAvailable.set(true);
      }
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
    if (!this.swUpdate.isEnabled || this.isUpdateCycleActive) return false;
    try {
      // Make sure the SW registration is actually ready before asking it to check.
      // On iOS, especially right after install-to-homescreen, the registration can
      // still be settling — checkForUpdate() called too early silently no-ops.
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        await navigator.serviceWorker.ready;
      }
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
        // Show update modal instead of just an alert so user can apply it
        this.isDismissedForSession = false;
        this.isUpdateAvailable.set(true);
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

  private waitForVersionReady(timeoutMs = 6000): Promise<boolean> {
    if (this.isSwVersionReady) {
      return Promise.resolve(true);
    }

    return new Promise((resolve) => {
      let resolved = false;

      const sub = this.swUpdate.versionUpdates.subscribe((event) => {
        if (event.type === 'VERSION_READY') {
          if (!resolved) {
            resolved = true;
            this.isSwVersionReady = true;
            sub.unsubscribe();
            resolve(true);
          }
        }
      });

      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          sub.unsubscribe();
          resolve(false);
        }
      }, timeoutMs);
    });
  }

  /**
   * Send SKIP_WAITING to all waiting service worker registrations.
   * Critical for iOS Safari where SW often stays in "waiting" state
   * and won't auto-activate even after activateUpdate().
   * Returns true if a waiting/installing worker was actually found and messaged.
   */
  private async broadcastSkipWaiting(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return false;
    let messaged = false;
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const reg of regs) {
        const target = reg.waiting ?? reg.installing;
        if (target) {
          target.postMessage({ type: 'SKIP_WAITING' });
          console.log('[UpdateService] SKIP_WAITING sent to SW');
          messaged = true;
        }
      }
    } catch (e) {
      console.warn('[UpdateService] broadcastSkipWaiting error:', e);
    }
    return messaged;
  }



  /**
   * Hard-reload with cache-bust query param.
   * Needed on iOS PWA — location.reload() can serve stale SW cache.
   */
  private hardReload(): void {
    const url = new URL(window.location.href);
    url.searchParams.set('_v', Date.now().toString());
    window.location.replace(url.toString());
  }

  async applyUpdate(): Promise<void> {
    if (this.isApplying() || this.isUpdateCycleActive) return;
    this.isApplying.set(true);
    this.isUpdateCycleActive = true;

    try {
      const targetVersion = this.remoteVersion();
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.setItem('vliet_update_attempted', targetVersion);
      }

      if (this.swUpdate.isEnabled) {
        let ready = this.isSwVersionReady;

        if (!ready) {
          this.updateMessage.set('Pobieranie nowej wersji aplikacji...');
          let swHasUpdate = false;
          try {
            swHasUpdate = await this.swUpdate.checkForUpdate();
          } catch (e) {
            console.warn('[UpdateService] swUpdate.checkForUpdate error:', e);
          }

          if (!swHasUpdate && !this.isSwVersionReady) {
            this.updateMessage.set(
              'Nowa wersja jest jeszcze publikowana na serwerze. Odczekaj chwilę i spróbuj ponownie.',
            );
            this.alert.show('error', 'Nowa wersja jeszcze publikuje się na serwerze — odczekaj chwilę.');
            return;
          }

          ready = await this.waitForVersionReady(4000);
        }

        if (!ready) {
          this.updateMessage.set(
            'Nowa wersja wciąż się pobiera. Spróbuj ponownie za chwilę.',
          );
          this.alert.show('error', 'Aktualizacja jeszcze się nie pobrała — spróbuj ponownie za chwilę.');
          return;
        }

        // Force waiting SW to activate (especially needed on iOS)
        await this.broadcastSkipWaiting();

        // Activate the new version in the Service Worker
        try {
          await this.swUpdate.activateUpdate();
          console.log('[UpdateService] swUpdate.activateUpdate succeeded');
        } catch (swErr) {
          console.warn('[UpdateService] swUpdate.activateUpdate error:', swErr);
        }

        // Brief delay to ensure SW finishes activation state before reload
        await new Promise((r) => setTimeout(r, 250));
      }
    } catch (err) {
      console.warn('[UpdateService] applyUpdate error:', err);
    } finally {
      this.isUpdateCycleActive = false;
      if (typeof window !== 'undefined') {
        // iOS PWA: use hard reload with cache-bust to avoid serving stale SW cache
        if (this.isIos) {
          this.hardReload();
        } else {
          window.location.reload();
        }
      }
      this.isApplying.set(false);
    }
  }

  dismissUpdate(): void {
    if (!this.isForceUpdate()) {
      this.isDismissedForSession = true;
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