//////////////////////////////////////////////////////
// BIBLECRAFT - WORKING 3D VOXEL ENGINE
// Pure WebGL + No Libraries
//////////////////////////////////////////////////////

const canvas = document.getElementById("gameCanvas");
const gl = canvas.getContext("webgl");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

gl.enable(gl.DEPTH_TEST);

//////////////////////////////////////////////////////
// SHADERS
//////////////////////////////////////////////////////

const vertexShaderSource = `
attribute vec3 position;
uniform mat4 projection;
uniform mat4 view;
uniform mat4 model;
void main() {
    gl_Position = projection * view * model * vec4(position, 1.0);
}
`;

const fragmentShaderSource = `
precision mediump float;
uniform vec4 color;
void main() {
    gl_FragColor = color;
}
`;

function createShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
}

const program = gl.createProgram();
gl.attachShader(program, createShader(gl.VERTEX_SHADER, vertexShaderSource));
gl.attachShader(program, createShader(gl.FRAGMENT_SHADER, fragmentShaderSource));
gl.linkProgram(program);
gl.useProgram(program);

//////////////////////////////////////////////////////
// MATRIX MATH
//////////////////////////////////////////////////////

function perspective(fov, aspect, near, far) {
    const f = 1.0 / Math.tan(fov / 2);
    return new Float32Array([
        f/aspect,0,0,0,
        0,f,0,0,
        0,0,(far+near)/(near-far),-1,
        0,0,(2*far*near)/(near-far),0
    ]);
}

function identity() {
    return new Float32Array([
        1,0,0,0,
        0,1,0,0,
        0,0,1,0,
        0,0,0,1
    ]);
}

function translate(m,x,y,z){
    m[12]+=x; m[13]+=y; m[14]+=z;
    return m;
}

//////////////////////////////////////////////////////
// CUBE GEOMETRY
//////////////////////////////////////////////////////

const cubeVertices = new Float32Array([
    -0.5,-0.5,-0.5,  0.5,-0.5,-0.5,  0.5,0.5,-0.5,
    -0.5,-0.5,-0.5,  0.5,0.5,-0.5, -0.5,0.5,-0.5,
]);

const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, cubeVertices, gl.STATIC_DRAW);

const positionLoc = gl.getAttribLocation(program,"position");
gl.enableVertexAttribArray(positionLoc);
gl.vertexAttribPointer(positionLoc,3,gl.FLOAT,false,0,0);

//////////////////////////////////////////////////////
// WORLD
//////////////////////////////////////////////////////

const WORLD_SIZE = 20;
let world = {};

function generateWorld() {
    for(let x=0;x<WORLD_SIZE;x++){
        for(let z=0;z<WORLD_SIZE;z++){
            let height = Math.floor(Math.random()*3)+1;
            for(let y=0;y<height;y++){
                world[`${x},${y},${z}`]="grass";
            }
        }
    }
}

//////////////////////////////////////////////////////
// PLAYER
//////////////////////////////////////////////////////

let player = {
    x:10,y:5,z:10,
    velY:0,
    health:100,
    hunger:100
};

let keys = {};
document.addEventListener("keydown",e=>keys[e.key]=true);
document.addEventListener("keyup",e=>keys[e.key]=false);

//////////////////////////////////////////////////////
// DAY NIGHT
//////////////////////////////////////////////////////

let time=0;

function updateDayNight(){
    time+=0.01;
    let brightness=Math.sin(time)*0.5+0.5;
    gl.clearColor(0.2*brightness,0.4*brightness,0.7*brightness,1);
    document.getElementById("timeOfDay").innerText=
        brightness<0.3?"Night":"Day";
}

//////////////////////////////////////////////////////
// SURVIVAL
//////////////////////////////////////////////////////

function updateSurvival(){
    player.hunger-=0.02;
    if(player.hunger<0) player.health-=0.05;

    document.getElementById("health").innerText=Math.floor(player.health);
    document.getElementById("hunger").innerText=Math.floor(player.hunger);
}

//////////////////////////////////////////////////////
// MOVEMENT + GRAVITY
//////////////////////////////////////////////////////

function updateMovement(){
    if(keys["w"]) player.z-=0.1;
    if(keys["s"]) player.z+=0.1;
    if(keys["a"]) player.x-=0.1;
    if(keys["d"]) player.x+=0.1;

    player.velY-=0.01;
    player.y+=player.velY;

    if(player.y<2){
        player.y=2;
        player.velY=0;
    }

    if(keys[" "]) player.velY=0.2;
}

//////////////////////////////////////////////////////
// RENDER WORLD
//////////////////////////////////////////////////////

const projectionLoc=gl.getUniformLocation(program,"projection");
const viewLoc=gl.getUniformLocation(program,"view");
const modelLoc=gl.getUniformLocation(program,"model");
const colorLoc=gl.getUniformLocation(program,"color");

const projectionMatrix=perspective(
    Math.PI/4,
    canvas.width/canvas.height,
    0.1,
    100
);

function render(){
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

    updateDayNight();
    updateSurvival();
    updateMovement();

    gl.uniformMatrix4fv(projectionLoc,false,projectionMatrix);

    let view=identity();
    translate(view,-player.x,-player.y,-player.z);
    gl.uniformMatrix4fv(viewLoc,false,view);

    for(let key in world){
        let [x,y,z]=key.split(",").map(Number);
        let model=identity();
        translate(model,x,y,z);
        gl.uniformMatrix4fv(modelLoc,false,model);
        gl.uniform4f(colorLoc,0.3,0.8,0.3,1);
        gl.drawArrays(gl.TRIANGLES,0,6);
    }

    requestAnimationFrame(render);
}

//////////////////////////////////////////////////////
// START
//////////////////////////////////////////////////////

generateWorld();
render();

