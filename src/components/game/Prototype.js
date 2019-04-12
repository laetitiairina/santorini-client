import * as THREE from "three";
import DragControls from 'three-dragcontrols';
import OrbitControls from 'three-orbitcontrols';

// variables for three.js
const blockHeight = 3;
const blockSize = 4.5;

let container;
let camera, scene, renderer;
let board;
let blockMaterial = new THREE.MeshLambertMaterial( { color: 0xaaaaaa } );
let blocks = [];
let workers = [];
let raycaster;
let mouse = new THREE.Vector2();
let draged = false;
let fields = {
  "-10": {},
  "-5": {},
  "0": {},
  "5": {},
  "10": {},
};

export function animate() {
  requestAnimationFrame(animate);
  renderer.render( scene, camera );
}

export function  init() {

  container = document.createElement( 'div' );
  container.style.position = "fixed";
  container.style.bottom = "20px";
  container.style.left = "50px";
  container.style.zIndex = "-1";
  document.body.appendChild( container );

  camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.25, 100);
  camera.position.set( -55, 40, 50 );
  camera.lookAt( new THREE.Vector3( 0, 2, 0 ) );

  scene = new THREE.Scene();

  // lights

  let light = new THREE.HemisphereLight( 0xffffff, 0x444444 );
  light.position.set( 0, 20, 0 );
  scene.add( light );

  light = new THREE.DirectionalLight( 0xffffff );
  light.position.set( 0, 10, 20 );
  scene.add( light );

  // ground

  board = new THREE.Mesh( new THREE.PlaneBufferGeometry( 25, 25 ), new THREE.MeshLambertMaterial( { color: 0x118811, depthWrite: false } ) );
  board.rotation.x = - Math.PI / 2;
  scene.add( board );

  let grid = new THREE.GridHelper( 25, 5, 0x000000, 0x000000 );
  grid.material.opacity = 0.2;
  grid.material.transparent = true;
  scene.add( grid );

  // models

  //var texture = new THREE.TextureLoader().load( 'textures/crate.gif' );
  let block = new THREE.Mesh( new THREE.BoxBufferGeometry( blockSize, blockHeight, blockSize ), blockMaterial);
  block.position.set( 0, blockHeight / 2, 0 );
  scene.add( block );
  blocks.push( block );
  fields[0][0] = 1;

  let color1 = Math.random() * 0xffffff;
  let color2 = Math.random() * 0xffffff;
  let workerColors = [color1, color1, color2, color2];
  for ( let i = 0; i < 4; i++ ) {
    let worker = new THREE.Mesh( new THREE.CylinderBufferGeometry( 0,1,4,20 ), new THREE.MeshLambertMaterial( { color: workerColors[i] } ) );
    worker.position.set( 5 - 5 * i, 2, 10 - 5 * i );
    scene.add( worker );
    workers.push( worker );
  }

  for ( let i = 0; i < 2; i++ ) {
    let card = new THREE.Mesh( new THREE.BoxBufferGeometry( 10, 0.1, 5 ), new THREE.MeshLambertMaterial( { color: 0xccaa11 } ) );
    card.position.set( 20 - 40 * i, 0, 5 - 10 * i );
    scene.add( card );
  }

  renderer = new THREE.WebGLRenderer({ antialias: false, alpha:true });
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.gammaOutput = true;
  renderer.gammaFactor = 2.2;
  container.appendChild( renderer.domElement );

  window.addEventListener( 'resize', onWindowResize, false );

  let controls = new OrbitControls( camera, renderer.domElement );
  controls.mouseButtons.LEFT = THREE.MOUSE.RIGHT;
  controls.enablePan = false;
  controls.minDistance = 10;
  controls.maxDistance = 75;

  raycaster = new THREE.Raycaster();
  container.addEventListener( 'mouseup', onMouseUp, false);

  let dragControls = new DragControls( workers, camera, renderer.domElement );
  dragControls.addEventListener( 'dragstart', function() {

    controls.enabled = false;
    draged = true;

  });

  dragControls.addEventListener( 'dragend', function(event) {

    event.object.position.x = Math.floor( ( event.object.position.x + 2.5 ) / 5 ) * 5;
    event.object.position.z = Math.floor( ( event.object.position.z + 2.5 ) / 5 ) * 5;
    event.object.position.y = 2;
    if ( fields[event.object.position.x][event.object.position.z] ) {
      event.object.position.y += blockHeight * fields[event.object.position.x][event.object.position.z];
    }

    controls.enabled = true;

  })
}

function onMouseUp( event ) {

  if ( draged || event.button !== 0 ) {
    draged = false;
    return;
  }

  event.preventDefault();

  let rect = container.getBoundingClientRect();
  mouse.x = ( ( event.clientX - rect.left ) / rect.width ) * 2 - 1;
  mouse.y = - ( ( event.clientY - rect.top ) / rect.height ) * 2 + 1;

  raycaster.setFromCamera( mouse, camera );

  let intersections = raycaster.intersectObjects( scene.children );

  if ( intersections.length > 0 && intersections[0] !== null ) {

    let block = null;

    if ( blocks.includes( intersections[0].object ) ) {

      let pointX = intersections[0].object.position.x;
      let pointZ = intersections[0].object.position.z;

      if ( fields[pointX][pointZ] > 2 ) {
        return;
      }

      let size = blockSize - 0.2 * fields[pointX][pointZ];

      block = new THREE.Mesh( new THREE.BoxBufferGeometry( size, blockHeight, size ), blockMaterial );
      block.position.set( pointX, blockHeight / 2 + blockHeight * fields[pointX][pointZ], pointZ );

      fields[pointX][pointZ] += 1;

    } else {

      let pointX = Math.floor( ( intersections[0].point.x + 2.5 ) / 5 ) * 5;
      let pointZ = Math.floor( ( intersections[0].point.z + 2.5 ) / 5 ) * 5;

      block = new THREE.Mesh( new THREE.BoxBufferGeometry( blockSize, blockHeight, blockSize ), blockMaterial );
      block.position.set( pointX, blockHeight / 2, pointZ );

      fields[pointX][pointZ] = 1;

    }

    scene.add( block );
    blocks.push( block );

  }

}

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

}