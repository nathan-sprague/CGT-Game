// import * as THREE from './three.module.js';
// import * as THREE from 'https://cdn.jsdelivr.net/npm/three@v0.171.0/build/three.module.js';

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

// import initTinyUSDZ from 'https://lighttransport.github.io/tinyusdz/tinyusdz.js';

import initTinyUSDZ from 'initTinyUSDZ';

// import { EffectComposer } from 'https://unpkg.com/three@0.171.0/examples/jsm/postprocessing/EffectComposer.js';
// import { RenderPass } from 'https://unpkg.com/three@0.171.0/examples/jsm/postprocessing/RenderPass.js';
// import { ShaderPass } from 'https://unpkg.com/three@0.171.0/examples/jsm/postprocessing/ShaderPass.js';

// import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three@0.171.0/examples/jsm/postprocessing/EffectComposer.js';
// import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three@v0.171.0/examples/jsm/postprocessing/RenderPass.js';
// import { ShaderPass } from 'https://cdn.jsdelivr.net/npm/three@v0.171.0/examples/jsm/postprocessing/ShaderPass.js';


try {

    const canvas = document.createElement( 'canvas' );
    if (!! window.WebGL2RenderingContext && canvas.getContext( 'webgl2' ) ){
        // console.log("okay")
    } else{
        alert("WebGL doesnt work")
    }

} catch ( e ) {

    alert("web GL doesnt work")

}



// const USDZ_FILEPATHS = ['./Snowman.usdz','./snowman_evil.usdz'];
const USDZ_FILEPATHS = ['./tree.usdz', './Snowman.usdz','./snowman_evil.usdz', './igloo.usdz', './fire.usdz', './flames.usdz'];
// const USDZ_FILEPATHS = ['./fire.usdz', './flames.usdz'];
// const USDZ_FILEPATHS = [];
// const scene = new THREE.Scene();

// localStorage.removeItem("highscore");
// localStorage.clear();

let highScore = localStorage.getItem("highscore");
if (highScore == null){
    highScore = 0;
}

const scene = new THREE.Scene();
{

    const color = 0xFFFFFF;
    const intensity = 3;

    // const ambientLight = new THREE.AmbientLight(0xA0A0C0); // Soft ambient light
    const ambientLight = new THREE.AmbientLight(0x303040); // Soft ambient light

    scene.add(ambientLight);

    const near = 1;
    const far = 10;
    scene.fog = new THREE.Fog(0x000000, near, far);

    // const intensity = 0;
}



const fireLight = new THREE.PointLight(0xff4500, 20, 60); 
fireLight.position.set(4, 2, 0);
scene.add(fireLight);
const audio = document.getElementById('music');
const hitSound = document.getElementById('hit');
const growlSound = document.getElementById('growl');
const deathSound = document.getElementById('death');
const fireSound = document.getElementById('fire');
audio.volume = 0.1;
let firePlaying = false;

{
const loader = new THREE.TextureLoader();
const texture = loader.load(
    // './skycube.jpg',
    './star_skycube.jpg',

    // 'https://assetstorev1-prd-cdn.unity3d.com/package-screenshot/992364fa-5f0a-406a-af9e-73b2807f7b89_scaled.jpg',
    // 'https://threejs.org/manual/examples/resources/images/equirectangularmaps/tears_of_steel_bridge_2k.jpg',
    () => {

        texture.mapping = THREE.EquirectangularReflectionMapping;
        texture.colorSpace = THREE.SRGBColorSpace;
        scene.background = texture;

    } );
}

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const globeSize = 40;

var snowmenKilled = 0;
var playerHealth = 100;

camera.lookAt(0, 0, 0);
camera.position.set(2, 0, 4);

var snowballsLeft = 15;
document.getElementById("snowballs").innerHTML = snowballsLeft

const flashlightColor = 0xFFFFAF;
const flashlightIntensity = 50;
const flashlight = new THREE.SpotLight(flashlightColor, flashlightIntensity);

flashlight.angle = Math.PI / 5; // Beam spread angle
flashlight.penumbra = 0.3; // Soft edge of the light cone
flashlight.decay = 2; // Light decay over distance
flashlight.distance = 100; // Maximum range of the light

flashlight.position.set(0, 10, 0); // Position the light at the camera
flashlight.target.position.set( - 5, 0, 0 );
scene.add(flashlight);

scene.add(flashlight.target);


const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

// Custom shader for red tint
const RedTintShader = {
    uniforms: {
        tDiffuse: { value: null },
        tint: { value: new THREE.Vector3(1.0, 0.0, 0.0) }, // RGB tint values
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform vec3 tint;
        varying vec2 vUv;
        void main() {
            vec4 color = texture2D(tDiffuse, vUv);
            color.rgb += tint * 0.3; // Apply the red tint
            gl_FragColor = color;
        }
    `,
};
const redTintPass = new ShaderPass(RedTintShader);
composer.addPass(redTintPass);


const movement = { forward: false, backward: false, left: false, right: false , up: false, down: false};
const moveSpeed = 0.07;




var playing = false;

var flashlightOn = true;

const statics = []; // To hold the grouped meshes
const flames = [];
const snowmen = [{                        
            mesh: camera,
            health: 2,
            radius: 0.5
}];


let flashlightShake = [0,0];
let headBob = 0;

const snowballs = [];

const snowPiles = [];

const meshes={}


let cameraRotation = { x: 0, y: 0 };
let rotationX = 0; // Pitch (up and down)
let rotationY = 0; // Yaw (left and right)
const sensitivity = 0.006;
var yaw = 0;
var pitch = 0;
function handleMouseMove(event) {
    const deltaX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    const deltaY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

    // Adjust rotation angles
    rotationY -= deltaX * sensitivity; // Horizontal rotation (yaw)
    rotationX -= deltaY * sensitivity; // Vertical rotation (pitch)

    // Clamp the pitch to avoid flipping
    rotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotationX));

    const quaternion = new THREE.Quaternion();

    quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotationY);
    const pitchQuaternion = new THREE.Quaternion();
    pitchQuaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), rotationX);
    quaternion.multiply(pitchQuaternion);
    camera.quaternion.copy(quaternion);

}


var chargeStart = -1;
function handleMouseUp(event) {

    if (snowballsLeft <= 0){
        return;
    }

    
    if (chargeStart < 0){
        return;
    }
    // const power = 10;//
    const power = Math.max(4,Math.min((Date.now()-chargeStart)/30, 10))
    let sb = undefined;
    const rotX = Math.min(rotationX+0.5, Math.PI)
    if (snowballs.length > 20){
        for (let i=0; i<snowballs.length; i+=1){
            if (snowballs[i].alive == false){
                sb = snowballs[i]
                scene.add(sb.mesh)
                sb.mesh.position.set(camera.position.x, camera.position.y, camera.position.z);
                sb.speed = [Math.sin(rotationY+Math.PI)*power, Math.sin(rotX)*power, Math.cos(rotationY+Math.PI)*power],

                sb.alive=true;
                break
            }
        }
    } else {
        const geometry = new THREE.SphereGeometry(0.1, 32, 32); // Radius: 5, Width Segments: 32, Height Segments: 32
        const material = new THREE.MeshPhongMaterial( { color: 0xffffff } );
        const cube = new THREE.Mesh( geometry, material );
        cube.position.set(camera.position.x, camera.position.y, camera.position.z);
        scene.add(cube);

        sb = {
            speed: [Math.sin(rotationY+Math.PI)*power, Math.sin(rotX)*power, Math.cos(rotationY+Math.PI)*power],
            start: Date.now(),
            alive: true,
            mesh: cube
        }

        snowballs.push(sb)
    }
    chargeStart = -1;
    snowballsLeft-=1;
    document.getElementById("snowballs").innerHTML = snowballsLeft;
}

function handleMouseDown(event) {

    if (event.button == 2) {
        if (flashlightOn){
            flashlight.intensity=0;
            flashlightOn = false;
        } else {
            flashlightOn = true;
            flashlight.intensity = 50;
        }
    } else {
        chargeStart=Date.now()
        const element = document.body;
        if (document.pointerLockElement === element) {
            
        } else if (playerHealth > 0) {
            element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
            element.requestPointerLock();
            document.getElementById("pause").style.visibility="hidden";
            document.getElementById("pause").innerHTML = "Paused"
            playing = true;
            chargeStart = -1;
            return;
        }
    }
}


function createGeometry(mesh) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(mesh.points, 3));
    
    if (mesh.hasOwnProperty('texcoords')) {
        geometry.setAttribute('uv', new THREE.BufferAttribute(mesh.texcoords, 2));
    }

    geometry.setIndex(new THREE.Uint32BufferAttribute(mesh.faceVertexIndices, 1));
    geometry.computeVertexNormals();
    return geometry;
}

function createMaterial(usd, usdMaterial) {
    if (usdMaterial.hasOwnProperty('diffuseColorTextureId')) {
        const diffTex = usd.getTexture(usdMaterial.diffuseColorTextureId);
        const img = usd.getImage(diffTex.textureImageId);

        const image8Array = new Uint8ClampedArray(img.data);
        const imgData = new ImageData(image8Array, img.width, img.height);

        const texture = new THREE.DataTexture(imgData, img.width, img.height);
        texture.flipY = true;
        texture.needsUpdate = true;

        return new THREE.MeshBasicMaterial({ map: texture });
    }

    return new THREE.MeshNormalMaterial();
}


let keyPresses = {};
let playAudio = false;
let audioPlaying = false;

document.addEventListener('keydown', (event) => {
      switch (event.code) {
        case 'KeyW': movement.forward = true; break;
        case 'KeyS': movement.backward = true; break;
        case 'KeyA': movement.left = true; break;
        case 'KeyD': movement.right = true; break;
        case 'ShiftLeft': movement.down = true; break;
        case 'ShiftRight': movement.down = true; break;
        case 'Space': movement.up = true; break;
        case 'KeyP': playAudio = !playAudio; break;
      }
    });

document.addEventListener('keyup', (event) => {
  switch (event.code) {
    case 'KeyW': movement.forward = false; break;
    case 'KeyS': movement.backward = false; break;
    case 'KeyA': movement.left = false; break;
    case 'KeyD': movement.right = false; break;
    case 'ShiftLeft': movement.down = false; break;
    case 'ShiftRight': movement.down = false; break;
    case 'Space': movement.up = false; break;
  }
});


document.addEventListener('mousemove', handleMouseMove);

document.addEventListener('mousedown', handleMouseDown);

document.addEventListener('mouseup', handleMouseUp);


function makeCube(scene){
  // const geometry = new THREE.BoxGeometry( 1, 1, 1 );
  

  const geometry = new THREE.CylinderGeometry(
      globeSize, // Top radius
      globeSize, // Bottom radius
      0.1, // Height
      32 // Radial segments
    );
    const material = new THREE.MeshPhongMaterial( { color: 0xafffff } );

    // const material2 = new THREE.MeshBasicMaterial({ color: 0xafffff, wireframe: false });

    const cylinder = new THREE.Mesh(geometry, material);
    cylinder.position.y = -0.1
    // Add the cylinder to the scene
    scene.add(cylinder);
}


async function loadUSDZMeshes(usdBinary, filepath) {
    let color = [1,0,1];
    if (filepath == "./flames.usdz"){
        color = [1, 0.05, 0];
    }
    const TinyUSDZLoader = await initTinyUSDZ();
    const usd = new TinyUSDZLoader.TinyUSDZLoader(usdBinary);

    const group = new THREE.Group();

    let index = 0;
    while (true) {
            const mesh = usd.getMesh(index);
            if ('faceVertexIndices' in mesh){} else{break;}

            const usdMaterial = usd.getMaterial(mesh.materialId);
            const geometry = createGeometry(mesh);
            const originalMaterial = createMaterial(usd, usdMaterial);

            let material = new THREE.MeshPhongMaterial({
                color: originalMaterial.color || new THREE.Color(color[0], color[1], color[2]), // Use existing color if available
                specular: originalMaterial.specular || new THREE.Color(0.5, 0.5, 0.5), // Specular default
                shininess: originalMaterial.shininess || 0.1, // Shininess default
                map: originalMaterial.map || null, // Use existing map if available
                emissive: originalMaterial.emissive || new THREE.Color(0, 0, 0), // Optional emissive color
            });
            if (filepath == './flames.usdz'){
                material = new THREE.MeshBasicMaterial({
                    color: new THREE.Color(color[0], color[1], color[2])
                    });
            }

            const part = new THREE.Mesh(geometry, material);

            group.add(part);
            index++;
    }

    return group;
}


async function loadAllUSDZFiles(filepaths) {
    const promises = filepaths.map(async (filepath) => {
        const response = await fetch(filepath);
        const data = await response.arrayBuffer();
        const binary = new Uint8Array(data);
        return loadUSDZMeshes(binary, filepath);
    });

    return Promise.all(promises);
}

function getRandomSpot(){
    for (let i=0; i<100; i+=1){
        const x = (Math.random()-0.5)*globeSize*2;
        const y = (Math.random()-0.5)*globeSize*2;
        if (x*x+y*y < globeSize*globeSize){
            return [x, y]
        }
    }
    const d = (Math.random()-0.5)*globeSize*2;
    const a = Math.random()*Math.PI*2
    return [d*Math.cos(a), d*Math.sin(a)]
}

function getRandomSpotIsolated(obstacles, tolerance){

    tolerance = tolerance == undefined ? 1 : tolerance;

    let spot = getRandomSpot();
    let good = true;
    for (let i=0; i<100; i+=1){
        
        good = true;
        for (let k=0; k<obstacles.length; k+=1){
            const dx = obstacles[k].mesh.position.x-spot[0];
            const dz = obstacles[k].mesh.position.z-spot[1];
            if (dx*dx + dz*dz < obstacles[k].radius+tolerance){
                good=false;
                break;
            }
        }
        if (good){
            return spot;
        } else {
            spot = getRandomSpot();
        }
    }
    console.log("failed to find good spot")
    return spot
}

const snowCount = 5000; // Number of snowflakes
const snowGeometry = new THREE.BufferGeometry();
const snowPositions = new Float32Array(snowCount * 3); // x, y, z for each snowflake

for (let i = 0; i < snowCount; i++) {
    const spot = getRandomSpot()
    snowPositions[i * 3] = spot[0]; // x position
    snowPositions[i * 3 + 1] = Math.random() * 50;  // y position
    snowPositions[i * 3 + 2] = spot[1]; // z position
}

snowGeometry.setAttribute('position', new THREE.BufferAttribute(snowPositions, 3));

const snowMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.3,
    transparent: true,
    opacity: 0.9,
});

const snow = new THREE.Points(snowGeometry, snowMaterial);
scene.add(snow);

// Animate the snow
function animateSnow() {
    const positions = snowGeometry.attributes.position.array;
    for (let i = 0; i < snowCount; i++) {
        positions[i * 3 + 1] -= 0.1; // Move each snowflake down slower than raindrops
        if (positions[i * 3 + 1] < 0) {
            positions[i * 3 + 1] = 50; // Reset to top when it reaches the ground
        }
        positions[i * 3] += Math.sin(Date.now() * 0.001 + positions[i * 3 + 1]) * 0.01; // Add slight horizontal sway
    }
    snowGeometry.attributes.position.needsUpdate = true;
}

function makeEvil(sm){
    if (audioPlaying){
        growlSound.play()
    }
    scene.remove(sm.mesh)
    sm.otherMesh = sm.mesh;
    sm.mesh = meshes.evilSnowman.clone();
    sm.health=2+Math.random()*5;
    sm.evil=true;
    sm.mesh.position.x = sm.otherMesh.position.x;
    sm.mesh.position.y = 0.3;
    sm.mesh.position.z = sm.otherMesh.position.z;
    scene.add(sm.mesh)
}
function controlSnowman(s, snowmanNum){

    if (s.health <= 0){

        const t = (Date.now()-s.deathTime)/1000;
        if (t < 4){
            s.mesh.rotation.x = t/5*Math.PI/2;
            s.mesh.position.y = 0.3-(t)*0.3;
            
        } else if (t < 100){
            let ind = snowPiles.length-1;
            if (snowPiles.length > 2){
                for (let i=0; i<snowPiles.length; i+=1){
                    if (snowPiles[i].inactive){
                        snowPiles[i].inactive=false;
                        snowPiles[i].startTime = Date.now()
                        snowPiles[i].mesh.position.set(s.mesh.position.x, 1, s.mesh.position.z);
                        scene.add(snowPiles[i].mesh);
                        break
                    }
                }
            } else {
                const geometry = new THREE.SphereGeometry(0.5, 32, 32); // Radius: 5, Width Segments: 32, Height Segments: 32
                const material = new THREE.MeshPhongMaterial( { color: 0xffffff } );
                const mesh = new THREE.Mesh( geometry, material );
                mesh.position.set(s.mesh.position.x, 0.5, s.mesh.position.z);
                scene.add(mesh);
                const n = {
                    mesh: mesh,
                    inactive: false,
                    startTime: Date.now(),
                };
                snowPiles.push(n);
            }

            const hold = s.mesh;
            scene.remove(s.mesh)
            s.mesh = s.otherMesh;
            s.otherMesh = hold;
            s.health = 1;
            s.evil = false;

            let spot = getRandomSpotIsolated(statics);
            for (let j=0; j<10; j+=1) {
                if (spot[0]*spot[0]+spot[1]*spot[1] > 7*7){
                    break;
                }
                spot = getRandomSpotIsolated(statics);       
            }
            s.mesh.position.x = spot[0];
            s.mesh.position.z = spot[1];
            scene.add(s.mesh)


        }

        return
    }

    let turnSpeed = 0.03;
    let moveSpeed = 0.02;
    let m = s.mesh;

    if (s.evil) {
        s.target = [camera.position.x, camera.position.z]
        turnSpeed = 0.08;
        moveSpeed = 0.06;
    } else {
        if (Date.now()-s.targetTime > 20000){ // taking > 20 seconds to get to target
            s.target = getRandomSpot();
            s.targetTime = Date.now();
        } 
        const ddx = m.position.x-4;
        const ddz = m.position.z;
        if (ddx*ddx+ddz*ddz < 4*4){
            s.target = [(m.position.x-4)*2, m.position.z*2];
            s.targetTime = Date.now();
            turnSpeed = 0.2;
            moveSpeed = 0.001;
        }
        const dx = camera.position.x-m.position.x;
        const dz = camera.position.z-m.position.z;
        if (dz*dz+ dx*dx < 2*2){
            makeEvil(s);
        }
    }

    let r = m.rotation.z
    if (s.evil){
        r = m.rotation.y;
    }
    const angle = (-Math.atan2(m.position.z-s.target[1], m.position.x-s.target[0]) + 3*Math.PI/2) % (2*Math.PI);
    let difference = ((angle - (r%(2*Math.PI)) + Math.PI) % (2 * Math.PI)) - Math.PI;
    difference = difference < -Math.PI ? difference + 2 * Math.PI : difference;
    if (s.evil){
        m.rotation.y += difference*turnSpeed;
    } else {
        m.rotation.z += difference*turnSpeed;
    }
    const dx = m.position.x-s.target[0]
    const dy = m.position.z-s.target[1]
    const distance = Math.sqrt(dx*dx+dy*dy)
    if (distance < 1 && s.evil == false){
        s.target = getRandomSpot();
        s.targetTime = Date.now();
    } else if (distance < 1.5 && s.evil) {
        if (Date.now()-s.lastHit > 500){
            playerHealth -= 10;
            camera.position.y=1.2;
            lastHitTime = Date.now();

            document.getElementById("health").innerHTML = playerHealth;
            if (playerHealth <= 0){
                document.getElementById("youLose").style.visibility="visible";
                if (snowmenKilled > highScore){
                    document.getElementById("youLose").value = "New High Score! " + snowmenKilled + " was " + highScore;
                    localStorage.setItem("highscore", snowmenKilled);
                    console.log("new high score", highScore);
                } else {
                    document.getElementById("youLose").value = "You lose! High score: " + highScore;

                    console.log("not high score", highScore, snowmenKilled)
                }

                const element = document.body;
                if (document.pointerLockElement === element) {
                    document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock || document.webkitExitPointerLock;
                    document.exitPointerLock();
                    console.log("out ptr")
                }
            }
            s.lastHit = Date.now();
        }
    }

    const direction = new THREE.Vector3();
    direction.x = Math.sin(r)*Math.min(distance,2)*moveSpeed;
    direction.z = Math.cos(r)*Math.min(distance,2)*moveSpeed;
    const mv = testCollisions(m.position.x, m.position.z, direction, snowmanNum)
    // direction.x = mv.x;
    // direction.z = mv.z;
    // console.log(direction)

    m.position.add(mv)
    
}  

function controlSnowball(s){
    if (s.alive){
        s.mesh.position.x+=s.speed[0]*0.01
        s.mesh.position.y+=s.speed[1]*0.01
        s.mesh.position.z+=s.speed[2]*0.01
        s.speed[1]-=0.05;

        for (let i=1; i<snowmen.length; i+=1){
            const sm = snowmen[i];
            if (sm.health>=0){
                let m = sm.mesh;
                const dx = m.position.x-s.mesh.position.x;
                const dy = m.position.y-s.mesh.position.y;
                const dz = m.position.z-s.mesh.position.z;
                if (Math.abs(dy) < 1 & dx*dx+dz*dz < 0.5){
                    sm.health-=1;
                    if (audioPlaying){
                        hitSound.play();
                    }
                    if (sm.health <= 0){
                        if (sm.evil == false) {
                            makeEvil(sm);
                        } else {
                            if (audioPlaying){
                                deathSound.play();
                            }
                            sm.deathTime = Date.now();
                            snowmenKilled += 1;
                            document.getElementById("snowmenKilled").innerHTML="Snowmen Eliminated: " + snowmenKilled;
                        }
                    }
                    scene.remove(s.mesh)
                    s.alive=false;
                }
            }
        }

        for (let i=0; i<statics.length; i+=1){
            
            const sm = statics[i];
            let m = sm.mesh;
            const dx = m.position.x-s.mesh.position.x;
            const dy = m.position.y-s.mesh.position.y;
            const dz = m.position.z-s.mesh.position.z;
            if (Math.abs(dy) < 3 & dx*dx+dz*dz < statics[i].radius*statics[i].radius){
                if (audioPlaying){
                    hitSound.play();
                }
                scene.remove(s.mesh)
                s.alive=false;
            }
            
        }


        if (s.mesh.position.y < -0.1){
            if (audioPlaying){
                hitSound.play();
            }
            s.mesh.position.y = -10;
            scene.remove(s.mesh)
            s.alive=false;
        }
    }
}



function testCollisions(x, z, direction, snowmanNum){
    x += direction.x
    z += direction.z
    for (let i=0; i<statics.length+snowmen.length; i+=1){
        let rad = undefined;
        let s = undefined
        if (i < statics.length){
            rad = statics[i].radius;
            s = statics[i].mesh;
        } else {
            if (i-statics.length == snowmanNum){
                continue;
            }
            rad = snowmen[i-statics.length].radius;
            s = snowmen[i-statics.length].mesh;
        }
        const dx = x - s.position.x
        const dz = z - s.position.z
        if (dx*dx+dz*dz < (rad+0.5)*(rad+0.5)){
            // console.log("hit")
            if (dx*dx+dz*dz < rad*rad){ // really inside
                direction.x = 1;
                direction.z = 0;
            } else{
                const d = handleCollision([x, z], [s.position.x, s.position.z], [direction.x, direction.z])
                direction.x = d[0]
                direction.z = d[1]
            }
            break;
        }
      }
      return direction
}

function handleCollision(movingCircle, stationaryCircle, velocity) {
    const [x1, y1] = movingCircle; // Position of the moving circle
    const [x2, y2] = stationaryCircle; // Position of the stationary circle
    const [dx, dy] = velocity; // Velocity of the moving circle
    const collisionVectorX = x1 - x2;
    const collisionVectorY = y1 - y2;
    const collisionMagnitude = Math.sqrt(collisionVectorX ** 2 + collisionVectorY ** 2);
    const nx = collisionVectorX / collisionMagnitude;
    const ny = collisionVectorY / collisionMagnitude;
    const dotProduct = dx * nx + dy * ny;
    const reflectedDx = dx - 2 * dotProduct * nx;
    const reflectedDy = dy - 2 * dotProduct * ny;
    return [reflectedDx, reflectedDy];
}


var lastHitTime = 0;
var lastFpsTime = Date.now();
var lastSnowmanTime = Date.now();
var iteration = 0;
var grounded = true;
var ySpeed = 0;

function animate() {

    if (playerHealth <= 0){
        return
    }

    if (!audioPlaying && playAudio){
        audio.play();
        audioPlaying = true;
    } else if (audioPlaying && !playAudio){
        audio.pause();
        audioPlaying = false;
    }

    const element = document.body;
    if (playing == false || document.pointerLockElement !== element) {
        document.getElementById("pause").style.visibility="visible";
        document.getElementById("back").style.visibility="visible";
        return;
    } else if (playing && document.pointerLockElement === element){
        document.getElementById("pause").style.visibility="hidden";
        document.getElementById("back").style.visibility="hidden";
    }

    if (Date.now()-lastFpsTime > 500){
        document.getElementById("fps").innerHTML = "FPS: " + Math.floor(iteration*1000/(Date.now()-lastFpsTime));
        iteration=0;
        lastFpsTime = Date.now();
        
        
    }


    iteration+=1;

    // Move the camera based on key input
    const direction = new THREE.Vector3();

    if (movement.forward) {
        direction.z -= moveSpeed;
    } if (movement.backward) {
        direction.z += moveSpeed;
    } if (movement.left) {
        direction.x -= moveSpeed;
    } if (movement.right) {
        direction.x += moveSpeed;
    } if (movement.up){
        if (grounded){
            ySpeed = 0.2;
            grounded = false;
        }
    }


    // Rotate direction vector by the camera's rotation
    direction.applyEuler(camera.rotation);

    direction.y = ySpeed;

    const dd = testCollisions(camera.position.x, camera.position.z, direction, 0);

    camera.position.add(dd);
    if (camera.position.y <= 0.8){
        camera.position.y = 0.8;
        grounded = true;
    } else if (camera.position.y > 0.8) {
        ySpeed -= 0.01
        camera.position.y -= 0.01;
    }
    // if (movement.up && camera.position.y)
    const d = Math.sqrt(camera.position.x*camera.position.x + camera.position.z*camera.position.z)
    if (d > globeSize){
        camera.position.x = camera.position.x*globeSize/d;
        camera.position.z = camera.position.z*globeSize/d;
    }


    animateSnow();

    for (let i=0; i<flames.length; i+=1){
        flames[i].position.y = Math.sin(Date.now()/1000+i*Math.PI/2)*0.1-0.2;
        flames[i].rotation.y += 0.01*i
    }

    for (let i=0; i<snowballs.length; i+=1){
        controlSnowball(snowballs[i]);
    }

    if (Date.now()-lastSnowmanTime > 20){
        for (let i=1; i<snowmen.length; i+=1){
            controlSnowman(snowmen[i], i);
        }
        lastSnowmanTime = Date.now();
    }


    let shakeAmt = 0.1;
    let shakeFreq = 0.01;
    if (Math.abs(dd.x)+Math.abs(dd.z)>0){ // running
        shakeAmt = 0.2;
        shakeFreq = 0.09;
        if (grounded){
            headBob = (Math.sin(Date.now()/200)+0.5)*0.1
            camera.position.y = 0.8+headBob
        }
    }

    if (audioPlaying){
        if (camera.position.x*camera.position.x+camera.position.z*camera.position.z < 8*8){
            if (!firePlaying){
                fireSound.play()
                firePlaying = true;
            }
        } else {
            if (firePlaying){
                fireSound.pause()
                firePlaying = false;
            }
        }
    }

    flashlightShake[0] += shakeFreq
    flashlightShake[1] += shakeFreq*0.8;

    const forwardDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).normalize();

    forwardDirection.x += Math.sin(flashlightShake[0])*shakeAmt*0.5;
    forwardDirection.y += Math.sin(flashlightShake[1]+Math.PI/4)*shakeAmt;

    const targetPosition = camera.position.clone().add(forwardDirection);
    flashlight.position.copy(camera.position);
    flashlight.target.position.copy(targetPosition);
    flashlight.target.updateMatrixWorld(); 

    if (Date.now()%5==0){
        fireLight.intensity = 30 + Math.random() * 20; // Random intensity between 1.0 and 1.5
        const colorVariation = Math.random() * 0.01;
        fireLight.color.setHSL(0.05 + colorVariation, 1, 0.5); // Slight variations in hue
    }

    for (let i=0; i<snowPiles.length; i+=1){
        if (snowPiles[i].inactive==false){
            if (Date.now()-snowPiles[i].startTime > 20000){
                snowPiles[i].inactive=true;
                scene.remove(snowPiles[i].mesh);
            } else {
                const dx = camera.position.x - snowPiles[i].mesh.position.x;
                const dz = camera.position.z - snowPiles[i].mesh.position.z;
                if (dx*dx+dz*dz < 1){
                    snowballsLeft += 10;
                    document.getElementById("snowballs").innerHTML = snowballsLeft;

                    snowPiles[i].inactive=true;
                    scene.remove(snowPiles[i].mesh);
                }
            }

        }
    }

    if (flashlightOn) {
        flashlight.intensity = 10 * (1+Math.sin(Date.now()/2000))/2+10;
    }

    if (Date.now()-lastHitTime < 1000){
        composer.render();
    } else {
        renderer.render(scene, camera);
    
    }
}
makeCube(scene);

(async () => {
    

    const loadedMeshes = await loadAllUSDZFiles(USDZ_FILEPATHS);

    for (let meshID=0; meshID<loadedMeshes.length; meshID+=1){
        const group = loadedMeshes[meshID];
        if (USDZ_FILEPATHS[meshID] == './Snowman.usdz'){
            group.scale.set(0.01,0.01,0.01);
            group.rotation.x = -Math.PI/2;

            for (let i=0; i<30; i+=1){
                let spot = getRandomSpotIsolated(statics);
                for (let j=0; j<10; j+=1) {
                    if (spot[0]*spot[0]+spot[1]*spot[1] > 7*7){
                        break;
                    }
                    spot = getRandomSpotIsolated(statics);       
                }
                
                const g = group.clone()
                g.position.x = spot[0];
                g.position.z = spot[1];
                scene.add(g);
                const s = {
                    mesh: g,
                    target: getRandomSpot(),
                    targetTime: Date.now(),
                    lastHit:0,
                    health: 1,
                    evil: false,
                    radius: 0.5
                }

                snowmen.push(s)
            }
        } if (USDZ_FILEPATHS[meshID] == './igloo.usdz'){
            group.scale.set(1.5,1.5,1.5);
            group.rotation.x = -Math.PI/2;
            const g = group.clone()
            g.position.x = 0;
            g.position.z = 0;
            const s = {
                mesh: g,
                type: "igloo",
                radius: 2,
            }
            scene.add(g);
            statics.push(s);
        } if (USDZ_FILEPATHS[meshID] == './tree.usdz'){
            group.scale.set(0.5,0.5,0.5);

            for (let i=0; i<160; i+=1){
                const spot = getRandomSpotIsolated(statics, 5);
                if (spot[0]*spot[0]+spot[1]*spot[1] < 5*5){
                    continue
                }

                const g = group.clone();

                g.position.x = spot[0];
                g.position.z = spot[1];
                const s = {
                    mesh: g,
                    type: "tree",
                    radius: 1,
                }
                scene.add(g);
                statics.push(s);
                      
            }
        } if (USDZ_FILEPATHS[meshID] == './snowman_evil.usdz'){
            group.scale.set(0.7,0.7,0.7);
            group.position.y = 0.3;
            meshes.evilSnowman = group;

        } if (USDZ_FILEPATHS[meshID] == './fire.usdz'){
            group.scale.set(0.2,0.2,0.2);
            const g = group.clone()
            g.position.x = 4;
            g.position.z = 0;
            g.position.y = 0;
            scene.add(g);
            // statics.push(g);
        } if (USDZ_FILEPATHS[meshID] == './flames.usdz'){
            
            for (let i=0; i<3; i+=1){
                const g = group.clone()
                g.scale.set(0.3,0.4,0.3);
                g.position.x = 4;
                g.position.z = 0;
                g.position.y = -0.1;
                scene.add(g);
                flames.push(g);
            }

            

        }
        
    }
    // loadedMeshes.forEach((group) => {
    //     scene.add(group);
    //     cubes.push(group);
    // });

    // camera.position.z = 4.0;
    // camera.position.y = 0.0;

    renderer.setAnimationLoop(animate);
})();
