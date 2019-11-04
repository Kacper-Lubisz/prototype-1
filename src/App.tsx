import React, {Component} from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import {Button, Container, Jumbotron} from "react-bootstrap";
import {mat4} from "gl-matrix";
import {View3D} from "./View3D";
import {Warehouse} from "./Warehouse";
import {Zone} from "./Zone";
import {Platform} from "./Platform";
import {Stack} from "./Stack";
import {Tray} from "./Tray";

interface AppState {
  warehouse: Warehouse;
  focus: Platform | "plan" | "circle"
}

class App extends Component<any, AppState> {
  constructor(props: Object) {
    super(props);
    
    const warehouse = this.loadWarehouse();
    
    this.state = {
      warehouse: warehouse,
      focus: warehouse.platforms[0]
    }
  }
  
  render() {
    return (
      <div>
        <link
          rel="stylesheet"
          href="https://maxcdn.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css"
          integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T"
          crossOrigin="anonymous"
        />
        <Jumbotron>
          <h1>
            Stock Management Prototype
          </h1>
          <p>
            This is a simple prototype! It's in part to demonstrate how React works and as an experiment
            <span role="img" aria-label="Wink Emoji">😉</span>
          </p>
        </Jumbotron>
        <Container>
          <View3D focus={this.state.focus} warehouse={this.state.warehouse}/>
          <br/>
          <Button onClick={() => {
            this.setFocus("circle")
          }}>Circle</Button>
          
          <Button onClick={() => {
            this.setFocus("plan")
          }}>Plan</Button>
          
          <Button onClick={() => {
            this.setFocus(this.state.warehouse.platforms[0])
          }}>First Platform</Button>
          
          {/*{this.state &&*/}
          {/*<LayoutVisualiser warehouse={this.state.warehouse}/>*/}
          {/*}*/}
        </Container>
      </div>
    );
  }
  
  /**
   * Sets the focus of the camera in the View3D
   * @see View3D
   * @param focus The thing to focus on
   */
  setFocus(focus: "circle" | Platform | "plan") {
    this.setState(Object.assign(
      this.state,
      {focus: focus}
    ))
  }
  
  
  /**
   * Loads the warehouse
   * // TODO this currently generates a default warehouse, should load from backend.
   */
  loadWarehouse(): Warehouse {
    
    const gen = (n: Number) => [...(function* () {
      let i = 0;
      while (i < n) yield i++
    })()];
    
    const zones: Zone[] = ["White", "Yellow", "Green", "Blue"].map((color, zoneIndex) => {
      const zoneSpaceTransform: mat4 = mat4.create();
      mat4.translate(zoneSpaceTransform, zoneSpaceTransform, [0, 0, Math.floor(zoneIndex) + Math.floor(zoneIndex / 2)]);
      if (zoneIndex % 2 === 0) {
        mat4.rotateY(zoneSpaceTransform, zoneSpaceTransform, Math.PI);
        mat4.translate(zoneSpaceTransform, zoneSpaceTransform, [-14, 0, 0]);
      }
      
      const platforms: Platform[] = gen(5).flatMap((column) =>
        gen(5).map((row) => {
          
          // from zoneSpace
          const platformSpaceTransform: mat4 = mat4.create();
          mat4.translate(platformSpaceTransform, platformSpaceTransform, [3 * row, 1.2 * column, 0]);
          mat4.multiply(platformSpaceTransform, zoneSpaceTransform, platformSpaceTransform);
          
          const stacks: Stack[] = gen(4).map((stack) => {
            const trays = gen(3).map(tray => {
              const trayMatrix = mat4.create();
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
          
          return new Platform(
            stacks,
            String.fromCharCode(row + 65) + (column + 1),
            "Shelf",
            false,
            platformSpaceTransform
          );
        })
      );
      return new Zone(color, platforms);
      
    });
    
    return new Warehouse(zones);
    
  }
  
}

export default App;
