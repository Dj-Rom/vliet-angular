import { Injectable, signal, computed, OnDestroy } from '@angular/core';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/firebase.service';
import { AuthService } from './auth.service';

export interface FirestoreUserDoc {
  status: boolean;
  createdAt: string;
  userData: {
    uid: string;
    email: string;
    fullName: string;
    createdAt: string;
  };
}

@Injectable({ providedIn: 'root' })
export class UserStatusService implements OnDestroy {
  /** true = approved, false = pending, null = not loaded yet */
  readonly isApproved = signal<boolean | null>(null);
  readonly isLoading = signal<boolean>(true);
  readonly userData = signal<FirestoreUserDoc | null>(null);

  /** Computed: user is pending approval (status === false and doc exists) */
  readonly isPending = computed(() => this.isApproved() === false);

  private unsubscribe?: () => void;
  private currentUid: string | null = null;

  constructor(private authService: AuthService) {
    this.watchAuthUser();
  }

  private watchAuthUser(): void {
    this.authService.user$.subscribe((user) => {
      if (user?.uid && user.uid !== this.currentUid) {
        this.startListening(user.uid);
      } else if (!user) {
        this.stopListening();
        this.isApproved.set(null);
        this.isLoading.set(false);
      }
    });
  }

  /** Start Firestore realtime listener for user document */
  startListening(uid: string): void {
    if (this.currentUid === uid) return; // already listening
    this.stopListening();
    this.currentUid = uid;
    this.isLoading.set(true);

    this.unsubscribe = onSnapshot(
      doc(db, 'users', uid),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as FirestoreUserDoc;
          this.userData.set(data);
          this.isApproved.set(data.status === true);
        } else {
          // Document doesn't exist yet (edge case)
          this.isApproved.set(false);
        }
        this.isLoading.set(false);
      },
      (err) => {
        console.warn('[UserStatusService] Firestore listener error:', err);
        // Offline fallback — don't block if we can't reach Firestore
        this.isApproved.set(true);
        this.isLoading.set(false);
      },
    );
  }

  private stopListening(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = undefined;
    }
    this.currentUid = null;
  }

  ngOnDestroy(): void {
    this.stopListening();
    if ((this as any)._pollInterval) {
      clearInterval((this as any)._pollInterval);
    }
  }
}
