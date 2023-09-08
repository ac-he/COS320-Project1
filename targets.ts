import {initShaders, vec4, flatten} from "./helperfunctions.js";

"use strict";
// some webgl objects
let gl:WebGLRenderingContext;
let canvas:HTMLCanvasElement;
let program:WebGLProgram;
let bufferId:WebGLBuffer;

let targets:vec4[][]; // array to store targets in
let trisPerTarget:number = 4;

window.onload = function init() :void {
    canvas = document.getElementById("gl-canvas") as HTMLCanvasElement;

    gl = canvas.getContext("webgl2") as WebGLRenderingContext;
    if(!gl) {
        alert("WebGL 2 isn't available");
    }

    // Compile the shaders
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Set up targets
    targets = [];
    makeTarget(0,0.5,0.5,0.2);
    makeTarget(1,-0.5,0.5,0.2);
    makeTarget(2,-0.5,-0.5,0.2);
    makeTarget(3,0.5,-0.5,0.2);

    // Buffer target data
    bufferTargets();

    // set up viewport
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    // The "background color"
    gl.clearColor(0.1, 0.5, 0.8, 1);

    // render one frame right now
    requestAnimationFrame(render);
}

function makeTarget(id:number, x:number, y:number, size:number) :void {
    targets[id] = [];
    // for(let i = 0; i < trisPerTarget; i++){
    //     let xa = size * Math.cos(Math.PI * i * trisPerTarget/ 2);
    //     let ya = size * Math.sin(Math.PI * i * trisPerTarget/ 2);
    //     let xb = size * Math.cos(Math.PI * (i + 1) * trisPerTarget/ 2);
    //     let yb = size * Math.sin(Math.PI * (i + 1) * trisPerTarget/ 2);
    //     targets[id].push(new vec4(x + xa, y + ya, 0, 1));
    //     targets[id].push(new vec4(x + xb, y + yb, 0, 1));
    //     targets[id].push(new vec4(x, y, 0, 1));
    // }

    targets[id].push(new vec4(x + size, y, 0, 1));
    targets[id].push(new vec4(x, y + size, 0, 1));
    targets[id].push(new vec4(x, y, 0, 1));

    targets[id].push(new vec4(x , y- size, 0, 1));
    targets[id].push(new vec4(x- size, y, 0, 1));
    targets[id].push(new vec4(x, y, 0, 1));

    targets[id].push(new vec4(x , y+size, 0, 1));
    targets[id].push(new vec4(x- size, y, 0, 1));
    targets[id].push(new vec4(x, y, 0, 1));

    targets[id].push(new vec4(x + size, y, 0, 1));
    targets[id].push(new vec4(x, y - size, 0, 1));
    targets[id].push(new vec4(x, y, 0, 1));
}

function bufferTargets(){
    bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);


    // Send over the data
    let allTargets:vec4[] = [];
    targets.forEach((target:vec4[]) => {
        target.forEach((point:vec4) => {
            allTargets.push(point);
        });
    });
    gl.bufferData(gl.ARRAY_BUFFER, flatten(allTargets), gl.STATIC_DRAW);

    let vPosition:GLint = gl.getAttribLocation(program, "vPosition");

    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
}

function render() : void {
    // clear the screen
    gl.clear(gl.COLOR_BUFFER_BIT);

    // bind to the geometry buffer to get all the triangle points
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId)

    // draw the triangles
    let numTris: number = targets.length * trisPerTarget
    for (let i = 0; i < numTris; i++){
        gl.drawArrays(gl.TRIANGLES, i * 3, 3)
    }
}
