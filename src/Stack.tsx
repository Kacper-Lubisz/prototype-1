import {Platform} from "./Platform";
import {Tray} from "./Tray";

export class Stack {
  parentPlatform?: Platform;
  
  trays: Tray[];
  max_height: number;
  
  stackUp?: Stack;
  stackDown?: Stack;
  stackLeft?: Stack;
  stackRight?: Stack;
  
  constructor(trays: Tray[], max_height: number) {
    this.trays = trays;
    this.max_height = max_height;
    
    trays.forEach(tray => tray.parentStack = this);
  }
}