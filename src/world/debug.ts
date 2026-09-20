import { Graphics, Text } from 'pixi.js';
import { WORLD } from './config';
import { yOnSurface } from './surfaces';
import type { PlayerState } from './physics';

export class DebugOverlay {
  readonly graphics = new Graphics();
  readonly label = new Text({
    text: '',
    style: {
      fontFamily: 'monospace',
      fontSize: 13,
      fill: '#ffffff',
      stroke: { color: '#000000', width: 4 },
    },
  });

  constructor() {
    this.label.position.set(12, 44);
    this.label.zIndex = 100;
    this.graphics.zIndex = 90;
  }

  draw(player: PlayerState, fps: number): void {
    this.graphics.clear();
    for (const surface of WORLD.surfaces) {
      this.graphics.moveTo(surface.x1, surface.y1).lineTo(surface.x2, surface.y2).stroke({ color: 0x5cff70, width: 3, alpha: 0.9 });
    }
    const targetSurface = WORLD.surfaces.find((surface) => player.targetX >= surface.x1 && player.targetX <= surface.x2) ?? WORLD.surfaces[0];
    const targetY = yOnSurface(targetSurface, player.targetX);
    this.graphics.circle(player.targetX, targetY, 7).stroke({ color: 0xffe44d, width: 2 });
    this.graphics.rect(player.x - 9, player.y - 42, 18, 42).stroke({ color: 0xff4de1, width: 2 });
    this.label.text = `state ${player.motion}\nx ${player.x.toFixed(1)} y ${player.y.toFixed(1)}\nvx ${player.vx.toFixed(1)} vy ${player.vy.toFixed(1)}\nFPS ${fps.toFixed(0)}`;
  }
}
