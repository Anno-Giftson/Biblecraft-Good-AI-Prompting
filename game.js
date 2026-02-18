//////////////////////////////////////////////////////
// BIBLECRAFT - FIXED 3D ENGINE
//////////////////////////////////////////////////////

const canvas = document.getElementById("gameCanvas");
const gl = canvas.getContext("webgl");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

gl.viewport(0, 0, canvas.width, canvas.height);
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
// MATRIX HELPERS
//////////////////////////////////////////////////////

function perspective(fov, aspect, near, far) {
    const f = 1.0 / Math.tan(fov / 2);
    const nf = 1 / (near - far);
    return new Float32Array([
        f/aspect,0,0,0,
        0,f,0,0,
        0,0,(far+near)*nf,-1,
        0,0,(2*far*near)*nf,0
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
// FULL CUBE (ALL 6 FACES)
//////////////////////////////////////////////////////

const cubeVertices = new Float32Array([
    // FRONT
    -0.5,-0.5,0.5,  0.5,-0.5,0.5,  0.5,0.5,0.5,
    -0.5,-0.5,0.5,  0.5,0.5,0.5, -0.5,0.5,0.5,
    // BACK
    -0.5,-0.5,-0.5, -0.5,0.5,-0.5, 0.5,0.5,-0.5,
    -0.5,-0.5,-0.5, 0.5,0.5,-0.5, 0.5,-0.5,-0.5,
    // LEFT
    -0.5,-0.5,-0.5, -0.5,-0.5,0.5, -0.5,0.5,0.5,
    -0.5,-0.5,-0.5, -0.5,0.5,0.5, -0.5,0.5,-0.5,
    // RIGHT
    0.5,-0.5,-0.5, 0.5,0.5,-0.5, 0.5,0.5,0.5,
    0.5,-0.5,-0.5, 0.5,0.5,0.5, 0.5,-0.5,0.5,
    // TOP
    -0.5,0.5,-0.5, -0.5,0.5,0.5, 0.5,0.5,0.5,
    -0.5,0.5,-0.5, 0.5,0.5,0.5, 0.5,0.5,-0.5,
    // BOTTOM
    -0.5,-0.5,-0.5, 0.5,-0.5,-0.5, 0.5,-0.5,0.5,
    -0.5,-0.5,-0.5, 0.5,-0.5,0.5, -0.5,-0.5,0.5
]);

const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, cubeVertices, gl.STATIC_DRAW);

const positionLoc = gl.getAttribLocation(program,"position");
gl.enableVertexAttribArray(positionLoc);
gl.vertexAttribPointer(positionLoc,3,gl.FLOAT,false,0,0);

//////////////////////////////////////////////////////
// WORLD GENERATION (CENTERED)
//////////////////////////////////////////////////////

const WORLD_SIZE = 16;
let world = {};

function generateWorld(){
    for(let x=-WORLD_SIZE/2; x<WORLD_SIZE/2; x++){
        for(let z=-WORLD_SIZE/2; z<WORLD_SIZE/2; z++){
            let height = Math.floor(Math.random()*3)+1;
            for(let y=0;y<height;y++){
                world[`${x},${y},${z}`] = true;
            }
        }
    }
}

//////////////////////////////////////////////////////
// CAMERA
//////////////////////////////////////////////////////

let camera = {
    x:0,
    y:6,
    z:15
};

//////////////////////////////////////////////////////
// DAY/NIGHT
//////////////////////////////////////////////////////

let time=0;

function updateDayNight(){
    time+=0.01;
    let brightness=Math.sin(time)*0.5+0.5;
    gl.clearColor(0.3*brightness,0.5*brightness,0.8*brightness,1);
    document.getElementById("timeOfDay").innerText =
        brightness<0.3?"Night":"Day";
}

//////////////////////////////////////////////////////
// RENDER
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

    gl.uniformMatrix4fv(projectionLoc,false,projectionMatrix);

    let view=identity();
    translate(view,-camera.x,-camera.y,-camera.z);
    gl.uniformMatrix4fv(viewLoc,false,view);

    for(let key in world){
        let [x,y,z]=key.split(",").map(Number);
        let model=identity();
        translate(model,x,y,z);
        gl.uniformMatrix4fv(modelLoc,false,model);
        gl.uniform4f(colorLoc,0.3,0.8,0.3,1);
        gl.drawArrays(gl.TRIANGLES,0,36);
    }

    requestAnimationFrame(render);
}

generateWorld();
render();


