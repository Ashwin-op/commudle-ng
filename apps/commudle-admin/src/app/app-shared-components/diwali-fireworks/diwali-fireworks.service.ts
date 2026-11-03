import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

// Shared state between the fireworks canvases and the replay / sound buttons.
@Injectable({ providedIn: 'root' })
export class DiwaliFireworksService {
  // Off by default; only the visitor's own click turns it on, so browsers never block the sound.
  readonly soundOn$ = new BehaviorSubject<boolean>(false);
  readonly showPlaying$ = new BehaviorSubject<boolean>(false);
  readonly replay$ = new Subject<void>();

  // Pages that draw the show behind their own content (e.g. fill-form). While one is on screen,
  // the site-wide overlay stands down so the show never plays twice at once.
  backgroundStages = 0;

  // True once today's cookie is set but before any stage has played the show. The overlay sets the
  // cookie on app start, and may then stand down for a background stage that mounts a moment later;
  // this flag lets that stage still play today's one show.
  entranceDue = false;

  replay(): void {
    if (!this.showPlaying$.value) this.replay$.next();
  }

  toggleSound(): void {
    this.soundOn$.next(!this.soundOn$.value);
  }
}
