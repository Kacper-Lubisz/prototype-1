import {Zone} from "./Zone";
import {Platform} from "./Platform";
import {Tray} from "./Tray";
import {Stack} from "./Stack";
import {mat4} from "gl-matrix";


export class Warehouse {
  zones: Zone[];
  
  constructor(zones: Zone[]) {
    this.zones = zones;
  }
  
  get platforms(): Platform[] {
    return this.zones.flatMap(zone => zone.platforms);
  }
  
  get stacks(): Stack[] {
    return this.platforms.flatMap(platform => platform.stacks)
  }
  
  get trays(): Tray[] {
    return this.stacks.flatMap(stack => stack.trays)
  }
  
  static generateDefaultWarehouse(): Warehouse {
    
    const gen = (n: Number) => [...(function* () {
      let i = 0;
      while (i < n) yield i++
    })()];
    //"Yellow", "Green", "Blue"
    const zones: Zone[] = ["White", "Yellow", "Green"].map((color, zoneIndex) => {
      const zoneSpaceTransform: mat4 = mat4.create();
      
      
      if (zoneIndex % 2 === 1) {
        
        mat4.translate(zoneSpaceTransform, zoneSpaceTransform,
          [14 + 2 / 3, 0, Math.floor(zoneIndex) + Math.floor(zoneIndex / 2) + 1]
        );
        mat4.rotateY(zoneSpaceTransform, zoneSpaceTransform, Math.PI)
      } else {
        mat4.translate(zoneSpaceTransform, zoneSpaceTransform, [0, 0, Math.floor(zoneIndex) + Math.floor(zoneIndex / 2)]);
      }
      
      const platformsRows: Platform[][] = gen(5).map((column) => {
        const platformRow = gen(5).map((row) => {
          
          // from zoneSpace
          const platformSpaceTransform: mat4 = mat4.create();
          mat4.multiply(platformSpaceTransform, zoneSpaceTransform, platformSpaceTransform);
          mat4.translate(platformSpaceTransform, platformSpaceTransform, [3 * row, 1.1 * column, 0]);
          
          const stacks: Stack[] = gen(4).map((stack) => {
            const trays = gen(3).map(tray => {
              const trayMatrix = mat4.create();
              // mat4.translate(trayMatrix, trayMatrix, [stack * 2 / 3, tray / 3, 0]);
              mat4.translate(trayMatrix, trayMatrix, [stack * 2 / 3, tray / 3, 0]);
              
              return new Tray(
                trayMatrix,
                ["beans", "pasta", "sauce", "biscuits", "baby food", "fish"][(column * 5 + row) % 6],
                {
                  from: new Date(2022 + row, 0),
                  to: new Date(2023 + row, 0),
                  label: "2022"
                },
                10
              )
            });
            
            return new Stack(trays, 3)
          });
          
          stacks.reduce((previousValue, currentValue) => {
            previousValue.stackRight = currentValue;
            currentValue.stackLeft = previousValue;
            return currentValue;
          });
          
          return new Platform(
            stacks,
            String.fromCharCode(row + 65) + (column + 1),
            "Shelf",
            platformSpaceTransform
          );
        });
        platformRow.reduce((previousValue, currentValue) => {
          previousValue.platformLeft = currentValue;
          currentValue.platformRight = previousValue;
          return currentValue;
        });
        return platformRow;
      });
      
      platformsRows.reduce((previousValue, currentValue) => {
        for (let i: number = 0; i < Math.min(previousValue.length, currentValue.length); i++) {
          previousValue[i].platformUp = currentValue[i];
          currentValue[i].platformDown = previousValue[i];
        }
        
        return currentValue;
      });
      
      const platforms = platformsRows.flat(1);
      return new Zone(color, platforms);
      
    });
    
    return new Warehouse(zones);
    
  }
  
}