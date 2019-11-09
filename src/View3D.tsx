import React from "react";
import ReactDom from "react-dom";
import {mat4, vec3} from "gl-matrix";
import {Warehouse} from "./Warehouse";
import {Platform} from "./Platform";

interface View3DState {
  buffers: {
    trayPositions: WebGLBuffer,
    trayColours: WebGLBuffer,
    
    originPositions: WebGLBuffer,
    originColours: WebGLBuffer,
  },
  gl: WebGLRenderingContext,
  trayShaderInfo: { uniformLocations: { projectionMatrix: WebGLUniformLocation | null; modelMatrix: WebGLUniformLocation | null; viewMatrix: WebGLUniformLocation | null }; attribLocations: { vertexColor: number; vertexPosition: number }; program: WebGLProgram }
  animation?: {
    fromFocus: Focus
    toFocus: Focus
    startTime: number
    length: number
  }
}

type Focus = Platform | "plan" | "free"

interface View3DProps {
  focus: Focus;
  warehouse: Warehouse;
}

/**
 * This class represents the controller
 */
export class View3D extends React.Component<View3DProps, View3DState> {
  
  componentDidMount(): void {
    console.log("Mounted View3D");
    
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
        modelMatrix: gl.getUniformLocation(trayShader, 'uModelMatrix'),
        viewMatrix: gl.getUniformLocation(trayShader, 'uViewMatrix'),
      },
    };
    
    function fillBuffer(gl: WebGLRenderingContext, data: number[]) {
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
      return buffer
    }
    
    
    const trayPositionBuffer = fillBuffer(gl, View3D.vertexPositions);
    gl.enableVertexAttribArray(trayShaderInfo.attribLocations.vertexPosition);
    
    const trayColorBuffer = fillBuffer(gl, View3D.vertexColors);
    gl.enableVertexAttribArray(trayShaderInfo.attribLocations.vertexColor);
    
    const originPositionBuffer = fillBuffer(gl, View3D.originVertexPositions);
    gl.enableVertexAttribArray(trayShaderInfo.attribLocations.vertexPosition);
    
    const originColorBuffer = fillBuffer(gl, View3D.originVertexColors);
    gl.enableVertexAttribArray(trayShaderInfo.attribLocations.vertexColor);
    
    
    if (trayPositionBuffer === null || trayColorBuffer === null
      || originPositionBuffer === null || originColorBuffer === null) {
      throw Error("Failed to create buffers");
    }
    
    let state = {
      buffers: {
        trayPositions: trayPositionBuffer,
        trayColours: trayColorBuffer,
        originPositions: originPositionBuffer,
        originColours: originColorBuffer,
      },
      gl: gl,
      trayShaderInfo: trayShaderInfo
    };
    
    this.setState(state, this.draw.bind(this));
    
  }
  
  componentDidUpdate(prevProps: Readonly<View3DProps>, prevState: Readonly<View3DState>, snapshot?: any): void {
    console.log("View3D Updated");
    console.log(this.props.focus);
    if (prevProps.focus !== this.props.focus) {
      
      this.setState(Object.assign(this.state, {
        animation: {
          fromFocus: prevProps.focus,
          toFocus: this.props.focus,
          startTime: new Date().getTime(),
          length: 500
        }
      }), this.draw.bind(this))
      
    }
  }
  
  componentWillUnmount(): void {
    console.log("View3D Will Unmount");
  }
  
  render() {
    return <canvas width="800" height="500"/>;
  }
  
  draw(): void {
    
    const {
      buffers: {
        trayPositions,
        trayColours,
        originPositions,
        originColours,
      },
      gl,
      trayShaderInfo
    } = this.state;
    
    gl.clearColor(.90, .90, .90, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // Tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute.
    
    gl.useProgram(trayShaderInfo.program);
    
    
    const {
      viewMatrix,
      projectionMatrix
    } = this.evaluateViewProjMatrices(gl);
    
    gl.uniformMatrix4fv(
      trayShaderInfo.uniformLocations.viewMatrix,
      false,
      viewMatrix
    );
    gl.uniformMatrix4fv(
      trayShaderInfo.uniformLocations.projectionMatrix,
      false,
      projectionMatrix
    );
    
    gl.bindBuffer(gl.ARRAY_BUFFER, trayPositions);
    gl.vertexAttribPointer(trayShaderInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, trayColours);
    gl.vertexAttribPointer(trayShaderInfo.attribLocations.vertexColor, 4, gl.FLOAT, false, 0, 0);
    
    const modelMatrix: mat4 = mat4.create();
    // draw all the trays
    this.props.warehouse.platforms.forEach(platform => {
      platform.trays.forEach(tray => {
        
        mat4.multiply(modelMatrix, platform.platformSpaceMatrix, tray.worldSpaceMatrix);
        gl.uniformMatrix4fv(
          trayShaderInfo.uniformLocations.modelMatrix,
          false,
          modelMatrix
        );
        
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, View3D.trayVertexPositions.length);
      })
    });
    
    mat4.identity(modelMatrix);
    gl.uniformMatrix4fv(
      trayShaderInfo.uniformLocations.modelMatrix,
      false,
      modelMatrix
    );
    
    // draw origin
    gl.bindBuffer(gl.ARRAY_BUFFER, originPositions);
    gl.vertexAttribPointer(trayShaderInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, originColours);
    gl.vertexAttribPointer(trayShaderInfo.attribLocations.vertexColor, 4, gl.FLOAT, false, 0, 0);
    
    gl.drawArrays(gl.TRIANGLE_FAN, 0, View3D.originVertexPositions.length);
    
    // this.props.warehouse.platforms.forEach(platform => {
    //   gl.uniformMatrix4fv(
    //     trayShaderInfo.uniformLocations.modelMatrix,
    //     false,
    //     platform.platformSpaceMatrix
    //   );
    //
    //   gl.drawArrays(gl.TRIANGLE_FAN, 0, View3D.originVertexPositions.length);
    // });
    
    if (this.state.animation !== undefined && this.state.animation.startTime + this.state.animation.length < new Date().getTime()) {
      this.setState(Object.assign(this.state, {
        animation: undefined
      }))
    } else if (this.state.animation !== undefined) {
      requestAnimationFrame(this.draw.bind(this));
    }
  }
  
  /**
   * Interpolates between an Orthographic (t=0) and Perspective (t=1) projection at the dolly distance specified.  The
   * dolly distance being the distance at which things don't move in screen space
   * @param aspect the aspect ratio
   * @param dollyDistance the dolly distance (at which things don't appear to move)
   * @param t the liner interpolation factor (0=ortho, 1=persp)
   */
  interpolateOrthoPersp(aspect: number, dollyDistance: number, t: number) {
    const projectionMatrix = mat4.create();
    mat4.set(projectionMatrix, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,);
    
    const perspectiveMatrix = mat4.create();
    mat4.perspective(perspectiveMatrix, View3D.fieldOfView, aspect, View3D.zNear, View3D.zFar);
    
    const invPerspective = mat4.create();
    mat4.invert(invPerspective, perspectiveMatrix);
    
    const top: vec3 = vec3.create();
    vec3.set(top, 0, 1, 1 - (dollyDistance - View3D.zNear) / (View3D.zFar - View3D.zNear));
    vec3.transformMat4(top, top, invPerspective);
    
    const size = 2 * top[1];
    
    const orthoMatrix = mat4.create();
    mat4.ortho(orthoMatrix, -size * aspect, size * aspect, -size, size, View3D.zNear, View3D.zFar);
    
    mat4.multiplyScalarAndAdd(projectionMatrix, projectionMatrix, perspectiveMatrix, t);
    mat4.multiplyScalarAndAdd(projectionMatrix, projectionMatrix, orthoMatrix, 1 - t);
    
  }
  
  evaluateViewProjMatricesPlatformFocus(focus: Platform, aspect: number, orthoFactor: number): { viewMatrix: mat4, projectionMatrix: mat4 } {
    let platformDistance = 2.5;
    
    const projectionMatrix = mat4.create();
    const viewMatrix = mat4.create();
    
    mat4.set(projectionMatrix, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,);
    
    const invPlat = mat4.create();
    mat4.invert(invPlat, focus.platformSpaceMatrix);
    mat4.mul(viewMatrix, invPlat, viewMatrix);
    mat4.translate(viewMatrix, viewMatrix, [-4 / 3, -.5, platformDistance]);
    mat4.mul(viewMatrix, mat4.fromYRotation(mat4.create(), Math.PI), viewMatrix);
    
    const perspectiveMatrix = mat4.create();
    mat4.perspective(perspectiveMatrix, View3D.fieldOfView, aspect, View3D.zNear, View3D.zFar);
    
    const invPerspective = mat4.create();
    mat4.invert(invPerspective, perspectiveMatrix);
    
    const size = 1.00;
    
    const orthoMatrix = mat4.create();
    mat4.ortho(orthoMatrix, -size * aspect, size * aspect, -size, size, View3D.zNear, View3D.zFar);
    
    mat4.multiplyScalarAndAdd(projectionMatrix, projectionMatrix, perspectiveMatrix, orthoFactor);
    mat4.multiplyScalarAndAdd(projectionMatrix, projectionMatrix, orthoMatrix, 1 - orthoFactor);
    
    return {viewMatrix: viewMatrix, projectionMatrix: projectionMatrix}
    
  }
  
  evaluateViewProjMatrices(gl: WebGLRenderingContext): { viewMatrix: mat4, projectionMatrix: mat4 } {
    
    const viewMatrix = mat4.create();
    const projectionMatrix = mat4.create();
    
    const aspect = gl.drawingBufferWidth / gl.drawingBufferHeight;
    
    if (this.props.focus === "free") {
      
      const time = new Date().getTime() / 1000;
      const radius = 10;
      let height = 5;
      
      const cameraLocation = [-radius * Math.cos(time), -height, -radius * Math.sin(time)];
      
      mat4.rotateX(viewMatrix, viewMatrix, Math.atan(height / 2 / radius));
      mat4.rotateY(viewMatrix, viewMatrix, time - Math.PI / 2);
      mat4.translate(viewMatrix, viewMatrix, cameraLocation);
      
      mat4.perspective(projectionMatrix, View3D.fieldOfView, aspect, View3D.zNear, View3D.zFar)
      
    } else if (this.props.focus === "plan") {
      mat4.rotateX(viewMatrix, viewMatrix, Math.PI / 2);
      
      const size = 8;
      mat4.translate(viewMatrix, viewMatrix, [-7, -14, -2]);
      mat4.ortho(projectionMatrix, -size, size, -size / aspect, size / aspect, .1, 100)
      
    } else {
      if (this.state.animation !== undefined &&
        this.state.animation.fromFocus instanceof Platform &&
        this.state.animation.toFocus instanceof Platform) {
        
        const fromFocus = this.evaluateViewProjMatricesPlatformFocus(this.state.animation.fromFocus, aspect, 0);
        const toFocus = this.evaluateViewProjMatricesPlatformFocus(this.state.animation.toFocus, aspect, 1);
        
        const t = Math.min(Math.max(
          (new Date().getTime() - this.state.animation.startTime) / this.state.animation.length
          , 0), 1);
        const orthoT = 4 * t * (1 - t);
        // const viewT = .5 - Math.cos(Math.PI * t) / 2;
        const viewT = .5 - Math.cos(Math.PI * t) / 2;
        
        // function g(x: number) {
        //   return .5 - Math.cos(Math.PI * x) / 2
        // }
        
        console.log("animation " + orthoT);
        
        mat4.set(projectionMatrix, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
        mat4.set(viewMatrix, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
        
        mat4.multiplyScalarAndAdd(projectionMatrix, projectionMatrix, fromFocus.projectionMatrix, 1 - orthoT);
        mat4.multiplyScalarAndAdd(projectionMatrix, projectionMatrix, toFocus.projectionMatrix, orthoT);
        
        mat4.multiplyScalarAndAdd(viewMatrix, viewMatrix, fromFocus.viewMatrix, 1 - viewT);
        mat4.multiplyScalarAndAdd(viewMatrix, viewMatrix, toFocus.viewMatrix, viewT);
        
      } else {
        return this.evaluateViewProjMatricesPlatformFocus(this.props.focus, aspect, 0)
      }
      
    }
    
    return {viewMatrix: viewMatrix, projectionMatrix: projectionMatrix}
    
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
  
  static zNear = .1;
  static zFar = 100;
  static fieldOfView = Math.PI * 60 / 180;
  
  static trayWidth: number = 2 / 3;
  static trayHeight: number = 1 / 3;
  static trayLength: number = 1;
  
  static trayVertexPositions = [
    View3D.trayWidth, View3D.trayHeight, View3D.trayLength,
    0, View3D.trayHeight, View3D.trayLength,
    View3D.trayWidth, 0, View3D.trayLength,
    0, 0, View3D.trayLength,
    View3D.trayWidth, View3D.trayHeight, 0,
    0, View3D.trayHeight, 0,
    0, 0, 0,
    View3D.trayWidth, 0, 0,
  ];
  
  static trayVertexColors = [
    1, 1, 1, 1,
    0, 1, 1, 1,
    1, 0, 1, 1,
    0, 0, 1, 1,
    1, 1, 0, 1,
    0, 1, 0, 1,
    0, 0, 0, 1,
    1, 0, 0, 1,
  ];
  
  static originVertexPositions = [
    0, 0, 0,
    
    1, 0, 0, // 1
    .75, .25, 0,
    .25, .25, 0,
    .25, .75, 0,
    0, 1, 0,
    
    0, .75, .25, //6
    0, .25, .25,
    0, .25, .75,
    0, .0, 1,
    
    .25, 0, .75, //10
    .25, 0, .25,
    .75, 0, .25,
    
    1, 0, 0,
  ];
  static originVertexColors = [
    0, 0, 0, 1,
    
    1, 0, 0, 1, // 1
    .75, .25, 0, 1,
    .25, .25, 0, 1,
    .25, .75, 0, 1,
    0, 1, 0, 1,
    
    0, .75, .25, 1, //6
    0, .25, .25, 1,
    0, .25, .75, 1,
    0, .0, 1, 1,
    
    .25, 0, .75, 1, //10
    .25, 0, .25, 1,
    .75, 0, .25, 1,
    1, 0, 0, 1,
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
  
  static vertexShaderSource = `
  attribute vec4 aVertexPosition;
  attribute vec4 aVertexColor;
  
  uniform mat4 uModelMatrix;
  uniform mat4 uViewMatrix;
  uniform mat4 uProjectionMatrix;
  
  varying lowp vec4 vColor;

  void main() {
    gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * aVertexPosition;
    vColor = aVertexColor;
  }
  `;
  
  static fragmentShaderSource = `
 varying lowp vec4 vColor;
 
  void main() {
    gl_FragColor = vColor;
  }
  `;
}