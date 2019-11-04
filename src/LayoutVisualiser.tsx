import React from "react";
import {Button, Table} from "react-bootstrap";
import {Zone} from "./Zone";
import {Warehouse} from "./Warehouse";
import {Platform} from "./Platform";

interface LayoutVisualiserProps {
  warehouse: Warehouse
}

interface LayoutVisualiserState {
  currentZone: Zone,
  currentPlatform: Platform
  maxPlatformHeight: number,
  currentZoneIndex: number,
  currentPlatformIndex: number
}

export class LayoutVisualiser extends React.Component<LayoutVisualiserProps, LayoutVisualiserState> {
  
  // constructor(props: LayoutVisualiserProps) {
  //   super(props);
  // }
  
  changeLocation(zone: number, platform: number) {
    const currentZone = this.props.warehouse.zones[zone];
    const currentPlatform = currentZone.platforms[platform];
    const maxPlatformHeight = currentPlatform.stacks
      .map((stack) => stack.trays.length)
      .reduce((pre, cur) =>
        Math.max(pre, cur)
      );
    
    this.setState({
      currentZone: currentZone,
      currentPlatform: currentPlatform,
      currentZoneIndex: zone,
      currentPlatformIndex: platform,
      maxPlatformHeight: maxPlatformHeight
    })
  }
  
  componentDidMount(): void {
    this.changeLocation(0, 0)
  }
  
  render() {
    
    if (this.state !== null) {
      
      return <div>
        
        <h1>Zone <Button onClick={() => {
          this.changeLocation(this.state.currentZoneIndex - 1, 0)
        }}>←</Button>
          {this.state.currentZone.toString()}
          <Button onClick={() => {
            this.changeLocation(this.state.currentZoneIndex + 1, 0)
          }}>→</Button>
        </h1>
        
        <h1>{this.state.currentPlatform.type} <Button onClick={() => {
          this.changeLocation(this.state.currentZoneIndex, this.state.currentPlatformIndex - 1)
        }}>{
          this.state.currentPlatform.isLateral ? "←" : "↓"
        }</Button>
          {this.state.currentPlatform.toString()}
          <Button onClick={() => {
            this.changeLocation(this.state.currentZoneIndex, this.state.currentPlatformIndex + 1)
          }}>{
            this.state.currentPlatform.isLateral ? "→" : "↑"
          }</Button>
        </h1>
        
        <Table bordered hover>
          <tbody>
          {Array(this.state.maxPlatformHeight).fill(0).map((_, r) => {
            return <tr key={r}>
              {Array(this.state.currentPlatform.stacks.length).fill(0).map((_, c) => {
                return <td key={c}>
                  {
                    this.name(c, r)
                  }
                </td>
              })}
            </tr>
          })}
          </tbody>
        </Table>
      </div>;
      
    } else {
      return <div>loading</div>
    }
  }
  
  private name(c: number, r: number) {
    const trays = this.state.currentPlatform.stacks[c].trays;
    const index: number = this.state.maxPlatformHeight - 1 - r;
    
    if (trays.length > index && index >= 0) {
      const tray = trays[index];
      let string;
      if (tray.expiry !== undefined) {
        string = tray.expiry.label
      } else {
        string = ""
      }
      return `${string} ${tray.category} ${tray.weight}kg`
    } else {
      return "-"
    }
  }
}