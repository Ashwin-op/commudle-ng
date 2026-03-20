import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Cable } from '@anycable/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { AuthService } from './auth.service';

type AnyCableModule = typeof import('@anycable/web');

@Injectable({
  providedIn: 'root',
})
export class ActionCableConnectionSocket {
  private baseAcUrl;
  private anyCable: AnyCableModule | null = null;
  private acSocket: BehaviorSubject<any> = new BehaviorSubject(null);
  public acSocket$: Observable<any> = this.acSocket.asObservable();
  private acCableSubject: BehaviorSubject<Cable | null> = new BehaviorSubject(null);
  public acCable$: Observable<Cable | null> = this.acCableSubject.asObservable();

  constructor(private authWatchService: AuthService, @Inject(PLATFORM_ID) private platformId: object) {}

  setBaseUrl(envBase: string): string {
    return (this.baseAcUrl = envBase);
  }

  getBaseUrl(): string {
    return this.baseAcUrl;
  }

  getRoute(channelRoute: string): string {
    return `${this.baseAcUrl}/${channelRoute}`;
  }

  async connectToServer() {
    // AnyCable client is browser-only (it references window/WebSocket).
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (!this.anyCable) {
      this.anyCable = await import('@anycable/web');
    }

    if (this.acSocket.value != null) {
      this.acSocket.value.disconnect();
      this.acSocket.next(null);
      this.acCableSubject.next(null);
    }

    // Pass a fresh URL string on every consumer creation
    const consumer = this.anyCable.createConsumer(
      `${this.baseAcUrl}?user_auth_token=${this.authWatchService.getAuthCookie()}`,
    );
    this.acSocket.next(consumer);
    this.acCableSubject.next(consumer.cable);
  }
}
