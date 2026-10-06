import { Application, Assets, Container, Graphics, Sprite, Texture, TilingSprite, Rectangle } from 'pixi.js';
import { PlayerAnimator, type AnimationState, type AnimationTextures } from './animation';
import { ASSETS } from './config';
import { bindDestinationInput } from './input';
import { createPlayerState, requestJump, setDestination, stepPlayer, type PlayerState } from './physics';
import type { SectionId } from './journey';
import { TileIsland, ISLAND_ASSET_PATHS, ISLAND_FLOOR } from './modular/island';
import { ModularHouse, HOUSE_ASSET_PATHS } from './modular/house';
import { ModularNature, NATURE_ASSET_PATHS } from './modular/nature';
import { Ambience, TORCH_FRAMES } from './vertical/ambience';
import { CHARACTER_FRAMES, OBJECTS, TILES, VERTICAL_ASSET_PATHS } from './vertical/assets';
import { Slime, type SlimeFloor } from './vertical/slime';
import { buildWorldLayout, cameraAt, ISLAND, paramOnSurface, pathPoint, targetParam, type WorldLayout } from './vertical/layout';
import { createTraveler, paramAtX, placeTraveler, stepTraveler, type TravelerState } from './vertical/traveler';
import { VerticalWorld } from './vertical/world-view';

export interface JourneyView { section: SectionId; entered: boolean; hidden: boolean }
declare global {
  interface Window {
    __TERRARIA_DEBUG__?: {
      ready: boolean; player: PlayerState; setDestination: (x: number) => void;
      viewport: () => {width: number; height: number}; animationFrame: () => number;
      jump: () => void; toggleDoor: () => void;
      geometry: () => { tiles: number; platforms: number; solids: number; doorOpen: boolean; door: {x1:number;x2:number;y1:number;y2:number}; upperFloorY: number; groundY: number; house: {left:number;right:number} };
      toScreen: (x: number, y: number) => {x: number; y: number};
      traveler: () => { mode: 'physics' | 'path'; segment: string; param: number; target: number; x: number; y: number; animation: AnimationState; visible: boolean };
      camera: () => { x: number; y: number; scale: number };
    };
  }
}
interface SceneOptions { mount: HTMLDivElement; onStatus: (message: string) => void; onProject?: (id: string) => void }
const BOUNDS = {minX: 110, maxX: 1714};
const UMBRELLA = OBJECTS['umbrella-open'];
const PLAYER_SCALE = 1.65;
/** The climbing frames draw the rope 14 px right of the sprite centre. */
const CLIMB_ROPE_OFFSET = 14 * PLAYER_SCALE;

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
  private vertical?: VerticalWorld;
  private ambience?: Ambience;
  private ambienceBuilt = false;
  private slime?: Slime;
  private slimeFloors: SlimeFloor[] = [];
  private cursor?: {x: number; y: number};
  private pendingArrivalBurst = false;
  private umbrella?: Sprite;
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
  private journey: JourneyView = {section: 'about', entered: false, hidden: false};
  private layout?: WorldLayout;
  /** On the island the existing physics drive the player; elsewhere it follows the path. */
  private mode: 'physics' | 'path' = 'physics';
  private traveler?: TravelerState;
  /** A click on the current floor overrides the scroll target until the scroll moves on. */
  private detour?: { param: number; base: number };
  private followX?: number;
  private scrollTarget = 0;
  /** A building visit: walk to the door, go inside while the panel is open, come back out. */
  private visit?: { id: string; phase: 'approach' | 'inside' | 'leaving'; arrived?: () => void; deadline: number };
  /** Hovered card the adventurer hops onto and sits on. */
  private seat?: { element: HTMLElement | null; phase: 'hop' | 'sitting' | 'return'; t: number; fromX: number; fromY: number; x: number; y: number };
  constructor(private readonly options: SceneOptions) {}
  async init(): Promise<void> {
    await this.app.init({resizeTo: this.options.mount, background: '#3a8cf2', antialias: false,
      autoDensity: true, resolution: Math.min(window.devicePixelRatio || 1, 2), roundPixels: true, preference: 'webgl'});
    this.initialized = true;
    if (this.destroyed) { this.app.destroy({removeView: true}, {children: true}); return; }
    const canvas = this.app.canvas;
    canvas.setAttribute('aria-label', 'Mundo del portfolio. Flechas para caminar, espacio para saltar, E para abrir la puerta y flecha abajo para bajar de una plataforma.');
    canvas.setAttribute('role', 'application'); canvas.tabIndex = 0; canvas.dataset.testid = 'world-canvas';
    this.options.mount.appendChild(canvas);
    this.app.stage.addChild(this.background, this.clouds, this.world);
    this.world.sortableChildren = true;
    const textures = await this.loadTextures();
    if (this.destroyed) return;
    this.createBackground(textures); this.createWorld(textures);
    if (!this.layout) this.setLayout(buildWorldLayout({width: this.app.screen.width, height: this.app.screen.height}));
    else { this.vertical?.build(this.layout); this.ambience?.build(this.layout); this.ambienceBuilt = true; }
    if (this.layout) this.slimeFloors = slimeFloors(this.layout, (x) => this.island?.groundYAt(x) ?? ISLAND_FLOOR);
    window.addEventListener('pointermove', (event) => {
      this.cursor = event.pointerType === 'mouse' ? {x: event.clientX, y: event.clientY} : undefined;
    }, {signal: this.abort.signal, passive: true});
    document.documentElement.addEventListener('pointerleave', () => { this.cursor = undefined; }, {signal: this.abort.signal});
    this.layoutScreen();
    this.input = bindDestinationInput(this.app, this.world, (x, y, type) => {
      if (!this.journey.entered) return;
      if (this.mode === 'physics') {
        this.moveTo(x);
        if (y < this.player.y - 70) this.jump();
        this.showMarker(this.player.targetX, y, type !== 'mouse');
      } else if (this.traveler && this.layout && Math.abs(y - this.traveler.y) < 180) {
        const param = paramAtX(this.layout, this.traveler.param, x);
        this.detour = {param, base: this.scrollTarget};
        const point = pathPoint(this.layout, param);
        this.showMarker(point.x, point.y - 20, type !== 'mouse');
      }
      canvas.focus({preventScroll: true});
    });
    canvas.addEventListener('keydown', this.handleKeyboard, {signal: this.abort.signal});
    this.observer = new ResizeObserver(() => this.layoutScreen()); this.observer.observe(this.options.mount);
    this.motionPreference.addEventListener('change', this.handleMotionPreference, {signal: this.abort.signal});
    document.addEventListener('visibilitychange', this.handleVisibility, {signal: this.abort.signal});
    this.app.ticker.add(this.tick); this.app.ticker.maxFPS = 60;
    window.__TERRARIA_DEBUG__ = {ready: true, player: this.player, setDestination: (x) => this.moveTo(x),
      viewport: () => ({width: this.app.screen.width, height: this.app.screen.height}),
      animationFrame: () => this.animator?.sprite.currentFrame ?? 0, jump: () => this.jump(), toggleDoor: () => this.toggleDoor(),
      geometry: () => ({tiles: this.island?.tileCount ?? 0, platforms: this.platforms.length,
        solids: this.solids.length, doorOpen: this.doorOpen,
        door: this.house?.doorBounds ?? {x1:0,x2:0,y1:0,y2:0}, upperFloorY: this.house?.platforms[1]?.y ?? 304,
        groundY: ISLAND_FLOOR, house: {left:this.house?.left ?? 0,right:this.house?.right ?? 0}}),
      toScreen: (x,y) => ({x: this.world.x+x*this.world.scale.x,y:this.world.y+y*this.world.scale.y}),
      traveler: () => ({mode: this.mode, segment: this.traveler?.mode ?? 'walk', param: this.traveler?.param ?? 0, target: this.scrollTarget,
        x: this.player.x, y: this.player.y, animation: this.animator?.state ?? 'idle', visible: this.animator?.sprite.visible ?? false}),
      camera: () => ({x: -this.world.x / this.world.scale.x, y: -this.world.y / this.world.scale.y, scale: this.world.scale.x})};
    this.options.onStatus('Mundo listo. Scrolleá para descender; clic para caminar y espacio para saltar en la isla.');
  }
  /** The App measures the HTML content and owns the layout; the scene follows it. */
  setLayout(layout: WorldLayout): void {
    const rebuild = this.layout?.surfaceY !== layout.surfaceY || this.layout?.bounds.bottom !== layout.bounds.bottom || this.layout?.scale !== layout.scale;
    this.layout = layout;
    this.vertical?.build(layout);
    if (rebuild || !this.ambienceBuilt) { this.ambience?.build(layout); this.ambienceBuilt = Boolean(this.ambience); }
    this.slimeFloors = slimeFloors(layout, (x) => this.island?.groundYAt(x) ?? ISLAND_FLOOR);
    if (this.traveler) placeTraveler(this.traveler, layout, this.traveler.param);
    else this.traveler = createTraveler(layout);
    if (this.mode === 'path') placeTraveler(this.traveler, layout, targetParam(layout, this.currentScroll()));
  }
  private async loadTextures(): Promise<Record<string, Texture>> {
    const paths = [...new Set([ASSETS.sky, ASSETS.mountainsFar, ASSETS.mountainsMid, ASSETS.forest, ASSETS.touchTarget,
      ...ASSETS.clouds, ...[1,2,4].map(i => `/assets/scene-v2/distant-island-${i}.png`), ...Object.values(ASSETS.adventurer).flat(),
      ...ISLAND_ASSET_PATHS, ...HOUSE_ASSET_PATHS, ...NATURE_ASSET_PATHS, ...VERTICAL_ASSET_PATHS, ...TORCH_FRAMES])];
    const loaded = await Assets.load(paths) as Record<string, Texture>;
    for (const texture of Object.values(loaded)) texture.source.scaleMode = 'nearest';
    return loaded;
  }
  private createBackground(textures: Record<string, Texture>): void {
    const sky = new TilingSprite({ texture: textures[ASSETS.sky], width: 1, height: 1 });
    sky.label = 'sky';
    sky.tileScale.set(2);
    this.background.addChild(sky);
    // The night sky fades in over the day sky as the cycle turns.
    const night = new TilingSprite({ texture: textures[TILES['sky-night'].path], width: 1, height: 1 });
    night.label = 'sky-night';
    night.alpha = 0;
    this.background.addChild(night);

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
      Object.assign(sprite, { baseX: item.x, speed: 2.2 + index * 0.55, baseY: item.y, phase: index * 1.73 });
      this.cloudSprites.push(sprite);
      this.clouds.addChild(sprite);
    });
  }

  private createWorld(textures: Record<string, Texture>): void {
    this.island = new TileIsland(textures); this.island.container.zIndex = 10;
    this.house = new ModularHouse(textures, {x: 500, groundY: ISLAND_FLOOR, scale: 2, onDoor: () => this.toggleDoor()});
    this.house.container.zIndex = 20;
    this.nature = new ModularNature(textures, {reducedMotion: this.reducedMotion,groundYAt:this.island.groundYAt}); this.nature.container.zIndex = 30;
    this.vertical = new VerticalWorld(textures, (id) => this.options.onProject?.(id)); this.vertical.container.zIndex = 5;
    this.world.addChild(this.vertical.container, this.island.container, this.house.container, this.nature.container);
    this.ambience = new Ambience(this.app.renderer, TORCH_FRAMES.map((path) => textures[path]));
    this.ambience.world.zIndex = 90;
    this.world.addChild(this.ambience.world);
    this.app.stage.addChild(this.ambience.screen);
    this.slime = new Slime();
    this.slime.attach(this.world, 95);
    const animationTextures = Object.fromEntries([
      ...Object.entries(ASSETS.adventurer).map(([state, paths]) => [state, paths.map(path => textures[path])]),
      ['climb', CHARACTER_FRAMES.climb.map(path => textures[path])],
      ['sit', CHARACTER_FRAMES.sit.map(path => textures[path])],
    ]) as AnimationTextures;
    this.animator = new PlayerAnimator(animationTextures); this.animator.setReducedMotion(this.reducedMotion);
    this.animator.sprite.zIndex = 100; this.world.addChild(this.animator.sprite);
    this.umbrella = new Sprite(textures[UMBRELLA.path]); this.umbrella.anchor.set(.42, 1); this.umbrella.scale.set(.95);
    this.umbrella.visible = false; this.umbrella.zIndex = 101; this.umbrella.label = 'umbrella'; this.world.addChild(this.umbrella);
    this.marker = new Sprite(textures[ASSETS.touchTarget]); this.marker.anchor.set(.5); this.marker.visible = false;
    this.marker.zIndex = 110; this.world.addChild(this.marker);
    if (new URLSearchParams(location.search).get('debug') === '1') {
      this.collisionOverlay = new Graphics(); this.collisionOverlay.zIndex = 200; this.world.addChild(this.collisionOverlay);
    }
  }
  private get platforms() { return [...(this.island?.platforms ?? []), ...(this.house?.platforms ?? [])]; }
  private get solids() { return [...(this.island?.solids ?? []), ...(this.house?.solids ?? [])]; }
  moveTo(x: number): void { setDestination(this.player, x, BOUNDS); }
  jump(): void { if (this.journey.entered && this.mode === 'physics') requestJump(this.player, 580); }
  toggleDoor(): void {
    if (!this.journey.entered || !this.house || this.mode !== 'physics') return;
    const door = this.house.doorBounds;
    if (this.doorOpen && this.player.x+15>door.x1 && this.player.x-15<door.x2 && this.player.y>door.y1 && this.player.y-64<door.y2) {
      this.options.onStatus('Pasá el umbral antes de cerrar la puerta.'); return;
    }
    this.doorOpen = !this.doorOpen; this.house.setDoorOpen(this.doorOpen);
    this.options.onStatus(this.doorOpen ? 'Puerta abierta. Ya podés entrar a la casa.' : 'Puerta cerrada.');
  }
  drop(): void {
    if (this.mode !== 'physics' || !this.player.grounded) return;
    // Timber floors are one-way; solid terrain below still blocks the descent.
    const ground = this.island?.groundYAt(this.player.x) ?? ISLAND_FLOOR;
    if (this.player.y >= Math.min(ground, ISLAND_FLOOR) - 1) return;
    this.player.y += 3; this.player.grounded = false; this.player.vy = 20;
  }
  private showMarker(x: number, y: number, persistent: boolean): void {
    if (!this.marker) return;
    this.marker.position.set(x,y); this.marker.visible = true; this.marker.alpha = persistent ? .9 : .6; this.markerAge = 0;
  }
  private currentScroll(): number {
    return this.journey.entered ? Math.max(0, window.scrollY) : 0;
  }
  private layoutScreen(): void {
    const width = this.app.screen.width;
    const height = this.app.screen.height;
    if (!width || !height) return;
    const sky = this.background.getChildByLabel('sky') as TilingSprite | null;
    if (sky) {
      sky.width = width; sky.height = height;
      // Repeat across the horizon, while preserving one continuous sky gradient.
      sky.tileScale.y = height / sky.texture.height;
    }
    const night = this.background.getChildByLabel('sky-night') as TilingSprite | null;
    if (night) {
      night.width = width; night.height = height;
      night.tileScale.set(Math.max(1, height / night.texture.height));
    }
    for (const child of this.background.children) {
      if (!(child instanceof TilingSprite) || child === sky || child === night) continue;
      child.width = width;
    }
    this.positionCamera(true);
  }

  private positionCamera(force = false): void {
    const layout = this.layout;
    if (!layout) return;
    const {width, height} = this.app.screen;
    const s = this.currentScroll();
    const scale = layout.scale;
    const camera = cameraAt(layout, s);
    this.world.scale.set(scale);
    let worldX = -camera.x * scale;
    if (layout.mobile) {
      // On a phone the island is wider than the screen: follow the player there,
      // then hand over to the scripted camera as the descent begins.
      const follow = Math.min(10, Math.max(width - ISLAND.width * scale - 10, width * .45 - this.player.x * scale));
      this.followX = force || this.followX === undefined || this.reducedMotion ? follow : this.followX + (follow - this.followX) * .075;
      const handover = smoothstep(0, Math.max(1, layout.pan.start * .5), s);
      worldX = this.followX + (worldX - this.followX) * handover;
    }
    this.world.x = worldX;
    this.world.y = -camera.y * scale;
    this.vertical?.update(camera.x, camera.y, force ? 0 : Math.min(.1, this.app.ticker.deltaMS / 1000), this.reducedMotion);

    for (const child of this.background.children) {
      if (child instanceof TilingSprite && !child.label.startsWith('sky')) {
        const factor = child.label === 'forest-horizon' ? .08 : child.label === 'mountains-mid' ? .045 : .02;
        child.tilePosition.x = this.world.x * factor;
      }
    }
    // The sky stays put; horizons rise to meet the surface, then sink with the world.
    const descent = (camera.y - layout.camera[0].y) * scale;
    const toSurface = Math.max(1, (layout.pan.cameraY - layout.camera[0].y) * scale);
    const horizonLift = descent <= toSurface ? height * .2 * descent / toSurface : height * .2 + (descent - toSurface);
    for (const child of this.background.children) {
      if (!(child instanceof TilingSprite) || child.label.startsWith('sky')) continue;
      const bottom = (child as TilingSprite & { layerBottom?: number }).layerBottom ?? 0;
      child.y = height - child.height + bottom - horizonLift;
    }
    const cloudLift = descent <= toSurface ? descent * .35 : toSurface * .35 + (descent - toSurface);
    this.clouds.y = -cloudLift;
    for (const island of this.distantSprites) {
      const data = island as Sprite & {baseX:number; baseY:number};
      island.position.set(width * data.baseX + this.world.x * .07, height * data.baseY);
    }
  }
  private tick = () => {
    const dt = Math.min(.15, this.app.ticker.deltaMS / 1000);
    this.house?.update(dt, this.reducedMotion); this.nature?.update(dt, this.reducedMotion);
    this.updatePlayer(dt);
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
    this.updateAmbience(dt);
    if (this.collisionOverlay) {
      const g = this.collisionOverlay; g.clear();
      for (const p of this.platforms) g.moveTo(p.x1,p.y).lineTo(p.x2,p.y).stroke({color:0x44ffbb,width:1});
      for (const s of this.solids) g.rect(s.x1,s.y1,s.x2-s.x1,s.y2-s.y1).stroke({color:0xff8050,width:1});
      g.rect(this.player.x-15,this.player.y-64,30,64).stroke({color:0xffffff,width:1});
    }
  };

  private updateAmbience(dt: number): void {
    const layout = this.layout;
    const ambience = this.ambience;
    if (!layout || !ambience) return;
    const scale = this.world.scale.x;
    const view = {x: -this.world.x / scale, y: -this.world.y / scale, width: this.app.screen.width / scale, height: this.app.screen.height / scale};
    const surfaceScreenY = this.world.y + layout.surfaceY * scale;
    ambience.update(dt, view, this.app.screen, surfaceScreenY, this.reducedMotion);
    if (this.slime) {
      // The slime lives on whichever floor sits in the lower part of the view.
      const floor = this.slimeFloors
        .filter((item) => item.x2 > view.x + 40 && item.x1 < view.x + view.width - 40)
        .map((item) => ({item, y: item.y(Math.min(item.x2, Math.max(item.x1, view.x + view.width / 2)))}))
        .filter(({y}) => y > view.y + view.height * .2 && y < view.y + view.height * .97)
        .sort((a, b) => Math.abs(a.y - (view.y + view.height * .7)) - Math.abs(b.y - (view.y + view.height * .7)))[0]?.item;
      this.slime.setFloor(this.journey.entered ? floor : undefined, view);
      const rect = this.app.canvas.getBoundingClientRect();
      const cursorX = this.cursor ? (this.cursor.x - rect.left - this.world.x) / scale : undefined;
      this.slime.update(dt, cursorX, this.reducedMotion);
    }
    // Everything under the open sky shares one light: day, night and rain.
    const night = 1 - ambience.daylight;
    const outdoor = mixColor(mixColor(0xffffff, 0x5a6aa0, night * .72), 0x8996a8, ambience.rainIntensity * .3);
    for (const target of [this.island?.container, this.house?.container, this.nature?.container, this.vertical?.surface, this.clouds]) {
      if (target) target.tint = outdoor;
    }
    for (const child of this.background.children) {
      if (child instanceof TilingSprite && child.label === 'sky-night') child.alpha = night;
      else if (child instanceof TilingSprite && child.label !== 'sky') child.tint = mixColor(0x8cb7d5, 0x3b4a78, night * .8);
    }
    const sprite = this.animator?.sprite;
    if (sprite) {
      const aboveGround = this.player.y < layout.surfaceY + 40;
      sprite.tint = aboveGround ? mixColor(0xffffff, 0x8090c0, night * .6) : 0xffffff;
      if (this.umbrella) this.umbrella.tint = sprite.tint;
    }
  }

  private updatePlayer(dt: number): void {
    const layout = this.layout;
    const traveler = this.traveler;
    if (!layout || !traveler || !this.animator) return;
    const target = this.journey.entered ? targetParam(layout, this.currentScroll()) : 0;
    this.scrollTarget = target;
    if (this.detour && Math.abs(target - this.detour.base) > 4) this.detour = undefined;

    if (this.seat && this.updateSeat(dt)) return;

    if (this.mode === 'physics' && target > 1 && !this.journey.hidden) this.leaveIsland();
    else if (this.mode === 'path' && target <= 0.5 && traveler.param <= 0.5 && !this.detour) this.enterIsland();

    if (this.mode === 'physics') {
      if (this.journey.entered) stepPlayer(this.player, dt, {...BOUNDS, platforms: this.platforms, solids: this.solids, groundYAt:this.island?.groundYAt, useGroundProfile:true, jumpZones:[1250,1490], playerHeight: 64, playerHalfWidth: 15});
      if (this.player.y > 1080) Object.assign(this.player, createPlayerState({x: 440,y: ISLAND_FLOOR}));
      this.animator.setPaused(false);
      this.animator.setState(this.player.motion, this.player.facing);
      this.setSpritePosition(this.player.x, this.player.y + 6.6, this.player.facing);
      if (this.umbrella) this.umbrella.visible = false;
    } else {
      const camera = cameraAt(layout, this.currentScroll());
      const view = {left: camera.x, top: camera.y, width: layout.view.width, height: layout.view.height};
      if (this.journey.hidden) placeTraveler(traveler, layout, target);
      else stepTraveler(traveler, layout, this.detour?.param ?? target, dt, view);
      this.player.x = traveler.x; this.player.y = traveler.y;
      const moving = Math.abs(traveler.speed) > 4;
      let state: AnimationState;
      if (traveler.mode === 'climb') state = 'climb';
      else if (traveler.mode === 'fall') state = 'fall';
      else state = !moving ? 'idle' : Math.abs(traveler.speed) > 125 ? 'run' : 'walk';
      this.animator.setPaused(state === 'climb' && !moving);
      const facing = traveler.mode === 'climb' ? 1 : traveler.facing;
      this.animator.setState(state, facing);
      const x = traveler.mode === 'climb' ? traveler.x - CLIMB_ROPE_OFFSET : traveler.x;
      this.setSpritePosition(x, traveler.y + 6.6, facing);
      if (this.umbrella) {
        this.umbrella.visible = traveler.mode === 'fall' && !this.journey.hidden;
        this.umbrella.position.set(Math.round(traveler.x + 6 * facing), Math.round(traveler.y - 58));
        this.umbrella.scale.x = .95 * facing;
      }
    }
    this.updateVisit();
    if (this.pendingArrivalBurst && !this.journey.hidden) {
      this.pendingArrivalBurst = false;
      this.ambience?.burst(this.animator.sprite.x, this.animator.sprite.y, this.reducedMotion);
    }
    this.animator.sprite.visible = !this.journey.hidden && this.visit?.phase !== 'inside';
    if (this.umbrella && this.visit?.phase === 'inside') this.umbrella.visible = false;
    this.animator.update(this.app.ticker);
  }

  /** Hop onto a hovered card (or back down when it is left); returns true while it owns the sprite. */
  sitOn(element: HTMLElement | null): void {
    if (!this.animator || !this.journey.entered || this.journey.hidden || this.visit) return;
    const sprite = this.animator.sprite;
    if (element) {
      if (this.seat?.element === element) return;
      this.seat = {element, phase: this.reducedMotion ? 'sitting' : 'hop', t: 0, fromX: sprite.x, fromY: sprite.y, x: sprite.x, y: sprite.y};
    } else if (this.seat && this.seat.element) {
      this.seat = {...this.seat, element: null, phase: 'return', t: this.reducedMotion ? 1 : 0, fromX: sprite.x, fromY: sprite.y};
    }
  }

  private updateSeat(dt: number): boolean {
    const seat = this.seat;
    const animator = this.animator;
    if (!seat || !animator) return false;
    const scale = this.world.scale.x;
    if (seat.element) {
      const rect = seat.element.getBoundingClientRect();
      const offscreen = !seat.element.isConnected || rect.bottom < 0 || rect.top > this.app.screen.height || rect.right < 0 || rect.left > this.app.screen.width;
      if (offscreen) { this.sitOn(null); return true; }
      // Sit on the top edge, near the right corner so the title stays readable.
      seat.x = (rect.right - Math.min(56, rect.width * .2) - this.world.x) / scale;
      seat.y = (rect.top + 3 - this.world.y) / scale;
    } else {
      // Back to wherever the journey left the adventurer.
      seat.x = this.player.x; seat.y = this.player.y + 6.6;
    }
    const facing: -1 | 1 = seat.x >= seat.fromX ? 1 : -1;
    if (seat.phase === 'sitting') {
      animator.setPaused(false);
      animator.setState('sit', -1);
      this.setSpritePosition(seat.x, seat.y, -1);
    } else {
      seat.t = Math.min(1, seat.t + dt / .42);
      const arc = Math.sin(Math.PI * seat.t) * 70;
      const x = seat.fromX + (seat.x - seat.fromX) * seat.t;
      const y = seat.fromY + (seat.y - seat.fromY) * seat.t - arc;
      animator.setPaused(false);
      animator.setState(seat.t < .5 ? 'jump' : 'fall', facing);
      this.setSpritePosition(x, y, facing);
      if (seat.t >= 1) {
        if (seat.phase === 'hop') seat.phase = 'sitting';
        else { this.seat = undefined; return false; }
      }
    }
    if (this.umbrella) this.umbrella.visible = false;
    animator.sprite.visible = !this.journey.hidden;
    animator.update(this.app.ticker);
    return true;
  }

  private setSpritePosition(x: number, y: number, facing: -1 | 1): void {
    if (!this.animator) return;
    this.animator.sprite.scale.set(facing * PLAYER_SCALE, PLAYER_SCALE);
    this.animator.sprite.position.set(Math.round(x), Math.round(y));
  }

  private leaveIsland(): void {
    if (!this.layout || !this.traveler) return;
    this.mode = 'path';
    const ground = this.island?.groundYAt(this.player.x) ?? Infinity;
    const onWestSlope = this.player.grounded && this.player.x <= ISLAND.restX && this.player.x >= 104 && Math.abs(this.player.y - ground) < 4;
    // From the western slope the walk continues naturally; anywhere else the
    // adventurer starts again from the island rest point.
    placeTraveler(this.traveler, this.layout, onWestSlope ? ISLAND.restX - this.player.x : 0);
  }

  private enterIsland(): void {
    this.mode = 'physics';
    Object.assign(this.player, createPlayerState({x: ISLAND.restX, y: this.island?.groundYAt(ISLAND.restX) ?? ISLAND_FLOOR}));
  }

  private handleKeyboard = (event: KeyboardEvent): void => {
    if (!this.journey.entered) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      const step = event.key === 'ArrowLeft' ? -180 : 180;
      if (this.mode === 'physics') this.moveTo(this.player.x + step);
      else if (this.layout && this.traveler) this.detour = {param: paramAtX(this.layout, this.traveler.param, this.traveler.x + step), base: this.scrollTarget};
    } else if (event.code === 'Space') { event.preventDefault(); if (!event.repeat) this.jump(); }
    else if (event.key.toLowerCase() === 'e') { event.preventDefault(); if (!event.repeat) this.toggleDoor(); }
    else if (event.key === 'ArrowDown') { event.preventDefault(); this.drop(); }
  };
  private handleMotionPreference = (event: MediaQueryListEvent) => {
    this.reducedMotion = event.matches; this.animator?.setReducedMotion(event.matches);
  };
  private handleVisibility = () => { if (document.hidden) this.app.ticker.stop(); else this.app.ticker.start(); };
  setJourney(view: JourneyView): void {
    if (view.hidden && this.seat) this.seat = undefined;
    // Magic mirror: sparkles where the adventurer vanishes and where it reappears.
    if (view.hidden !== this.journey.hidden && this.animator) {
      const sprite = this.animator.sprite;
      if (view.hidden) this.ambience?.burst(sprite.x, sprite.y, this.reducedMotion);
      else this.pendingArrivalBurst = true;
    }
    this.journey = view;
  }
  activateProject(id: string, arrived: () => void): void {
    this.seat = undefined;
    const building = this.layout?.buildings.find((item) => item.id === id);
    if (!building?.door || !this.layout || !this.traveler) { arrived(); return; }
    // From the island the village is far away: just show the panel.
    if (this.mode === 'physics') { arrived(); return; }
    this.vertical?.setDoorOpen(id, true);
    if (this.reducedMotion) {
      this.visit = {id, phase: 'inside', deadline: 0};
      arrived();
      return;
    }
    const doorX = (building.door.x1 + building.door.x2) / 2;
    this.detour = {param: paramOnSurface(this.layout, doorX), base: this.scrollTarget};
    this.visit = {id, phase: 'approach', arrived, deadline: performance.now() + 2600};
  }
  closeProject(): void {
    const visit = this.visit;
    if (!visit) return;
    if (this.reducedMotion) {
      this.vertical?.setDoorOpen(visit.id, false);
      this.visit = undefined; this.detour = undefined;
      return;
    }
    // Step back out, then shut the door behind.
    visit.phase = 'leaving';
    visit.deadline = performance.now() + 420;
  }
  projectOrigin(id: string): {x: number; y: number} | undefined {
    const door = this.layout?.buildings.find((item) => item.id === id)?.door;
    if (!door) return undefined;
    const {width, height} = this.app.screen;
    const x = this.world.x + (door.x1 + door.x2) / 2 * this.world.scale.x;
    const y = this.world.y + (door.y1 + door.y2) / 2 * this.world.scale.y;
    return {x: Math.min(width, Math.max(0, x)), y: Math.min(height, Math.max(0, y))};
  }
  private updateVisit(): void {
    const visit = this.visit;
    if (!visit || !this.traveler) return;
    const now = performance.now();
    if (visit.phase === 'approach') {
      const reached = this.detour && Math.abs(this.traveler.param - this.detour.param) < 1.5;
      if (reached || now > visit.deadline) {
        visit.phase = 'inside';
        visit.arrived?.();
      }
    } else if (visit.phase === 'leaving' && now > visit.deadline) {
      this.vertical?.setDoorOpen(visit.id, false);
      this.visit = undefined;
      this.detour = undefined;
    }
  }
  destroy(): void {
    this.destroyed = true; this.abort.abort(); this.input?.destroy(); this.observer?.disconnect();
    if (window.__TERRARIA_DEBUG__?.player === this.player) delete window.__TERRARIA_DEBUG__;
    for (const entity of [this.nature, this.house, this.island, this.vertical]) { entity?.container.removeFromParent(); entity?.destroy(); }
    this.ambience?.destroy();
    this.slime?.destroy();
    this.derivedTextures.forEach(texture => texture.destroy(false));
    if (this.initialized) { this.app.ticker.remove(this.tick); this.app.destroy({removeView: true}, {children: true,texture:false,textureSource:false}); }
  }
}

/** Floors the slime can live on: the island's west meadow, the village, each chamber. */
function slimeFloors(layout: WorldLayout, islandGround: (x: number) => number): SlimeFloor[] {
  return [
    {x1: 120, x2: 470, y: islandGround},
    {x1: layout.bounds.x1 + 300, x2: layout.shaft.x - 30, y: () => layout.surfaceY},
    ...layout.chambers.map((chamber) => ({x1: chamber.walk[0], x2: chamber.walk[1], y: () => chamber.floorY})),
  ];
}

function mixColor(from: number, to: number, amount: number): number {
  const t = Math.min(1, Math.max(0, amount));
  const channel = (shift: number) => Math.round(((from >> shift) & 255) + (((to >> shift) & 255) - ((from >> shift) & 255)) * t);
  return (channel(16) << 16) | (channel(8) << 8) | channel(0);
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}
