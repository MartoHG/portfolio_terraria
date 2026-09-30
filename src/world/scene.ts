import {
  Application,
  Assets,
  Container,
  Graphics,
  Sprite,
  Texture,
  TilingSprite,
} from 'pixi.js';
import { PlayerAnimator, type AnimationTextures } from './animation';
import { AmbientSystem, type AmbientDiagnostics } from './ambient/system';
import { ambientAssetPaths } from './ambient/preset';
import { ASSETS, WORLD } from './config';
import { DebugOverlay } from './debug';
import { bindDestinationInput } from './input';
import { createPlayerState, setDestination, stepPlayer, type PlayerState } from './physics';

declare global {
  interface Window {
    __phase1Diagnostics?: {
      version: string;
      frame: number;
      ambient: AmbientDiagnostics;
    };
    __TERRARIA_DEBUG__?: {
      ready: boolean;
      player: PlayerState;
      setDestination: (x: number) => void;
      viewport: () => { width: number; height: number };
    };
  }
}

interface SceneOptions {
  mount: HTMLDivElement;
  onStatus: (message: string) => void;
}

export class FloatingIslandScene {
  private readonly app = new Application();
  private readonly world = new Container();
  private readonly background = new Container();
  private readonly clouds = new Container();
  private readonly player = createPlayerState();
  private readonly debugEnabled = new URLSearchParams(window.location.search).get('debug') === '1';
  private readonly motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  private readonly abort = new AbortController();
  private reducedMotion = this.motionPreference.matches;
  private animator?: PlayerAnimator;
  private ambient?: AmbientSystem;
  private marker?: Sprite;
  private markerAge = 0;
  private input?: ReturnType<typeof bindDestinationInput>;
  private observer?: ResizeObserver;
  private cloudSprites: Sprite[] = [];
  private debug?: DebugOverlay;
  private destroyed = false;
  private initialized = false;
  private cloudElapsed = 0;

  constructor(private readonly options: SceneOptions) {}

  async init(): Promise<void> {
    await this.app.init({
      resizeTo: this.options.mount,
      background: '#3a8cf2',
      antialias: false,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      roundPixels: true,
      preference: 'webgl',
    });
    this.initialized = true;
    if (this.destroyed) {
      this.app.destroy({ removeView: true }, { children: true, texture: false, textureSource: false });
      return;
    }
    this.app.canvas.setAttribute('aria-label', 'Escena interactiva de una isla flotante con una casa-taller');
    this.app.canvas.setAttribute('role', 'img');
    this.app.canvas.dataset.testid = 'world-canvas';
    this.options.mount.appendChild(this.app.canvas);

    this.app.stage.sortableChildren = true;
    this.app.stage.addChild(this.background, this.clouds, this.world);
    this.world.sortableChildren = true;

    const textures = await this.loadTextures();
    if (this.destroyed) return;
    this.createBackground(textures);
    this.createWorld(textures);
    this.layout();

    this.input = bindDestinationInput(this.app, this.world, (x, y, inputType) => {
      setDestination(this.player, x);
      this.showMarker(x, y, inputType === 'touch' || inputType === 'pen');
      this.options.onStatus(`Destino fijado a ${Math.round(x)} píxeles de la isla.`);
    });

    this.observer = new ResizeObserver(() => this.layout());
    this.observer.observe(this.options.mount);
    this.motionPreference.addEventListener('change', this.handleMotionPreference, { signal: this.abort.signal });
    document.addEventListener('visibilitychange', this.handleVisibility, { signal: this.abort.signal });
    this.app.ticker.add(this.tick);
    this.app.ticker.maxFPS = 60;
    window.__TERRARIA_DEBUG__ = {
      ready: true,
      player: this.player,
      setDestination: (x) => setDestination(this.player, x),
      viewport: () => ({ width: this.app.screen.width, height: this.app.screen.height }),
    };
    if (this.ambient) {
      window.__phase1Diagnostics = {
        version: 'phase1.5-v1',
        frame: 0,
        ambient: this.ambient.diagnostics,
      };
    }
    this.options.onStatus('Isla lista. Indica un destino sobre el terreno.');
  }

  private async loadTextures(): Promise<Record<string, Texture>> {
    const paths = [
      ASSETS.cleanPlate,
      ASSETS.sky,
      ASSETS.mountainsFar,
      ASSETS.mountainsMid,
      ASSETS.forest,
      ASSETS.touchTarget,
      ...ASSETS.clouds,
      ...Object.values(ASSETS.adventurer).flat(),
      ...ambientAssetPaths,
    ];
    const loaded = (await Assets.load(paths)) as Record<string, Texture>;
    for (const texture of Object.values(loaded)) texture.source.scaleMode = 'nearest';
    return loaded;
  }

  private createBackground(textures: Record<string, Texture>): void {
    const sky = new TilingSprite({ texture: textures[ASSETS.sky], width: 1, height: 1 });
    sky.label = 'sky';
    sky.tileScale.set(2);
    this.background.addChild(sky);

    const layers = [
      { path: ASSETS.mountainsFar, label: 'mountains-far', scale: 2.05, bottom: 132 },
      { path: ASSETS.mountainsMid, label: 'mountains-mid', scale: 2.15, bottom: 55 },
      { path: ASSETS.forest, label: 'forest-horizon', scale: 2.25, bottom: -26 },
    ];
    for (const layer of layers) {
      const sprite = new TilingSprite({ texture: textures[layer.path], width: 1, height: textures[layer.path].height * layer.scale });
      sprite.label = layer.label;
      sprite.tileScale.set(layer.scale);
      (sprite as TilingSprite & { layerBottom?: number }).layerBottom = layer.bottom;
      this.background.addChild(sprite);
    }

    const cloudPositions = [
      { x: 0.13, y: 0.16, scale: 1.55 },
      { x: 0.5, y: 0.1, scale: 1.2 },
      { x: 0.82, y: 0.23, scale: 1.7 },
      { x: 0.36, y: 0.32, scale: 1.35 },
    ];
    cloudPositions.forEach((item, index) => {
      const sprite = new Sprite(textures[ASSETS.clouds[index % ASSETS.clouds.length]]);
      sprite.anchor.set(0.5);
      sprite.scale.set(item.scale);
      sprite.alpha = 0.78;
      sprite.x = this.app.screen.width * item.x;
      sprite.y = this.app.screen.height * item.y;
      sprite.zIndex = 2;
      (sprite as Sprite & { baseX?: number; speed?: number }).baseX = item.x;
      (sprite as Sprite & { baseX?: number; speed?: number }).speed = 2.2 + index * 0.55;
      (sprite as Sprite & { baseY?: number; phase?: number }).baseY = item.y;
      (sprite as Sprite & { baseY?: number; phase?: number }).phase = index * 1.73;
      this.cloudSprites.push(sprite);
      this.clouds.addChild(sprite);
    });
  }

  private createWorld(textures: Record<string, Texture>): void {
    const mobile = this.app.screen.width < 700 || this.app.screen.width / this.app.screen.height < 0.9;
    this.ambient = new AmbientSystem(textures, { mobile, reducedMotion: this.reducedMotion });
    this.ambient.container.label = 'approved-floating-island-layers';
    this.ambient.container.zIndex = 10;
    this.world.addChild(this.ambient.container);

    const animationTextures = Object.fromEntries(
      Object.entries(ASSETS.adventurer).map(([state, paths]) => [state, paths.map((path) => textures[path])]),
    ) as AnimationTextures;
    this.animator = new PlayerAnimator(animationTextures);
    this.animator.sprite.zIndex = 100;
    this.animator.sprite.position.set(this.player.x, this.player.y);
    this.world.addChild(this.animator.sprite);

    this.marker = new Sprite(textures[ASSETS.touchTarget]);
    this.marker.anchor.set(0.5);
    this.marker.visible = false;
    this.marker.alpha = 0;
    this.marker.zIndex = 110;
    this.marker.roundPixels = true;
    this.world.addChild(this.marker);

    if (this.debugEnabled) {
      this.debug = new DebugOverlay();
      this.world.addChild(this.debug.graphics);
      this.app.stage.addChild(this.debug.label);
    }
  }

  private showMarker(x: number, y: number, persistent: boolean): void {
    if (!this.marker) return;
    this.marker.position.set(x, y - 3);
    this.marker.visible = true;
    this.marker.alpha = persistent ? 0.9 : 0.6;
    this.markerAge = 0;
  }

  private layout(): void {
    const width = this.app.screen.width;
    const height = this.app.screen.height;
    if (!width || !height) return;
    const sky = this.background.getChildByLabel('sky') as TilingSprite | null;
    if (sky) { sky.width = width; sky.height = height; }
    for (const child of this.background.children) {
      if (!(child instanceof TilingSprite) || child === sky) continue;
      child.width = width;
      const bottom = (child as TilingSprite & { layerBottom?: number }).layerBottom ?? 0;
      child.y = height - child.height + bottom;
    }
    this.cloudSprites.forEach((cloud, index) => {
      const baseX = (cloud as Sprite & { baseX?: number }).baseX ?? 0.5;
      cloud.x = width * baseX;
      const baseY = (cloud as Sprite & { baseY?: number }).baseY ?? 0.2;
      cloud.y = height * baseY;
    });
    this.positionCamera(true);
  }

  private positionCamera(force = false): void {
    const width = this.app.screen.width;
    const height = this.app.screen.height;
    const mobile = width < 700 || width / height < 0.9;
    let scale: number;
    let desiredX: number;
    if (mobile) {
      scale = Math.min(1, Math.max(0.78, (height * 0.86) / WORLD.height));
      const lookAhead = Math.max(-65, Math.min(65, this.player.vx * 0.35));
      desiredX = width * 0.47 - (this.player.x + lookAhead) * scale;
      desiredX = Math.min(10, Math.max(width - WORLD.width * scale - 10, desiredX));
    } else {
      scale = Math.min((width * 0.96) / WORLD.width, (height * 0.9) / WORLD.height, 1.05);
      scale = Math.max(0.58, scale);
      desiredX = Math.round((width - WORLD.width * scale) / 2);
    }
    const desiredY = Math.round((height - WORLD.height * scale) / 2 + height * 0.025);
    this.world.scale.set(scale);
    if (force || !mobile) this.world.position.set(Math.round(desiredX), desiredY);
    else {
      this.world.x += (desiredX - this.world.x) * 0.075;
      this.world.y = desiredY;
    }
  }

  private tick = () => {
    const dt = this.app.ticker.deltaMS / 1000;
    this.ambient?.update(dt);
    stepPlayer(this.player, dt);
    if (this.animator) {
      this.animator.sprite.position.set(Math.round(this.player.x), Math.round(this.player.y));
      this.animator.setState(this.player.motion, this.player.facing);
    }
    if (this.marker?.visible) {
      this.markerAge += dt;
      const distance = Math.abs(this.player.targetX - this.player.x);
      if (distance < 5 || this.markerAge > 3.2) this.marker.alpha -= dt * 2.5;
      if (this.marker.alpha <= 0) this.marker.visible = false;
    }
    if (!this.reducedMotion) {
      this.cloudElapsed += Math.min(dt, 1 / 20);
      this.cloudSprites.forEach((cloud) => {
        const speed = (cloud as Sprite & { speed?: number }).speed ?? 2;
        cloud.x += speed * dt;
        const baseY = (cloud as Sprite & { baseY?: number }).baseY ?? 0.2;
        const phase = (cloud as Sprite & { phase?: number }).phase ?? 0;
        cloud.y = Math.round(this.app.screen.height * baseY + Math.sin(this.cloudElapsed * (0.09 + phase * 0.006) + phase) * 2);
        if (cloud.x - cloud.width / 2 > this.app.screen.width) cloud.x = -cloud.width / 2;
      });
    }
    this.positionCamera();
    if (window.__phase1Diagnostics) window.__phase1Diagnostics.frame += 1;
    this.debug?.draw(this.player, this.app.ticker.FPS, this.ambient?.diagnostics);
  };

  private handleMotionPreference = (event: MediaQueryListEvent) => {
    this.reducedMotion = event.matches;
    this.ambient?.setReducedMotion(event.matches);
  };

  private handleVisibility = () => {
    const paused = document.hidden;
    this.ambient?.setPaused(paused);
    if (paused) this.app.ticker.stop();
    else this.app.ticker.start();
  };

  destroy(): void {
    this.destroyed = true;
    this.abort.abort();
    this.input?.destroy();
    this.observer?.disconnect();
    this.ambient?.container.removeFromParent();
    this.ambient?.destroy();
    if (window.__TERRARIA_DEBUG__?.player === this.player) delete window.__TERRARIA_DEBUG__;
    delete window.__phase1Diagnostics;
    if (this.initialized) {
      this.app.ticker.remove(this.tick);
      this.app.destroy({ removeView: true }, { children: true, texture: false, textureSource: false });
    }
  }
}
