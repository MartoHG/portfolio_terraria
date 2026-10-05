import { Container, Graphics, Rectangle, Sprite, Texture, TilingSprite } from 'pixi.js';

import caveOutline from './terrain-shape.json';

export const TILE_SIZE = 32;
export const ISLAND_FLOOR = 464;

const TERRAIN = '/assets/scene-v2/terrain-v2.png';
const GARDEN = '/assets/scene-v2/distant-island-1.png';
const BRIDGE = '/assets/scene-v2/bridge-v2.png';

/** Kept as the scene loader contract; the main island is now a single RGBA mass. */
export const ISLAND_ASSET_PATHS = [TERRAIN, GARDEN, BRIDGE, '/assets/modular/interior/lantern.png', '/assets/modular/interior/chest_wood.png'];

export interface IslandPlatform { id: string; x1: number; x2: number; y: number }
export interface IslandSolid { x1: number; x2: number; y1: number; y2: number }

const MAIN_X = 100;
const MAIN_Y = 350;
const MAIN_WIDTH = 1170;
const MAIN_HEIGHT = 390;

export class TileIsland {
  readonly container = new Container();
  readonly platforms: IslandPlatform[] = [];
  readonly solids: IslandSolid[] = [];
  /** Legacy scene metric: number of rendered terrain bodies, not a tile count. */
  readonly tileCount: number;
  private readonly derivedTextures: Texture[] = [];

  constructor(textures: Record<string, Texture>) {
    this.container.sortableChildren = true;

    // The cave is a separate dark interior, beneath the terrain sprite. This
    // keeps the true alpha opening readable without letting the sky show through.
    const caveMask = new Graphics().poly(caveOutline).fill(0xffffff);
    caveMask.label = 'cave-shape';
    const rockTexture = new Texture({source: textures[TERRAIN].source, frame: new Rectangle(720,270,240,200)});
    this.derivedTextures.push(rockTexture);
    const cave = new TilingSprite({texture:rockTexture,width:420,height:145});
    cave.label = 'cave-interior'; cave.position.set(710,495);
    cave.tileScale.set(.6); cave.tint = 0x29333e;
    cave.mask = caveMask;
    this.container.addChild(caveMask,cave);

    const terrain = new Sprite(textures[TERRAIN]);
    terrain.label = 'main-terrain';
    terrain.position.set(MAIN_X, MAIN_Y);
    terrain.width = MAIN_WIDTH;
    terrain.height = MAIN_HEIGHT;
    terrain.roundPixels = true;
    terrain.zIndex = 1;
    this.container.addChild(terrain);

    const glow = new Graphics();
    glow.circle(903,574,40).fill({color:0xffb13a,alpha:.025});
    glow.circle(903,574,27).fill({color:0xffba42,alpha:.045});
    glow.circle(903,574,14).fill({color:0xffd061,alpha:.07});
    glow.zIndex=2; this.container.addChild(glow);
    const lantern=new Sprite(textures['/assets/modular/interior/lantern.png']);
    lantern.anchor.set(.5,0);lantern.position.set(903,555);lantern.scale.set(.72);lantern.zIndex=3;
    this.container.addChild(lantern);
    const chest=new Sprite(textures['/assets/modular/interior/chest_wood.png']);
    chest.anchor.set(.5,1);chest.position.set(848,615);chest.scale.set(.65);chest.zIndex=3;
    this.container.addChild(chest);

    // The exterior follows a continuous measured profile; only suspended
    // structures and the interior chamber are one-way platforms.
    this.platforms.push({id:'cave-floor',x1:748,x2:1084,y:615});
    this.solids.push(
      {x1:718,x2:742,y1:520,y2:615},
      {x1:742,x2:1084,y1:496,y2:522},
      {x1:1084,x2:1110,y1:520,y2:615},
    );

    const bridgeTexture = new Texture({
      source: textures[BRIDGE].source,
      frame: new Rectangle(120, 196, 1933, 358),
    });
    const bridge = new Sprite(bridgeTexture);
    bridge.label = 'bridge';
    bridge.position.set(1258, 437.2);
    bridge.width = 242;
    bridge.height = 44.8;
    bridge.roundPixels = true;
    bridge.zIndex = 2;
    this.container.addChild(bridge);
    this.platforms.push({id: 'bridge', x1: 1280, x2: 1472, y: ISLAND_FLOOR});

    // Reuse the approved distant-island asset as a small independent garden.
    // The source frame is its natural RGBA silhouette; no generated collage or
    // hand-painted masking is needed.
    const gardenTexture = new Texture({
      source: textures[GARDEN].source,
      frame: new Rectangle(385, 330, 677, 464),
    });
    const garden = new Sprite(gardenTexture);
    garden.label = 'garden-islet';
    garden.position.set(1472, 453);
    garden.width = 224;
    garden.height = 153.5;
    garden.roundPixels = true;
    garden.zIndex = 1;
    this.container.addChild(garden);
    this.platforms.push({id: 'garden', x1: 1472, x2: 1696, y: 496});
    this.solids.push({x1: 1472, x2: 1696, y1: 496, y2: 560});

    this.derivedTextures.push(gardenTexture,bridgeTexture);
    // Keep derived texture local to this container's lifetime.
    this.tileCount = 2;
  }

  groundYAt = (x: number): number => {
    if (x >= 500 && x <= 1040) return ISLAND_FLOOR;
    if (x < 104 || x > 1270) return Infinity;
    const profile = [[104,424],[140,415],[180,406],[220,393],[260,394],[300,415],[340,431],
      [380,437],[420,455],[460,455],[500,460],[1040,453],[1060,453],[1100,461],
      [1140,482],[1180,481],[1220,480],[1260,488],[1270,488]];
    for (let i=1;i<profile.length;i++) {
      const [x1,y1]=profile[i-1], [x2,y2]=profile[i];
      if (x<=x2) return y1+(y2-y1)*(x-x1)/(x2-x1);
    }
    return Infinity;
  };

  destroy(): void {
    this.container.destroy({children:true,texture:false,textureSource:false});
    this.derivedTextures.forEach(texture=>texture.destroy(false));
  }
}
