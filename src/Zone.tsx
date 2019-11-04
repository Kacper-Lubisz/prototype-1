import {Platform} from "./Platform";
import {Stack} from "./Stack";
import {Tray} from "./Tray";

export class Zone {
  platforms: Platform[];
  name: string;
  
  constructor(name: string, platforms: Platform[]) {
    this.name = name;
    this.platforms = platforms;
    
    platforms.forEach(platform => platform.parentZone = this);
  }
  
  get stacks(): Stack[] {
    return this.platforms.flatMap(platform => platform.stacks)
  }
  
  get trays(): Tray[] {
    return this.stacks.flatMap(stack => stack.trays)
  }
  
  public toString() {
    return this.name
  }
  
}