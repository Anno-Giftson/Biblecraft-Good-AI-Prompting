//////////////////////////////////////////////////////
// BIBLECRAFT - CORE ENGINE
// Pure WebGL + JavaScript
//////////////////////////////////////////////////////

const canvas = document.getElementById("gameCanvas");
const gl = canvas.getContext("webgl");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

//////////////////////////////////////////////////////
// BASIC SHADER SETUP
//////////////////////////////////////////////////////

const vertexShaderSource = `
attribute vec3 position;
uniform mat4 projection;
uniform mat4 modelView;
void main() {
    gl_Position = projection * modelView * vec4(position, 1.0);
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

const vertexShader = createShader(gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
gl.useProgram(program);

//////////////////////////////////////////////////////
// VOXEL WORLD GENERATION
//////////////////////////////////////////////////////

const WORLD_SIZE = 32;
let world = {};

function generateWorld() {
    for (let x = 0; x < WORLD_SIZE; x++) {
        for (let z = 0; z < WORLD_SIZE; z++) {
            let height = Math.floor(Math.random() * 4) + 1;

            for (let y = 0; y < height; y++) {
                world[`${x},${y},${z}`] = getBiomeBlock(x, z);
            }
        }
    }

    generateNoahsArk();
}

function getBiomeBlock(x, z) {
    if (x < 10) return "sand";       // Desert biome
    if (x < 20) return "grass";      // Plains
    return "eden";                   // Garden of Eden biome
}

//////////////////////////////////////////////////////
// STRUCTURE: NOAH'S ARK
//////////////////////////////////////////////////////

function generateNoahsArk() {
    for (let x = 12; x < 20; x++) {
        for (let z = 12; z < 18; z++) {
            for (let y = 5; y < 8; y++) {
                world[`${x},${y},${z}`] = "wood";
            }
        }
    }
}

//////////////////////////////////////////////////////
// PLAYER SYSTEM
//////////////////////////////////////////////////////

let player = {
    x: 16,
    y: 5,
    z: 16,
    health: 100,
    hunger: 100,
    inventory: []
};

//////////////////////////////////////////////////////
// SURVIVAL MECHANICS
//////////////////////////////////////////////////////

function updateSurvival() {
    player.hunger -= 0.01;
    if (player.hunger <= 0) {
        player.health -= 0.05;
    }

    document.getElementById("health").innerText = Math.floor(player.health);
    document.getElementById("hunger").innerText = Math.floor(player.hunger);
}

//////////////////////////////////////////////////////
// DAY / NIGHT CYCLE
//////////////////////////////////////////////////////

let time = 0;

function updateDayNight() {
    time += 0.01;
    let brightness = Math.sin(time) * 0.5 + 0.5;

    gl.clearColor(0.1 * brightness, 0.2 * brightness, 0.4 * brightness, 1);
    document.getElementById("timeOfDay").innerText =
        brightness < 0.3 ? "Night" : "Day";
}

//////////////////////////////////////////////////////
// CRAFTING SYSTEM
//////////////////////////////////////////////////////

const recipes = {
    altar: {
        requires: ["stone", "stone", "stone"],
        result: "altar"
    }
};

function craft(item) {
    let recipe = recipes[item];
    if (!recipe) return;

    player.inventory.push(recipe.result);
    alert("Crafted: " + recipe.result);
}

//////////////////////////////////////////////////////
// QUEST SYSTEM
//////////////////////////////////////////////////////

let quests = [
    {
        name: "Build Noah's Ark",
        completed: false
    },
    {
        name: "Gather Manna",
        completed: false
    }
];

//////////////////////////////////////////////////////
// CHAT SYSTEM
//////////////////////////////////////////////////////

const chatInput = document.getElementById("chatInput");
chatInput.addEventListener("keydown", e => {
    if (e.key === "Enter") {
        let msg = chatInput.value;
        document.getElementById("messages").innerHTML += "<div>" + msg + "</div>";
        chatInput.value = "";
    }
});

//////////////////////////////////////////////////////
// MULTIPLAYER (CLIENT STUB)
//////////////////////////////////////////////////////

let socket;

function connectMultiplayer() {
    socket = new WebSocket("ws://localhost:8080");

    socket.onmessage = (event) => {
        console.log("Server:", event.data);
    };
}

//////////////////////////////////////////////////////
// RENDER LOOP
//////////////////////////////////////////////////////

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    updateSurvival();
    updateDayNight();

    requestAnimationFrame(render);
}

//////////////////////////////////////////////////////
// INITIALIZE
//////////////////////////////////////////////////////

generateWorld();
render();
