import React, {Component} from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import {Button, Col, Container, Row} from "react-bootstrap";
import {View3D} from "./View3D";
import {Warehouse} from "./Warehouse";
import {Platform} from "./Platform";

interface AppState {
  warehouse: Warehouse;
  focus: Platform | "plan" | "free"
}

class App extends Component<any, AppState> {
  constructor(props: Object) {
    super(props);
    
    const warehouse = this.loadWarehouse();
    
    this.state = {
      warehouse: warehouse,
      focus: warehouse.platforms[0]
      // focus: "free"
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
        <Container>
          <View3D focus={this.state.focus} warehouse={this.state.warehouse}/>
          <br/>
          <Button onClick={() => {
            this.setFocus("free")
          }}>Free</Button>
          
          <Button onClick={() => {
            this.setFocus("plan")
          }}>Plan</Button>
          
          <Button onClick={() => {
            this.setFocus(this.state.warehouse.platforms[0])
          }}>First Platform</Button>
          
          <h2>Shelf Navigator</h2>
          
          <Row>
            <Col/>
            <Button
              disabled={!(this.state.focus instanceof Platform && this.state.focus.platformUp !== undefined)}
              onClick={() => {
                if (this.state.focus instanceof Platform && this.state.focus.platformUp !== undefined)
                  this.setFocus(this.state.focus.platformUp)
              }}>{"↑"}</Button>
            <Col/>
          </Row>
          <Row>
            <Col><Button
              disabled={!(this.state.focus instanceof Platform && this.state.focus.platformLeft !== undefined)}
              onClick={() => {
                if (this.state.focus instanceof Platform && this.state.focus.platformLeft !== undefined)
                  this.setFocus(this.state.focus.platformLeft)
              }}>{"←"}</Button></Col>
            <Col><h2>{this.state.focus.toString()}</h2></Col>
            <Col><Button
              disabled={!(this.state.focus instanceof Platform && this.state.focus.platformRight !== undefined)}
              onClick={() => {
                if (this.state.focus instanceof Platform && this.state.focus.platformRight !== undefined)
                  this.setFocus(this.state.focus.platformRight)
              }}>{"→"}</Button></Col>
          </Row>
          <Row>
            <Col/>
            <Button
              disabled={!(this.state.focus instanceof Platform && this.state.focus.platformDown !== undefined)}
              onClick={() => {
                if (this.state.focus instanceof Platform && this.state.focus.platformDown !== undefined)
                  this.setFocus(this.state.focus.platformDown)
              }}>{"↓"}</Button>
            <Col/>
          </Row>
          
          {/*"←" : "↓"*/}
          {/*"→" : "↑"*/}
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
  setFocus(focus: "free" | Platform | "plan") {
    this.setState(Object.assign(
      this.state,
      {focus: focus}
    ))
  }
  
  componentDidMount(): void {
    console.log("Mounted App");
  }
  
  componentDidUpdate(prevProps: Readonly<any>, prevState: Readonly<AppState>, snapshot?: any): void {
    console.log("App Updated");
  }
  
  componentWillUnmount(): void {
    console.log("App Will Unmount");
  }
  
  /**
   * Loads the warehouse
   */
  loadWarehouse(): Warehouse {
    // TODO this currently generates a default warehouse, should load from backend.
    return Warehouse.generateDefaultWarehouse()
  }
  
}

export default App;
