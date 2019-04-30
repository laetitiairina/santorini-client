import React from "react";
import * as THREE from "three";
import DragControls from 'three-dragcontrols';
import OrbitControls from 'three-orbitcontrols';

class Game extends React.Component {

  constructor(props) {
    super(props);
    this.blockHeight = 3;
    this.blockSize = 4.5;
    this.blockMaterial = new THREE.MeshLambertMaterial( { color: 0xaaaaaa } );
    this.blocks = [];
    this.workers = [];
    this.mouse = new THREE.Vector2();
    this.draged = false;
    this.fields = {
      "-10": {},
      "-5": {},
      "0": {},
      "5": {},
      "10": {},
    };
  }

  componentDidMount() {

    this.scene = new THREE.Scene();
    
    // camera
    
    this.camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.25, 200);
    this.camera.position.set( -55, 40, 50 );
    this.camera.lookAt( new THREE.Vector3( 0, 2, 0 ) );

    // lights

    let light = new THREE.HemisphereLight( 0xffffff, 0x444444 );
    light.position.set( 0, 20, 0 );
    this.scene.add( light );

    light = new THREE.DirectionalLight( 0xffffff );
    light.position.set( 0, 10, 20 );
    this.scene.add( light );

    // ground

    this.board = new THREE.Mesh( new THREE.PlaneBufferGeometry( 25, 25 ), new THREE.MeshLambertMaterial( { color: 0x118811, depthWrite: false } ) );
    this.board.rotation.x = - Math.PI / 2;
    this.scene.add( this.board );

    this.grid = new THREE.GridHelper( 25, 5, 0x000000, 0x000000 );
    this.grid.material.opacity = 0.2;
    this.grid.material.transparent = true;
    this.scene.add( this.grid );

    // models

    //var texture = new THREE.TextureLoader().load( 'textures/crate.gif' );
    let block = new THREE.Mesh( new THREE.BoxBufferGeometry( this.blockSize, this.blockHeight, this.blockSize ), this.blockMaterial);
    block.position.set( 0, this.blockHeight / 2, 0 );
    this.scene.add( block );
    this.blocks.push( block );
    this.fields[0][0] = 1;

    let color1 = Math.random() * 0xffffff;
    let color2 = Math.random() * 0xffffff;
    let workerColors = [color1, color1, color2, color2];
    for ( let i = 0; i < 4; i++ ) {
      let worker = new THREE.Mesh( new THREE.CylinderBufferGeometry( 0,1,4,20 ), new THREE.MeshLambertMaterial( { color: workerColors[i] } ) );
      worker.position.set( 5 - 5 * i, 2, 10 - 5 * i );
      this.scene.add( worker );
      this.workers.push( worker );
    }

    for ( let i = 0; i < 2; i++ ) {
      let card = new THREE.Mesh( new THREE.BoxBufferGeometry( 10, 0.1, 5 ), new THREE.MeshLambertMaterial( { color: 0xccaa11 } ) );
      card.position.set( 20 - 40 * i, 0, 5 - 10 * i );
      this.scene.add( card );
    }
    
    // renderer

    this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha:true });
    this.renderer.setPixelRatio( window.devicePixelRatio );
    this.renderer.setSize( window.innerWidth, window.innerHeight );
    this.renderer.gammaOutput = true;
    this.renderer.gammaFactor = 2.2;
    this.container.appendChild(this.renderer.domElement);

    window.addEventListener( 'resize', this.onWindowResize, false );

    // orbit controls
    
    this.controls = new OrbitControls( this.camera, this.renderer.domElement );
    this.controls.mouseButtons.LEFT = THREE.MOUSE.RIGHT;
    this.controls.enablePan = false;
    this.controls.minDistance = 50;
    this.controls.maxDistance = 100;

    // raycaster
    
    this.raycaster = new THREE.Raycaster();
    this.container.addEventListener( 'mouseup', this.onMouseUp, false);
    
    // drag controls

    this.dragControls = new DragControls( this.workers, this.camera, this.renderer.domElement );
    this.dragControls.addEventListener( 'dragstart', this.onDragStart);
    this.dragControls.addEventListener( 'dragend', this.onDragEnd);
    
    // start animation loop
    
    this.animate();
  }
  
  animate = () => {
    window.requestAnimationFrame(this.animate);
    this.renderer.render(this.scene, this.camera);
  }
  
  onDragStart = (event) => {
    this.controls.enabled = false;
    this.draged = true;
  }
  
  onDragEnd = (event) => {
    event.object.position.x = Math.floor( ( event.object.position.x + 2.5 ) / 5 ) * 5;
    event.object.position.z = Math.floor( ( event.object.position.z + 2.5 ) / 5 ) * 5;
    event.object.position.y = 2;
    if ( this.fields[event.object.position.x][event.object.position.z] ) {
      event.object.position.y += this.blockHeight * this.fields[event.object.position.x][event.object.position.z];
    }

    this.controls.enabled = true;
  }

  onMouseUp = (event) => {

    if ( this.draged || event.button !== 0 ) {
      this.draged = false;
      return;
    }

    event.preventDefault();

    let rect = this.container.getBoundingClientRect();
    this.mouse.x = ( ( event.clientX - rect.left ) / rect.width ) * 2 - 1;
    this.mouse.y = - ( ( event.clientY - rect.top ) / rect.height ) * 2 + 1;

    this.raycaster.setFromCamera( this.mouse, this.camera );

    let intersections = this.raycaster.intersectObjects( this.scene.children );

    if ( intersections.length > 0 && intersections[0] !== null ) {

      let block = null;

      if ( this.blocks.includes( intersections[0].object ) ) {

        let pointX = intersections[0].object.position.x;
        let pointZ = intersections[0].object.position.z;

        if ( this.fields[pointX][pointZ] > 2 ) {
          return;
        }

        let size = this.blockSize - 0.2 * this.fields[pointX][pointZ];

        block = new THREE.Mesh( new THREE.BoxBufferGeometry( size, this.blockHeight, size ), this.blockMaterial );
        block.position.set( pointX, this.blockHeight / 2 + this.blockHeight * this.fields[pointX][pointZ], pointZ );

        this.fields[pointX][pointZ] += 1;

      } else {

        let pointX = Math.floor( ( intersections[0].point.x + 2.5 ) / 5 ) * 5;
        let pointZ = Math.floor( ( intersections[0].point.z + 2.5 ) / 5 ) * 5;

        block = new THREE.Mesh( new THREE.BoxBufferGeometry( this.blockSize, this.blockHeight, this.blockSize ), this.blockMaterial );
        block.position.set( pointX, this.blockHeight / 2, pointZ );

        this.fields[pointX][pointZ] = 1;

      }

      this.scene.add(block);
      this.blocks.push(block);

    }

  }

  onWindowResize = () => {

    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize( window.innerWidth, window.innerHeight );

  }
  
  render() {
    return (
      <div ref={container => { this.container = container }} />
    )
  }
}

export default Game;
