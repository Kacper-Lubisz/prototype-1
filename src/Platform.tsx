import {Zone} from "./Zone";
import {mat4} from "gl-matrix";
import {Stack} from "./Stack";
import {Tray} from "./Tray";

export class Platform {
  parentZone?: Zone;
  
  stacks: Stack[];
  label: string;
  type: string;
  isLateral: boolean;
  
  platformSpaceMatrix: mat4;
  
  platformUp?: Platform;
  platformDown?: Platform;
  platformLeft?: Platform;
  platformRight?: Platform;
  
  constructor(stacks: Stack[], label: string, type: string, isLateral: boolean, platformSpaceMatrix: mat4) {
    this.stacks = stacks;
    this.label = label;
    this.isLateral = isLateral;
    this.type = type;
    
    this.platformSpaceMatrix = platformSpaceMatrix;
    
    stacks.forEach(stack => stack.parentPlatform = this)
  }
  
  get trays(): Tray[] {
    return this.stacks.flatMap(stack => stack.trays)
  }
  
  public toString(): String {
    return this.label;
  }
  
}