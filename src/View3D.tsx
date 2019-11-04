import React from "react";
import ReactDom from "react-dom";
import {mat4} from "gl-matrix";
import {Warehouse} from "./Warehouse";
import {Platform} from "./Platform";

interface View3DState {

}

interface View3DProps {
  focus: Platform | "plan" | "circle";
  warehouse: Warehouse;
}

/**
 * This class represents the controller
 */
export class View3D extends React.Component<View3DProps, View3DState> {
  
  static vertexShaderSource = `
  attribute vec4 aVertexPosition;
  attribute vec4 aVertexColor;
  
  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;

  varying lowp vec4 vColor;

  void main() {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    vColor = aVertexColor;
  }
  `;
  
  static fragmentShaderSource = `
 varying lowp vec4 vColor;
  void main() {
    gl_FragColor = vColor;
  }`;
  
  componentDidMount(): void {
    console.log("Mounting View3D");
    
    const canvas = ReactDom.findDOMNode(this) as HTMLCanvasElement;
    const gl = canvas.getContext("webgl");
    if (gl === null) {
      alert("Unable to initialize WebGL. Your browser or machine may not support it.");
      return;
    }
    
    const trayShader = View3D.initShaderProgram(gl, View3D.vertexShaderSource, View3D.fragmentShaderSource);
    if (trayShader == null) {
      alert("Unable to initialize the trayShader.");
      return;
    }
    
    const trayShaderInfo = {
      program: trayShader,
      attribLocations: {
        vertexPosition: gl.getAttribLocation(trayShader, 'aVertexPosition'),
        vertexColor: gl.getAttribLocation(trayShader, 'aVertexColor'),
      },
      uniformLocations: {
        projectionMatrix: gl.getUniformLocation(trayShader, 'uProjectionMatrix'),
        modelViewMatrix: gl.getUniformLocation(trayShader, 'uModelViewMatrix'),
      },
    };
    
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(View3D.vertexPositions), gl.STATIC_DRAW);
    
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(View3D.vertexColors), gl.STATIC_DRAW);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(trayShaderInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(trayShaderInfo.attribLocations.vertexPosition);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.vertexAttribPointer(trayShaderInfo.attribLocations.vertexColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(trayShaderInfo.attribLocations.vertexColor);
    
    
    this.draw(canvas, gl, trayShader, trayShaderInfo, positionBuffer, colorBuffer)
    
  }
  
  componentDidUpdate(prevProps: Readonly<View3DProps>, prevState: Readonly<View3DState>, snapshot?: any): void {
    console.log("View3D Updated");
  }
  
  componentWillUnmount(): void {
    console.log("View3D Will Unmount");
  }
  
  draw(
    canvas: HTMLCanvasElement,
    gl: WebGLRenderingContext,
    trayShader: WebGLProgram,
    trayShaderInfo: { uniformLocations: { projectionMatrix: WebGLUniformLocation | null; modelViewMatrix: WebGLUniformLocation | null }; attribLocations: { vertexPosition: number; vertexColor: number }; program: WebGLProgram }, positionBuffer: WebGLBuffer | null,
    colorBuffer: WebGLBuffer | null
  ): void {
    gl.clearColor(.90, .90, .90, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    const fieldOfView = 45 * Math.PI / 180;
    const aspect = canvas.width / canvas.height;
    const zNear = 0.1;
    const zFar = 100.0;
    
    
    // Tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute.
    
    
    gl.useProgram(trayShaderInfo.program);
    
    const viewMatrix = mat4.create();
    const projectionMatrix = mat4.create();
    
    if (this.props.focus === "circle") {
      
      const radius = 15;
      let height = 10;
      
      const time = new Date().getTime() / 1000;
      const cameraLocation = [-radius * Math.cos(time), -height, -radius * Math.sin(time)];
      
      mat4.rotateX(viewMatrix, viewMatrix, Math.atan(height / 2 / radius));
      mat4.rotateY(viewMatrix, viewMatrix, time - Math.PI / 2);
      mat4.translate(viewMatrix, viewMatrix, cameraLocation);
      
      mat4.perspective(
        projectionMatrix,
        fieldOfView,
        aspect,
        zNear,
        zFar
      )
      
    } else if (this.props.focus === "plan") {
      mat4.rotateX(viewMatrix, viewMatrix, Math.PI / 2);
      
      const size = 8;
      mat4.translate(viewMatrix, viewMatrix, [-7, -14, -2]);
      mat4.ortho(projectionMatrix, -size, size, -size / aspect, size / aspect, .1, 100)
      
    } else {
      
      mat4.multiply(viewMatrix, this.props.focus.platformSpaceMatrix, viewMatrix);
      mat4.translate(viewMatrix, viewMatrix, [1, -.33, 1]);
      
      const size = 1.6;
      mat4.ortho(projectionMatrix, -size, size, -size / aspect, size / aspect, .1, 100)
      
    }
    
    mat4.multiply(viewMatrix, projectionMatrix, viewMatrix);
    
    gl.uniformMatrix4fv(
      trayShaderInfo.uniformLocations.projectionMatrix,
      false,
      viewMatrix
    );
    
    const modelSpaceMatrix: mat4 = mat4.create();
    gl.uniformMatrix4fv(
      trayShaderInfo.uniformLocations.modelViewMatrix,
      false,
      modelSpaceMatrix
    );
    
    // draw all the trays
    this.props.warehouse.platforms.forEach(platform => {
      platform.trays.forEach(tray => {
        
        mat4.multiply(modelSpaceMatrix, platform.platformSpaceMatrix, tray.worldSpaceMatrix);
        gl.uniformMatrix4fv(
          trayShaderInfo.uniformLocations.modelViewMatrix,
          false,
          modelSpaceMatrix
        );
        
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, View3D.trayVertexPositions.length);
      })
    });
    
    requestAnimationFrame(() => {
      this.draw(canvas, gl, trayShader, trayShaderInfo, positionBuffer, colorBuffer)
    });
  }
  
  /**
   * Loads a shader program
   * @param gl The WebGL context
   * @param vertexSource The GLSL source code of the vertex shader
   * @param fragmentSource The GLSL source code of the fragment shader
   * @return The shader program object or null if failed
   */
  static initShaderProgram(gl: WebGLRenderingContext, vertexSource: string, fragmentSource: string): WebGLProgram | null {
    
    const vertexShader = View3D.loadShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = View3D.loadShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    const shaderProgram = gl.createProgram();
    
    if (vertexShader === null || fragmentShader === null || shaderProgram === null) {
      gl.deleteShader(vertexShader);
      gl.deleteShader(vertexShader);
      gl.deleteProgram(shaderProgram);
      
      return null;
    }
    
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    
    gl.linkProgram(shaderProgram);
    
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
      return null;
    }
    
    return shaderProgram;
    
  }
  
  /**
   * Loads a shader
   * @param gl The WebGL context
   * @param type The type of shader (Fragment or Vertex)
   * @param source The GLSL source code of the shader
   * @return The shader object or null if failed
   */
  static loadShader(gl: WebGLRenderingContext, type: GLenum, source: string): WebGLShader | null {
    const shader = gl.createShader(type);
    if (shader === null) {
      return null
    } else {
      
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null
      } else {
        return shader;
      }
    }
  }
  
  static trayWidth: number = 2 / 3;
  static trayHeight: number = 1 / 3;
  static trayLength: number = 1;
  static trayVertexPositions = [
    View3D.trayWidth / 2, View3D.trayHeight / 2, View3D.trayLength / 2,
    -View3D.trayWidth / 2, View3D.trayHeight / 2, View3D.trayLength / 2,
    View3D.trayWidth / 2, -View3D.trayHeight / 2, View3D.trayLength / 2,
    -View3D.trayWidth / 2, -View3D.trayHeight / 2, View3D.trayLength / 2,
    View3D.trayWidth / 2, View3D.trayHeight / 2, -View3D.trayLength / 2,
    -View3D.trayWidth / 2, View3D.trayHeight / 2, -View3D.trayLength / 2,
    -View3D.trayWidth / 2, -View3D.trayHeight / 2, -View3D.trayLength / 2,
    View3D.trayWidth / 2, -View3D.trayHeight / 2, -View3D.trayLength / 2,
  ];
  static trayVertexColors = [
    0, 0, 0, 1,
    1, 0, 0, 1,
    0, 1, 0, 1,
    1, 1, 0, 1,
    0, 0, 1, 1,
    1, 0, 1, 1,
    1, 1, 1, 1,
    0, 1, 1, 1,
  ];
  
  //https://stackoverflow.com/questions/28375338/cube-using-single-gl-triangle-strip
  static vertexOrder: number[] = [4, 3, 7, 8, 5, 3, 1, 4, 2, 7, 6, 5, 2, 1,];
  
  // these two below are unwrapped into triangles
  static vertexPositions = View3D.vertexOrder.flatMap(index => // in model space
    View3D.trayVertexPositions.slice((index - 1) * 3, index * 3)
  );
  static vertexColors = View3D.vertexOrder.flatMap(index =>
    View3D.trayVertexColors.slice((index - 1) * 4, index * 4)
  );
  
  render() {
    return <canvas width="800" height="500"/>;
  }
}