import { Application, Assets, Container, Graphics, Sprite, Texture, TilingSprite, Rectangle } from 'pixi.js';
import { PlayerAnimator, type AnimationTextures } from './animation';
import { ASSETS, WORLD } from './config';
import { bindDestinationInput } from './input';
import { createPlayerState, requestJump, setDestination, stepPlayer, type PlayerState } from './physics';
import type { SectionId } from './journey';
import { TileIsland, ISLAND_ASSET_PATHS, ISLAND_FLOOR } from './modular/island';
import { ModularHouse, HOUSE_ASSET_PATHS } from './modular/house';
import { ModularNature, NATURE_ASSET_PATHS } from './modular/nature';

export interface JourneyView { worldY: number; section: SectionId; entered: boolean; hidden: boolean }
declare global {
  interface Window {
    __TERRARIA_DEBUG__?: {
      ready: boolean; player: PlayerState; setDestination: (x: number) => void;
      viewport: () => {width: number; height: number}; animationFrame: () => number;
      jump: () => void; toggleDoor: () => void;
      geometry: () => { tiles: number; platforms: number; solids: number; doorOpen: boolean; door: {x1:number;x2:number;y1:number;y2:number}; upperFloorY: number; groundY: number; house: {left:number;right:number} };
      toScreen: (x: number, y: number) => {x: number; y: number};
    };
  }
}
interface SceneOptions { mount: HTMLDivElement; onStatus: (message: string) => void; onProject?: (id: string) => void }
const BOUNDS = {minX: 110, maxX: 1714};
export class FloatingIslandScene {
  private readonly app = new Application();
  private readonly world = new Container();
  private readonly background = new Container();
  private readonly clouds = new Container();
  private readonly player = createPlayerState({x: 440, y: ISLAND_FLOOR});
  private readonly motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  private readonly abort = new AbortController();
  private reducedMotion = this.motionPreference.matches;
  private animator?: PlayerAnimator;
  private island?: TileIsland;
  private house?: ModularHouse;
  private nature?: ModularNature;
  private marker?: Sprite;
  private markerAge = 0;
  private input?: ReturnType<typeof bindDestinationInput>;
  private observer?: ResizeObserver;
  private cloudSprites: Sprite[] = [];
  private distantSprites: Sprite[] = [];
  private readonly derivedTextures: Texture[] = [];
  private cloudElapsed = 0;
  private doorOpen = false;
  private destroyed = false;
  private initialized = false;
  private collisionOverlay?: Graphics;
  private journey: JourneyView = {worldY: 460, section: 'about', entered: false, hidden: false};
  constructor(private readonly options: SceneOptions) {}
  async init(): Promise<void> {
    await this.app.init({resizeTo: this.options.mount, background: '#3a8cf2', antialias: false,
      autoDensity: true, resolution: Math.min(window.devicePixelRatio || 1, 2), roundPixels: true, preference: 'webgl'});
    this.initialized = true;
    if (this.destroyed) { this.app.destroy({removeView: true}, {children: true}); return; }
    const canvas = this.app.canvas;
    canvas.setAttribute('aria-label', 'Isla modular. Flechas para caminar, espacio para saltar, E para abrir la puerta y flecha abajo para bajar de una plataforma.');
    canvas.setAttribute('role', 'application'); canvas.tabIndex = 0; canvas.dataset.testid = 'world-canvas';
    this.options.mount.appendChild(canvas);
    this.app.stage.addChild(this.background, this.clouds, this.world);
    this.world.sortableChildren = true;
    const textures = await this.loadTextures();
    if (this.destroyed) return;
    this.createBackground(textures); this.createWorld(textures); this.layout();
    this.input = bindDestinationInput(this.app, this.world, (x, y, type) => {
      if (!this.journey.entered) return;
      this.moveTo(x);
      if (y < this.player.y - 70) this.jump();
      this.showMarker(this.player.targetX, y, type !== 'mouse');
      canvas.focus({preventScroll: true});
    });
    canvas.addEventListener('keydown', this.handleKeyboard, {signal: this.abort.signal});
    this.observer = new ResizeObserver(() => this.layout()); this.observer.observe(this.options.mount);
    this.motionPreference.addEventListener('change', this.handleMotionPreference, {signal: this.abort.signal});
    document.addEventListener('visibilitychange', this.handleVisibility, {signal: this.abort.signal});
    this.app.ticker.add(this.tick); this.app.ticker.maxFPS = 60;
    window.__TERRARIA_DEBUG__ = {ready: true, player: this.player, setDestination: (x) => this.moveTo(x),
      viewport: () => ({width: this.app.screen.width, height: this.app.screen.height}),
      animationFrame: () => this.animator?.sprite.currentFrame ?? 0, jump: () => this.jump(), toggleDoor: () => this.toggleDoor(),
      geometry: () => ({tiles: this.island?.tileCount ?? 0, platforms: this.platforms.length,
        solids: this.solids.length, doorOpen: this.doorOpen,
        door: this.house?.doorBounds ?? {x1:0,x2:0,y1:0,y2:0}, upperFloorY: this.house?.platforms[1]?.y ?? 304,
        groundY: ISLAND_FLOOR, house: {left:this.house?.left ?? 0,right:this.house?.right ?? 0}}), toScreen: (x,y) => ({x: this.world.x+x*this.world.scale.x,y:this.world.y+y*this.world.scale.y})};
    this.options.onStatus('Isla modular lista. Clic para caminar, espacio para saltar y E para abrir la puerta.');
  }
  private async loadTextures(): Promise<Record<string, Texture>> {
    const paths = [...new Set([ASSETS.sky, ASSETS.mountainsFar, ASSETS.mountainsMid, ASSETS.forest, ASSETS.touchTarget,
      ...ASSETS.clouds, ...[1,2,4].map(i => `/assets/scene-v2/distant-island-${i}.png`), ...Object.values(ASSETS.adventurer).flat(), ...ISLAND_ASSET_PATHS, ...HOUSE_ASSET_PATHS, ...NATURE_ASSET_PATHS])];
    const loaded = await Assets.load(paths) as Record<string, Texture>;
    for (const texture of Object.values(loaded)) texture.source.scaleMode = 'nearest';
    return loaded;
  }
  private createBackground(textures: Record<string, Texture>): void {
    const sky = new TilingSprite({ texture: textures[ASSETS.sky], width: 1, height: 1 });
    sky.label = 'sky';
    sky.tileScale.set(2);
    this.background.addChild(sky);

    const layers = [
      { path: ASSETS.mountainsFar, label: 'mountains-far', scale: 1.55, bottom: 80 },
      { path: ASSETS.mountainsMid, label: 'mountains-mid', scale: 1.65, bottom: 45 },
      { path: ASSETS.forest, label: 'forest-horizon', scale: 1.35, bottom: 0 },
    ];
    for (const layer of layers) {
      const sprite = new TilingSprite({ texture: textures[layer.path], width: 1, height: textures[layer.path].height * layer.scale });
      sprite.label = layer.label;
      sprite.tint = 0x8cb7d5; sprite.alpha = .62;
      sprite.tileScale.set(layer.scale);
      (sprite as TilingSprite & { layerBottom?: number }).layerBottom = layer.bottom;
      this.background.addChild(sprite);
    }

    const distant = [
      {id:1,rect:[385,330,677,464],x:.08,y:.29,width:115,alpha:.33},
      {id:2,rect:[305,356,838,431],x:.88,y:.24,width:155,alpha:.30},
      {id:4,rect:[340,326,832,512],x:.7,y:.71,width:95,alpha:.24},
    ];
    for (const item of distant) {
      const texture = new Texture({source: textures[`/assets/scene-v2/distant-island-${item.id}.png`].source,
        frame: new Rectangle(...item.rect as [number,number,number,number])});
      this.derivedTextures.push(texture);
      const sprite = new Sprite(texture); sprite.anchor.set(.5); sprite.width = item.width; sprite.scale.y = sprite.scale.x;
      sprite.alpha = item.alpha; sprite.tint = 0x82c1e8;
      sprite.label = `distant-island-${item.id}`;
      Object.assign(sprite, {baseX:item.x,baseY:item.y}); this.distantSprites.push(sprite); this.clouds.addChild(sprite);
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
    this.island = new TileIsland(textures); this.island.container.zIndex = 10;
    this.house = new ModularHouse(textures, {x: 500, groundY: ISLAND_FLOOR, scale: 2, onDoor: () => this.toggleDoor()});
    this.house.container.zIndex = 20;
    this.nature = new ModularNature(textures, {reducedMotion: this.reducedMotion,groundYAt:this.island.groundYAt}); this.nature.container.zIndex = 30;
    this.world.addChild(this.island.container, this.house.container, this.nature.container);
    const animationTextures = Object.fromEntries(Object.entries(ASSETS.adventurer).map(([state, paths]) =>
      [state, paths.map(path => textures[path])])) as AnimationTextures;
    this.animator = new PlayerAnimator(animationTextures); this.animator.setReducedMotion(this.reducedMotion);
    this.animator.sprite.zIndex = 100; this.world.addChild(this.animator.sprite);
    this.marker = new Sprite(textures[ASSETS.touchTarget]); this.marker.anchor.set(.5); this.marker.visible = false;
    this.marker.zIndex = 110; this.world.addChild(this.marker);
    if (new URLSearchParams(location.search).get('debug') === '1') {
      this.collisionOverlay = new Graphics(); this.collisionOverlay.zIndex = 200; this.world.addChild(this.collisionOverlay);
    }
  }
  private get platforms() { return [...(this.island?.platforms ?? []), ...(this.house?.platforms ?? [])]; }
  private get solids() { return [...(this.island?.solids ?? []), ...(this.house?.solids ?? [])]; }
  moveTo(x: number): void { setDestination(this.player, x, BOUNDS); }
  jump(): void { if (this.journey.entered) requestJump(this.player, 580); }
  toggleDoor(): void {
    if (!this.journey.entered || !this.house) return;
    const door = this.house.doorBounds;
    if (this.doorOpen && this.player.x+15>door.x1 && this.player.x-15<door.x2 && this.player.y>door.y1 && this.player.y-64<door.y2) {
      this.options.onStatus('Pasá el umbral antes de cerrar la puerta.'); return;
    }
    this.doorOpen = !this.doorOpen; this.house.setDoorOpen(this.doorOpen);
    this.options.onStatus(this.doorOpen ? 'Puerta abierta. Ya podés entrar a la casa.' : 'Puerta cerrada.');
  }
  drop(): void {
    if (!this.player.grounded) return;
    // Timber floors are one-way; solid terrain below still blocks the descent.
    if (this.player.y >= ISLAND_FLOOR) return;
    this.player.y += 3; this.player.grounded = false; this.player.vy = 20;
  }
  private showMarker(x: number, y: number, persistent: boolean): void {
    if (!this.marker) return;
    this.marker.position.set(x,y); this.marker.visible = true; this.marker.alpha = persistent ? .9 : .6; this.markerAge = 0;
  }
  private layout(): void {
    const width = this.app.screen.width;
    const height = this.app.screen.height;
    if (!width || !height) return;
    const sky = this.background.getChildByLabel('sky') as TilingSprite | null;
    if (sky) {
      sky.width = width; sky.height = height;
      // Repeat across the horizon, while preserving one continuous sky gradient.
      sky.tileScale.y = height / sky.texture.height;
    }
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
    for (const island of this.distantSprites) {
      const data = island as Sprite & {baseX:number;baseY:number};
      island.position.set(width * data.baseX,height * data.baseY);
    }
    this.positionCamera(true);
  }

  private positionCamera(force = false): void {
    const {width, height} = this.app.screen;
    const mobile = width < 700;
    const scale = mobile ? Math.min(1, height / 900) : Math.min(width / 1810, height / 950, 1.1);
    this.world.scale.set(scale);
    const desiredX = mobile ? Math.min(10, Math.max(width - 1774 * scale - 10, width * .45 - this.player.x * scale)) : (width - 1774 * scale) / 2;
    this.world.x = force || !mobile || this.reducedMotion ? desiredX : this.world.x + (desiredX - this.world.x) * .075;
    for (const child of this.background.children) {
      if (child instanceof TilingSprite) {
        const factor = child.label === 'forest-horizon' ? .08 : child.label === 'mountains-mid' ? .045 : .02;
        child.tilePosition.x = this.world.x * factor;
      }
    }
    for (const island of this.distantSprites) {
      const data = island as Sprite & {baseX:number};
      island.x = width * data.baseX + this.world.x * .07;
    }
    // The remaining biomes are under reconstruction; no illustration substitutes for them.
    this.world.y = height * .56 - ISLAND_FLOOR * scale;
  }
  private tick = () => {
    const dt = Math.min(.15, this.app.ticker.deltaMS / 1000);
    this.house?.update(dt, this.reducedMotion); this.nature?.update(dt, this.reducedMotion);
    if (this.journey.entered) stepPlayer(this.player, dt, {...BOUNDS, platforms: this.platforms, solids: this.solids, groundYAt:this.island?.groundYAt, useGroundProfile:true, jumpZones:[1250,1490], playerHeight: 64, playerHalfWidth: 15});
    if (this.player.y > 1080) Object.assign(this.player, createPlayerState({x: 440,y: ISLAND_FLOOR}));
    if (this.animator) {
      this.animator.setState(this.player.motion, this.player.facing); this.animator.sprite.scale.set(this.player.facing * 1.65, 1.65);
      this.animator.sprite.position.set(Math.round(this.player.x), Math.round(this.player.y + 6.6)); this.animator.update(this.app.ticker);
    }
    if (this.marker?.visible) {
      this.markerAge += dt;
      if (this.markerAge > 1.5) this.marker.alpha -= dt * 2;
      if (this.marker.alpha <= 0) this.marker.visible = false;
    }
    if (!this.reducedMotion) {
      this.cloudElapsed += dt;
      for (const cloud of this.cloudSprites) {
        const data = cloud as Sprite & {speed?: number; baseY?: number; phase?: number};
        cloud.x += (data.speed ?? 2) * dt;
        cloud.y = this.app.screen.height * (data.baseY ?? .2) + Math.sin(this.cloudElapsed * .1 + (data.phase ?? 0)) * 2;
        if (cloud.x - cloud.width / 2 > this.app.screen.width) cloud.x = -cloud.width / 2;
      }
    }
    this.positionCamera();
    if (this.collisionOverlay) {
      const g = this.collisionOverlay; g.clear();
      for (const p of this.platforms) g.moveTo(p.x1,p.y).lineTo(p.x2,p.y).stroke({color:0x44ffbb,width:1});
      for (const s of this.solids) g.rect(s.x1,s.y1,s.x2-s.x1,s.y2-s.y1).stroke({color:0xff8050,width:1});
      g.rect(this.player.x-15,this.player.y-64,30,64).stroke({color:0xffffff,width:1});
    }
  };
  private handleKeyboard = (event: KeyboardEvent): void => {
    if (!this.journey.entered) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault(); this.moveTo(this.player.x + (event.key === 'ArrowLeft' ? -180 : 180));
    } else if (event.code === 'Space') { event.preventDefault(); if (!event.repeat) this.jump(); }
    else if (event.key.toLowerCase() === 'e') { event.preventDefault(); if (!event.repeat) this.toggleDoor(); }
    else if (event.key === 'ArrowDown') { event.preventDefault(); this.drop(); }
  };
  private handleMotionPreference = (event: MediaQueryListEvent) => {
    this.reducedMotion = event.matches; this.animator?.setReducedMotion(event.matches);
  };
  private handleVisibility = () => { if (document.hidden) this.app.ticker.stop(); else this.app.ticker.start(); };
  setJourney(view: JourneyView): void { this.journey = view; }
  activateProject(_id: string, arrived: () => void): void { arrived(); }
  closeProject(): void {}
  projectOrigin(_id: string): {x: number; y: number} | undefined { return undefined; }
  destroy(): void {
    this.destroyed = true; this.abort.abort(); this.input?.destroy(); this.observer?.disconnect();
    if (window.__TERRARIA_DEBUG__?.player === this.player) delete window.__TERRARIA_DEBUG__;
    for (const entity of [this.nature, this.house, this.island]) { entity?.container.removeFromParent(); entity?.destroy(); }
    this.derivedTextures.forEach(texture => texture.destroy(false));
    if (this.initialized) { this.app.ticker.remove(this.tick); this.app.destroy({removeView: true}, {children: true,texture:false,textureSource:false}); }
  }
}
