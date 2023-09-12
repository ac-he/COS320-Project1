import {initShaders, vec4, flatten} from "./helperfunctions.js";

"use strict";
// some webgl objects
let gl:WebGLRenderingContext;
let program:WebGLProgram;
let bufferId:WebGLBuffer;

// html elements
let canvas:HTMLCanvasElement;
let button:HTMLButtonElement;
let feedback:HTMLDivElement;

interface target {
    active: boolean; // active targets will be visible and have animation, inactive ones won't
    x:number; // x position of the center of the target
    y:number; // y position of the center of the target
    size:number; // the radius of the target
}

let trisPerTarget:number = 20; // how many triangles are used to render this circle?
let targets:target[]; // stores all targets
let targetsRemaining:number; // number of active targets

window.onload = function init() :void {
    // Get the canvas element
    canvas = document.getElementById("gl-canvas") as HTMLCanvasElement;
    gl = canvas.getContext("webgl2") as WebGLRenderingContext;
    if(!gl) {
        alert("WebGL 2 isn't available");
    }
    // Configure mouse cursor to be a crosshair
    canvas.style.cursor = "crosshair";

    // Get the other HTML elements
    button = document.getElementById("reset") as HTMLButtonElement;
    button.addEventListener("click", buttonPressListener);

    feedback = document.getElementById("feedback") as HTMLDivElement;

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

    // Check if this click was inside any of the targets
    targets.forEach((t:target) => {
        if(t.active){
            // The targets are circular, so we can calculate the distance of the click from the center of the target
            let distance = Math.sqrt((clickX - t.x) ** 2 + (clickY - t.y) ** 2);
            // and compare that distance with the target's size
            if(distance <= t.size){
                // deactivate (hide) the target
                t.active = false;
                // decrement target counter
                targetsRemaining--;
                feedback.innerText = targetsRemaining + " targets remaining."
                if(targetsRemaining == 0){
                    feedback.innerText += " Press the button below to reset the game."
                }
            }
        }
    })

    // draw updated targets
    makeAndBufferTargets();
    requestAnimationFrame(render);
}

function keyPressListener(event:KeyboardEvent){
    if(event.key == "m"){ // m is used to toggle movement
        // TODO after animation lecture
    }
}

function buttonPressListener(){
    // reset the targets
    initTargets();

    // fix the target counter
    targetsRemaining = targets.length;
    feedback.innerText = targetsRemaining + " targets remaining."

    // draw updated targets
    makeAndBufferTargets();
    requestAnimationFrame(render);
}

function makeAndBufferTargets(){
    // buffer setup
    bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);

    // create the target shapes
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

                // Find the color of this "slice"
                let curColor:vec4;
                if(i % 2 == 0){
                    curColor = new vec4(0.98, 0.92, 0.84, 1);
                } else {
                    curColor = new vec4(1, 0.68, 0, 1);
                }

                // Add the points, adjusted to the specified center
                allTargets.push(new vec4(t.x + xa, t.y + ya, 0, 1));
                allTargets.push(curColor);
                allTargets.push(new vec4(t.x + xb, t.y + yb, 0, 1));
                allTargets.push(curColor);
                allTargets.push(new vec4(t.x, t.y, 0, 1));
                allTargets.push(curColor);
            }
        }
    })

    // add the shape data to the buffer
    gl.bufferData(gl.ARRAY_BUFFER, flatten(allTargets), gl.STATIC_DRAW);

    //      Position       |          Color
    //  x   y   z     w    |    r     g     b     a
    // 0-3 4-7 8-11 12-15  |  16-19 20-23 24-27 28-31

    // Position data
    let vPosition:GLint = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 32, 0);
    gl.enableVertexAttribArray(vPosition);

    // Color data
    let vColor:GLint = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 32, 16);
    gl.enableVertexAttribArray(vColor);
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
    // initialize/clear out the array of targets
    targets = []

    // Draw 6 targets
    for(let i = 0; i < 6; i++){
        targets.push({
            active: true,
            x: Math.random()*1.8 - 0.9,
            y: Math.random()*1.8 - 0.9,
            size: 0.1
        });
    }
}
