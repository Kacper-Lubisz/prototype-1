import {Zone} from "./Zone";
import {Platform} from "./Platform";
import {Tray} from "./Tray";
import {Stack} from "./Stack";


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
  
}