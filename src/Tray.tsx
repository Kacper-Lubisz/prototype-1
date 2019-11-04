import {Stack} from "./Stack";
import {mat4} from "gl-matrix";

interface DateRange {
  from: Date
  to: Date
  label: string
}

export class Tray {
  parentStack?: Stack;
  
  worldSpaceMatrix: mat4;
  
  category?: string;
  expiry?: DateRange;
  weight?: number;
  
  constructor(
    worldSpaceMatrix: mat4,
    category?: string,
    expiry?: DateRange,
    weight?: number
  ) {
    this.worldSpaceMatrix = worldSpaceMatrix;
    
    this.category = category;
    this.expiry = expiry;
    this.weight = weight;
  }
  
  get categoryString(): string {
    if (this.category === undefined) {
      return "Mixed"
    } else {
      return this.category
    }
  }
  
  get weightString(): string {
    if (this.weight === undefined) {
      return "-"
    } else {
      return this.weight + "kg"
    }
  }
  
  get expiryString(): string {
    if (this.expiry === undefined) {
      return "-"
    } else {
      return this.expiry.label
    }
  }
  
}