import {initShaders, vec4, flatten} from "./helperfunctions.js";

"use strict";
// some webgl objects
let gl:WebGLRenderingContext;
let canvas:HTMLCanvasElement;
let program:WebGLProgram;
let bufferId:WebGLBuffer;

interface target {
    active: boolean;
    x:number;
    y:number;
    size:number;
}
let trisPerTarget:number = 20;
let targets:target[];

let targetsRemaining:number;

window.onload = function init() :void {
    // Get the canvas element
    canvas = document.getElementById("gl-canvas") as HTMLCanvasElement;
    gl = canvas.getContext("webgl2") as WebGLRenderingContext;
    if(!gl) {
        alert("WebGL 2 isn't available");
    }

    // Configure mouse cursor to be a crosshair
    canvas.style.cursor = "crosshair";

    // Compile the shaders
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Add initial data to the target array
    initTargets();
    targetsRemaining = targets.length;

    // Make and buffer targets
    makeAndBufferTargets();

    // Add listeners
    canvas.addEventListener("click", clickListener);
    window.addEventListener("keydown", keyPressListener);

    // set up viewport
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    // The "background color"
    gl.clearColor(0.1, 0.5, 0.8, 1);

    // render one frame right now
    requestAnimationFrame(render);
}

function clickListener(event:MouseEvent){
    // convert -1 to 1 space instead of 0 to w and 0 to h space.
    let rect:ClientRect = canvas.getBoundingClientRect(); // note canvas has padding pixels
    let canvasY:number = event.clientY - rect.top; // subtract off any "top" padding pixels
    let flippedY:number = canvas.clientHeight - canvasY; // canvas 0 is top, gl 0 is bottom, flip it
    let clickY = 2 * flippedY / canvas.clientHeight - 1;
    let clickX = 2 * (event.clientX - rect.left) / canvas.clientWidth - 1;

    targets.forEach((t:target) => {
        if(t.active){
            let distance = Math.sqrt((clickX - t.x) ** 2 + (clickY - t.y) ** 2);
            if(distance <= t.size){
                t.active = false;
                targetsRemaining--;
            }
        }
    })

    makeAndBufferTargets();
    requestAnimationFrame(render);
}

function keyPressListener(event:KeyboardEvent){
    if(event.key == "m"){
        // TODO after animation lecture
    }
}

function makeAndBufferTargets(){
    bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);

    // Send over the data
    let allTargets:vec4[] = [];
    targets.forEach((t:target) => {
        if(t.active){
            for(let i = 0; i < trisPerTarget; i++) {
                // First unit circle coordinate
                let xa = t.size * Math.cos(Math.PI * i / (trisPerTarget / 2));
                let ya = t.size * Math.sin(Math.PI * i / (trisPerTarget / 2));
                // Second unit circle coordinate
                let xb = t.size * Math.cos(Math.PI * (i + 1) / (trisPerTarget / 2));
                let yb = t.size * Math.sin(Math.PI * (i + 1) / (trisPerTarget / 2));
                // Add the points, adjusted to the specified center
                allTargets.push(new vec4(t.x + xa, t.y + ya, 0, 1));
                allTargets.push(new vec4(t.x + xb, t.y + yb, 0, 1));
                allTargets.push(new vec4(t.x, t.y, 0, 1));
            }
        }
    })

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
    let numTris: number = targetsRemaining * trisPerTarget
    for (let i = 0; i < numTris; i++){
        gl.drawArrays(gl.TRIANGLES, i * 3, 3)
    }
}

function initTargets(): void{
    targets = [
        {
            active: true,
            x: 0.5,
            y: 0.5,
            size: 0.1
        },
        {
            active: true,
            x: 0.5,
            y: -0.5,
            size: 0.1
        },
        {
            active: true,
            x: -0.5,
            y: -0.5,
            size: 0.1
        },
        {
            active: true,
            x: -0.5,
            y: 0.5,
            size: 0.1
        },
    ]
}
