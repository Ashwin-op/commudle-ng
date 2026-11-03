import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostBinding,
  Inject,
  Input,
  NgZone,
  OnDestroy,
  PLATFORM_ID,
  ViewChild,
} from '@angular/core';
import { SeoService } from 'apps/shared-services/seo.service';
import { CookieService } from 'ngx-cookie-service';
import { Subscription } from 'rxjs';
import { DiwaliFireworksService } from './diwali-fireworks.service';

interface IDiwaliStar {
  x: number;
  y: number;
  speedX: number;
  speedY: number;
  color: string;
  life: number;
  fullLife: number;
  size: number;
  glow?: boolean;
  // Below 1 plays the same trajectory in slow motion (e.g. 0.6 = 60% speed).
  timeScale?: number;
  // Climbs in a straight line at full brightness with a fading trail, ignoring gravity and drag.
  rocket?: boolean;
  // Sheds tiny specks as it flies (rate = chance per 60fps frame), leaving a dotted trail of glitter.
  glitter?: { color: string; rate: number };
  // Near the end of its life it pops into a few tiny sparks, like a crackling firecracker.
  crackle?: boolean;
  // The bang at the burst point: a bright bloom that grows and fades, drawn instead of a star.
  flash?: boolean;
}

const GRAVITY = 0.00028;
const DRAG = 0.985;
const DIWALI_COLORS = ['#FF0043', '#14FC56', '#1E7FFF', '#E60AFF', '#FFBF36', '#FFFFFF'];
const SHELL_COLORS = DIWALI_COLORS.filter((color) => color !== '#FFFFFF');
const SHELL_STYLES = ['peony', 'glitter', 'fallingStars'] as const;
const GLITTER_SHELL = { color: '#FFBF36', sparkColor: '#FFD27A', sparkRate: 0.5 };
const FALLING_STAR_COLORS = ['#E60AFF', '#FF0043', '#1E7FFF', '#14FC56'];
const FALLING_STAR_GLITTER = { color: '#FFF0D2', rate: 0.25 };
const FRAME_MS = 1000 / 60;
// Share of the previous frame faded out per 60fps frame; what remains reads as a glowing streak.
const TRAIL_FADE_PER_FRAME = 0.25;
const FLASH_COLOR = '#FFF6D8';
const FLASH_MS = 180;
const CRACKLE_AT_LIFE = 0.3;
const CRACKLE_SPARK_COUNT = 4;
const CRACKLE_COLORS = ['#FFFFFF', '#FFE9A8'];
const ENTRANCE_SEQUENCE_LAUNCH_COUNT = 4;
const ENTRANCE_SEQUENCE_LAUNCH_GAP_MS = 1000;
const SHOW_SLOW_MOTION = 0.6;
const PISTIL_COLORS = ['#FFFFFF', '#FFD966'];
const PISTIL_DELAY_MS = 220;
const SHOT_RISE_MS = 850;
const SHOT_COLOR = '#FFE9A8';
const ROCKET_TRAIL_LENGTH = 38;
const ROCKET_TRAIL_FADE = 'rgba(255, 233, 168, 0)';
const DIWALI_ENTRANCE_SEEN_COOKIE = 'com_diwali_entrance_seen_today';
const ENTRANCE_SEQUENCE_START_DELAY_MS = 400;
const CRACKER_START_MS = 150;
const CRACKER_END_MS = 4200;
const CRACKER_AVERAGE_GAP_MS = 350;
const CRACKER_RISE_MS = 650;
const FINALE_CRACKER_ROLL_COUNT = 6;
// Trimmed, softened 7s clip of "Firework Show (Short)" (Pixabay Content License).
const SHOW_SOUND_URL = 'assets/sounds/diwali-fireworks.m4a';
const SHOW_SOUND_LENGTH_MS = 7000;
const SHOW_SOUND_VOLUME = 0.7;
// The show (and its sound) is over by the time the clip ends; replays are ignored until then.
const SHOW_LENGTH_MS = SHOW_SOUND_LENGTH_MS;
// Side gutters narrower than this can't fit a burst beside the content, so bursts go anywhere.
const MIN_GUTTER_PX = 120;

@Component({
  selector: 'commudle-diwali-fireworks',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './diwali-fireworks.component.html',
  styleUrls: ['./diwali-fireworks.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiwaliFireworksComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: true }) canvasRef: ElementRef<HTMLCanvasElement>;

  // 'overlay' (default): the site-wide canvas above everything, playing the once-a-day show on load.
  // 'background': drawn behind the host page's content. Same once-a-day show and replays, just behind the page.
  @Input() stage: 'overlay' | 'background' = 'overlay';
  // Background stage only: width (px) of the centred content; bursts aim at the gutters beside it.
  @Input() clearWidth = 0;

  @HostBinding('class.diwali-fireworks--background') get isBackground(): boolean {
    return this.stage === 'background';
  }

  private ctx: CanvasRenderingContext2D;
  private stars: IDiwaliStar[] = [];
  private rafId: number | null = null;
  private lastFrameTime = 0;
  private isBrowser: boolean;
  private enabled = false;
  private shellCount = 0;
  private canvasHasContent = false;
  private viewportWidth = 0;
  private viewportHeight = 0;
  private pendingTimeouts: ReturnType<typeof setTimeout>[] = [];
  private showSound: HTMLAudioElement | null = null;
  private showRunning = false;
  private showStartedAt = 0;
  private subscriptions: Subscription[] = [];

  constructor(
    @Inject(PLATFORM_ID) private platformId: object,
    private seoService: SeoService,
    private cookieService: CookieService,
    private ngZone: NgZone,
    private diwaliFireworksService: DiwaliFireworksService,
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser || this.seoService.isBot) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    this.ctx = this.canvasRef.nativeElement.getContext('2d');
    this.enabled = true;
    this.resizeCanvas();
    window.addEventListener('resize', this.resizeCanvas);

    // Subscribers run synchronously inside the button's click, which browsers count as permission to play sound.
    this.subscriptions.push(
      this.diwaliFireworksService.replay$.subscribe(() => {
        if (this.isActiveStage()) this.ngZone.runOutsideAngular(() => this.runEntranceSequence());
      }),
      this.diwaliFireworksService.soundOn$.subscribe((soundOn) => this.onSoundToggled(soundOn)),
    );

    if (this.isBackground) this.diwaliFireworksService.backgroundStages++;
    this.maybePlayEntranceSequence();
  }

  // The overlay stands down while a page is showing the fireworks behind its own content.
  private isActiveStage(): boolean {
    return this.isBackground || this.diwaliFireworksService.backgroundStages === 0;
  }

  // Both stages share one cookie, so a visitor sees the show once per day, whether over the page or
  // behind a page's content (e.g. fill-form). Replays from the play button are not limited.
  private maybePlayEntranceSequence(): void {
    if (!this.cookieService.check(DIWALI_ENTRANCE_SEEN_COOKIE)) {
      // Expires at the visitor's next local midnight, so the show plays once per day.
      const nextMidnight = new Date();
      nextMidnight.setHours(24, 0, 0, 0);
      this.cookieService.set(DIWALI_ENTRANCE_SEEN_COOKIE, new Date().toISOString(), nextMidnight, '/');
      this.diwaliFireworksService.entranceDue = true;
    }
    if (!this.diwaliFireworksService.entranceDue) return;

    const timeout = setTimeout(() => {
      const service = this.diwaliFireworksService;
      // Whichever stage gets here first while active plays today's show; a slow page that opens while
      // the overlay's show is already on doesn't stack a second one.
      if (!service.entranceDue || !this.isActiveStage() || service.showPlaying$.value) return;
      service.entranceDue = false;
      this.runEntranceSequence();
    }, ENTRANCE_SEQUENCE_START_DELAY_MS);
    this.pendingTimeouts.push(timeout);
  }

  // Sound is opt-in through the sound button. Turning it on mid-show joins the clip at the show's current point.
  private onSoundToggled(soundOn: boolean): void {
    if (!this.showRunning) return;
    if (soundOn) {
      this.playShowSound(performance.now() - this.showStartedAt);
    } else {
      this.showSound?.pause();
    }
  }

  private playShowSound(offsetMs: number): void {
    // Created on first use and reused, so visitors who never turn sound on download nothing.
    if (!this.showSound) {
      this.showSound = new Audio(SHOW_SOUND_URL);
      this.showSound.preload = 'auto';
      this.showSound.volume = SHOW_SOUND_VOLUME;
    }
    this.showSound.currentTime = offsetMs / 1000;
    this.showSound.play().catch(() => undefined);
  }

  private endShow(): void {
    this.showRunning = false;
    this.showSound?.pause();
    this.ngZone.run(() => this.diwaliFireworksService.showPlaying$.next(false));
  }

  // Maps a 0-1 position across the screen to an x. On a background stage with centred content, the
  // left half of the range lands in the left gutter and the right half in the right one, so bursts stay visible.
  private showX(fraction: number): number {
    const gutter = (this.viewportWidth - this.clearWidth) / 2;
    if (!this.isBackground || !this.clearWidth || gutter < MIN_GUTTER_PX) return this.viewportWidth * fraction;

    const withinGutter = gutter * (0.15 + 0.7 * ((fraction * 2) % 1));
    return fraction < 0.5 ? withinGutter : this.viewportWidth - gutter + withinGutter;
  }

  private resizeCanvas = (): void => {
    const canvas = this.canvasRef.nativeElement;
    const dpr = window.devicePixelRatio || 1;
    this.viewportWidth = window.innerWidth;
    this.viewportHeight = window.innerHeight;
    canvas.width = this.viewportWidth * dpr;
    canvas.height = this.viewportHeight * dpr;
    canvas.style.width = `${this.viewportWidth}px`;
    canvas.style.height = `${this.viewportHeight}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  private runEntranceSequence(): void {
    if (this.showRunning) return;
    this.showRunning = true;
    this.showStartedAt = performance.now();
    this.ngZone.run(() => this.diwaliFireworksService.showPlaying$.next(true));
    if (this.diwaliFireworksService.soundOn$.value) this.playShowSound(0);
    this.pendingTimeouts.push(setTimeout(() => this.endShow(), SHOW_LENGTH_MS));

    // Every burst in the show starts as a single glowing line rising from the bottom of the screen.
    for (let i = 0; i < ENTRANCE_SEQUENCE_LAUNCH_COUNT; i++) {
      const timeout = setTimeout(() => {
        const x = this.showX(0.25 + Math.random() * 0.5);
        const y = this.viewportHeight * (0.2 + Math.random() * 0.3);
        this.launchRocket(x, y, SHOT_RISE_MS, () => this.burstAt(x, y));
      }, i * ENTRANCE_SEQUENCE_LAUNCH_GAP_MS);
      this.pendingTimeouts.push(timeout);
    }

    const leftShotTimeout = setTimeout(() => {
      const x = this.showX(0.14);
      const y = this.viewportHeight * (0.22 + Math.random() * 0.15);
      this.launchRocket(x, y, SHOT_RISE_MS, () => this.burstAt(x, y));
    }, 250);
    this.pendingTimeouts.push(leftShotTimeout);

    const rightShotTimeout = setTimeout(() => {
      const x = this.showX(0.86);
      const y = this.viewportHeight * (0.22 + Math.random() * 0.15);
      this.launchRocket(x, y, SHOT_RISE_MS, () => this.burstAt(x, y));
    }, 1350);
    this.pendingTimeouts.push(rightShotTimeout);

    // Smaller cracker rockets go up evenly through the whole show, under the big bursts.
    let launchAt = CRACKER_START_MS;
    while (launchAt < CRACKER_END_MS) {
      this.scheduleCrackerRocket(launchAt, this.showX(0.08 + Math.random() * 0.84));
      launchAt += CRACKER_AVERAGE_GAP_MS * (0.6 + Math.random() * 0.8);
    }

    // Grand finale: a big centre rocket with a quick volley of cracker rockets around it.
    const finaleAt = CRACKER_END_MS + 200;
    const finaleTimeout = setTimeout(() => {
      const x = this.showX(0.5);
      const y = this.viewportHeight * 0.3;
      this.launchRocket(x, y, SHOT_RISE_MS, () => this.burstAt(x, y));
    }, finaleAt);
    this.pendingTimeouts.push(finaleTimeout);
    for (let i = 0; i < FINALE_CRACKER_ROLL_COUNT; i++) {
      this.scheduleCrackerRocket(finaleAt + 60 + i * 90, this.showX(0.3 + Math.random() * 0.4));
    }
  }

  private scheduleCrackerRocket(at: number, x: number): void {
    const timeout = setTimeout(() => {
      const y = this.viewportHeight * (0.4 + Math.random() * 0.25);
      const color = DIWALI_COLORS[Math.floor(Math.random() * DIWALI_COLORS.length)];
      this.launchRocket(x, y, CRACKER_RISE_MS, () => {
        this.burstFlash(x, y, 8);
        this.burstPistil(x, y, color, true);
      });
    }, at);
    this.pendingTimeouts.push(timeout);
  }

  private launchRocket(targetX: number, targetY: number, riseMs: number, burst: () => void): void {
    if (!this.enabled) return;
    this.ensureLoop();
    const startX = targetX + (Math.random() - 0.5) * 30;
    const startY = this.viewportHeight;

    this.stars.push({
      x: startX,
      y: startY,
      speedX: (targetX - startX) / riseMs,
      speedY: (targetY - startY) / riseMs,
      color: SHOT_COLOR,
      life: riseMs,
      fullLife: riseMs,
      size: 1.3,
      glow: true,
      rocket: true,
    });

    const burstTimeout = setTimeout(burst, riseMs);
    this.pendingTimeouts.push(burstTimeout);
  }

  private burstPistil(
    x: number,
    y: number,
    color = PISTIL_COLORS[Math.floor(Math.random() * PISTIL_COLORS.length)],
    crackle = false,
  ): void {
    if (!this.enabled) return;
    this.ensureLoop();
    const starCount = 24 + Math.floor(Math.random() * 14);

    for (let i = 0; i < starCount; i++) {
      const angle = (Math.PI * 2 * i) / starCount + Math.random() * 0.2;
      const speed = 0.06 + Math.random() * 0.08;
      const fullLife = 500 + Math.random() * 250;
      this.stars.push({
        x,
        y,
        speedX: Math.cos(angle) * speed,
        speedY: Math.sin(angle) * speed,
        color,
        life: fullLife,
        fullLife,
        size: 0.9 + Math.random() * 0.5,
        glow: true,
        timeScale: SHOW_SLOW_MOTION,
        crackle,
      });
    }
  }

  private burstFlash(x: number, y: number, radius: number): void {
    this.stars.push({
      x,
      y,
      speedX: 0,
      speedY: 0,
      color: FLASH_COLOR,
      life: FLASH_MS,
      fullLife: FLASH_MS,
      size: radius,
      flash: true,
    });
  }

  private crackleApart(star: IDiwaliStar): void {
    for (let i = 0; i < CRACKLE_SPARK_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.04 + Math.random() * 0.06;
      const sparkLife = 120 + Math.random() * 140;
      this.stars.push({
        x: star.x,
        y: star.y,
        speedX: star.speedX * 0.3 + Math.cos(angle) * speed,
        speedY: star.speedY * 0.3 + Math.sin(angle) * speed,
        color: CRACKLE_COLORS[Math.floor(Math.random() * CRACKLE_COLORS.length)],
        life: sparkLife,
        fullLife: sparkLife,
        size: 0.6 + Math.random() * 0.3,
        timeScale: star.timeScale,
      });
    }
  }

  private burstAt(x: number, y: number): void {
    if (!this.enabled) return;
    this.ensureLoop();

    this.burstFlash(x, y, 16);

    // The show cycles through the styles so every visitor sees all three.
    const style = SHELL_STYLES[this.shellCount++ % SHELL_STYLES.length];
    if (style === 'glitter') {
      this.burstGlitter(x, y);
    } else if (style === 'fallingStars') {
      this.burstFallingStars(x, y);
    } else {
      this.burstPeony(x, y);
    }
  }

  // Streaking stars in one bold colour, then a white/gold inner burst.
  private burstPeony(x: number, y: number): void {
    const starCount = 80 + Math.floor(Math.random() * 30);
    const color = SHELL_COLORS[Math.floor(Math.random() * SHELL_COLORS.length)];

    for (let i = 0; i < starCount; i++) {
      const angle = (Math.PI * 2 * i) / starCount + Math.random() * 0.15;
      const speed = 0.17 + Math.random() * 0.22;
      const fullLife = 1300 + Math.random() * 750;
      this.stars.push({
        x,
        y,
        speedX: Math.cos(angle) * speed,
        speedY: Math.sin(angle) * speed,
        color,
        life: fullLife,
        fullLife,
        size: 1.4 + Math.random() * 0.8,
        glow: true,
        timeScale: SHOW_SLOW_MOTION,
        crackle: true,
      });
    }

    const pistilTimeout = setTimeout(() => this.burstPistil(x, y), PISTIL_DELAY_MS);
    this.pendingTimeouts.push(pistilTimeout);
  }

  // Tiny, dim gold stars that shed glitter specks, leaving long straight rays of sparkle dust.
  private burstGlitter(x: number, y: number): void {
    const starCount = 50 + Math.floor(Math.random() * 15);

    for (let i = 0; i < starCount; i++) {
      const angle = (Math.PI * 2 * i) / starCount + Math.random() * 0.2;
      const speed = 0.18 + Math.random() * 0.16;
      const fullLife = 1400 + Math.random() * 600;
      this.stars.push({
        x,
        y,
        speedX: Math.cos(angle) * speed,
        speedY: Math.sin(angle) * speed,
        color: GLITTER_SHELL.color,
        life: fullLife,
        fullLife,
        size: 0.6 + Math.random() * 0.2,
        timeScale: SHOW_SLOW_MOTION,
        glitter: { color: GLITTER_SHELL.sparkColor, rate: GLITTER_SHELL.sparkRate },
      });
    }
  }

  // Fewer, bigger vivid stars that droop as they fall, with short tails and a faint glitter trail.
  private burstFallingStars(x: number, y: number): void {
    const starCount = 45 + Math.floor(Math.random() * 15);
    const color = FALLING_STAR_COLORS[Math.floor(Math.random() * FALLING_STAR_COLORS.length)];

    for (let i = 0; i < starCount; i++) {
      const angle = (Math.PI * 2 * i) / starCount + Math.random() * 0.2;
      const speed = 0.12 + Math.random() * 0.15;
      // Longer lives give gravity time to pull the stars into a falling arc.
      const fullLife = 2000 + Math.random() * 900;
      this.stars.push({
        x,
        y,
        speedX: Math.cos(angle) * speed,
        speedY: Math.sin(angle) * speed,
        color,
        life: fullLife,
        fullLife,
        size: 1.6 + Math.random() * 0.5,
        glow: true,
        timeScale: SHOW_SLOW_MOTION,
        glitter: FALLING_STAR_GLITTER,
        crackle: true,
      });
    }
  }

  // The loop only runs while something is on screen, and outside Angular so frames never trigger
  // change detection. Every entry point that adds stars calls this; it is a no-op while running.
  private ensureLoop(): void {
    if (this.rafId !== null) return;
    this.lastFrameTime = performance.now();
    this.ngZone.runOutsideAngular(() => {
      this.rafId = requestAnimationFrame(this.tick);
    });
  }

  private tick = (time: number): void => {
    // A restarted loop's first frame can be stamped slightly before the restart.
    const dt = Math.max(0, time - this.lastFrameTime);
    this.lastFrameTime = time;
    this.update(dt);
    this.render(dt);
    // Once the last star is gone, render() has cleared the canvas, so the loop can stop.
    this.rafId = this.stars.length > 0 || this.canvasHasContent ? requestAnimationFrame(this.tick) : null;
  };

  private update(dt: number): void {
    for (let i = this.stars.length - 1; i >= 0; i--) {
      const star = this.stars[i];
      const timeScale = star.timeScale ?? 1;
      const step = dt * timeScale;
      star.life -= step;
      if (star.life <= 0) {
        this.stars.splice(i, 1);
        continue;
      }
      if (star.rocket || star.flash) {
        star.x += star.speedX * step;
        star.y += star.speedY * step;
        continue;
      }
      if (star.crackle && star.life < star.fullLife * CRACKLE_AT_LIFE) {
        star.crackle = false;
        this.crackleApart(star);
        // The star itself is spent once it pops.
        star.life = Math.min(star.life, 60);
      }
      star.x += star.speedX * step;
      star.y += star.speedY * step;
      star.speedY += GRAVITY * step;
      // Drag is applied per frame, so it is scaled too; otherwise slow stars would stop short.
      const drag = timeScale === 1 ? DRAG : Math.pow(DRAG, timeScale);
      star.speedX *= drag;
      star.speedY *= drag;

      if (star.glitter && Math.random() < star.glitter.rate * (dt / FRAME_MS)) {
        const sparkLife = 500 + Math.random() * 500;
        this.stars.push({
          x: star.x,
          y: star.y,
          speedX: star.speedX * 0.15 + (Math.random() - 0.5) * 0.02,
          speedY: star.speedY * 0.15 + (Math.random() - 0.5) * 0.02,
          color: star.glitter.color,
          life: sparkLife,
          fullLife: sparkLife,
          size: 0.5 + Math.random() * 0.4,
          timeScale: star.timeScale,
        });
      }
    }
  }

  private render(dt: number): void {
    const ctx = this.ctx;
    if (this.stars.length === 0) {
      if (this.canvasHasContent) {
        ctx.clearRect(0, 0, this.viewportWidth, this.viewportHeight);
        this.canvasHasContent = false;
      }
      return;
    }
    this.canvasHasContent = true;

    // Fade the previous frame instead of wiping it, so moving stars leave short glowing streaks.
    // 'destination-out' fades toward transparent, so the page underneath never darkens.
    ctx.globalCompositeOperation = 'destination-out';
    ctx.globalAlpha = 1;
    ctx.fillStyle = `rgba(0, 0, 0, ${1 - (1 - TRAIL_FADE_PER_FRAME) ** (dt / FRAME_MS)})`;
    ctx.fillRect(0, 0, this.viewportWidth, this.viewportHeight);

    ctx.globalCompositeOperation = 'lighter';
    for (const star of this.stars) {
      const alpha = star.rocket ? 1 : Math.max(star.life / star.fullLife, 0);
      if (star.flash) {
        this.drawFlash(star, alpha);
        continue;
      }
      if (star.rocket) this.drawRocketTrail(star);
      this.ctx.fillStyle = star.color;

      // Glitter specks are tiny, so a square is indistinguishable from a circle and much cheaper.
      if (!star.glow && star.size < 1) {
        this.ctx.globalAlpha = alpha;
        this.ctx.fillRect(star.x - star.size, star.y - star.size, star.size * 2, star.size * 2);
        continue;
      }

      if (star.glow) {
        this.ctx.globalAlpha = alpha * 0.3;
        this.ctx.beginPath();
        this.ctx.arc(star.x, star.y, star.size * 2, 0, Math.PI * 2);
        this.ctx.fill();
      }

      this.ctx.globalAlpha = alpha;
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1;
  }

  // A soft outer bloom and a hot core that both grow as the flash fades.
  private drawFlash(star: IDiwaliStar, alpha: number): void {
    const radius = star.size * (1 + (1 - alpha) * 1.5);
    this.ctx.fillStyle = star.color;

    this.ctx.globalAlpha = alpha * 0.3;
    this.ctx.beginPath();
    this.ctx.arc(star.x, star.y, radius * 1.8, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.globalAlpha = alpha * 0.9;
    this.ctx.beginPath();
    this.ctx.arc(star.x, star.y, radius * 0.6, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private drawRocketTrail(star: IDiwaliStar): void {
    const speed = Math.hypot(star.speedX, star.speedY) || 1;
    const tailX = star.x - (star.speedX / speed) * ROCKET_TRAIL_LENGTH;
    const tailY = star.y - (star.speedY / speed) * ROCKET_TRAIL_LENGTH;

    const trail = this.ctx.createLinearGradient(star.x, star.y, tailX, tailY);
    trail.addColorStop(0, star.color);
    trail.addColorStop(1, ROCKET_TRAIL_FADE);

    this.ctx.globalAlpha = 1;
    this.ctx.strokeStyle = trail;
    this.ctx.lineWidth = star.size * 1.4;
    this.ctx.lineCap = 'round';
    this.ctx.beginPath();
    this.ctx.moveTo(star.x, star.y);
    this.ctx.lineTo(tailX, tailY);
    this.ctx.stroke();
  }

  ngOnDestroy(): void {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.pendingTimeouts.forEach((timeout) => clearTimeout(timeout));
    if (this.showRunning) this.endShow();
    this.showSound?.pause();
    this.showSound = null;
    if (this.enabled && this.isBackground) this.diwaliFireworksService.backgroundStages--;
    if (this.isBrowser) {
      window.removeEventListener('resize', this.resizeCanvas);
    }
  }
}
