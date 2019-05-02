import React from "react";
import * as THREE from "three";
import DragControls from 'three-dragcontrols';
import OrbitControls from 'three-orbitcontrols';

class Game extends React.Component {

  constructor(props) {
    super(props);
    this.cameraNear = 0.25;
    this.cameraFar = 300;
    this.cards = [];
    this.blockHeight = 3;
    this.blockSize = 4.5;
    this.blockMaterial = new THREE.MeshLambertMaterial( { color: 0xaaaaaa } );
    this.blocks = [];
    this.myWorkers = [];
    this.oppoWorkers = [];
    this.mouse = new THREE.Vector2();
    this.blockDraged = false;
    this.fields = {
      "-10": {},
      "-5": {},
      "0": {},
      "5": {},
      "10": {},
    };
    this.playStartAnimation = false;
    this.playInitAnimation = true;
    this.waterSpeed = 0.03;
    this.inputEnabled = false;
    
    // Access via this.props.game instead
    /*
    this.state = {
      game: null // game object, ex. {"status":"MOVE", "board": ...}
    };
    */
  }

  componentDidMount() {

    // scene

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color( 0x60c0ff );
    this.scene.fog = new THREE.Fog(0x60c0ff, 250, this.cameraFar);
    
    // camera
    
    this.camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, this.cameraNear, this.cameraFar);
    this.camera.position.set( 50, 100, 500 );
    this.camera.lookAt( new THREE.Vector3( 0, 2, 0 ) );
    this.scene.add(this.camera);

    // lights

    this.hemiLight = new THREE.HemisphereLight( 0xcccccc, 0x000000, 0.8);
    this.scene.add( this.hemiLight );

    this.dirLight = new THREE.DirectionalLight( 0xffffff, 0.4);
    this.dirLight.position.set( -50, 200, 200 );
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.left = -50;
    this.dirLight.shadow.camera.right = 50;
    this.dirLight.shadow.camera.top = 50;
    this.dirLight.shadow.camera.bottom = -50;
    this.dirLight.shadow.camera.near = 1;
    this.dirLight.shadow.camera.far = 300;
    this.scene.add( this.dirLight );
    
    this.ambiLight = new THREE.AmbientLight( 0xffcccc, 0.4 );
    this.scene.add( this.ambiLight );

    // water
    
    this.waterGeometry = new THREE.PlaneGeometry( 1000, 1000, 127, 127);
    this.waterMaterial = new THREE.MeshPhongMaterial({ color: 0x60c0ff, shading: THREE.FlatShading });
    this.waterVertices = [];
    this.waterGeometry.rotateX( - Math.PI / 2 );
    this.waterGeometry.mergeVertices();
    this.waterGeometry.vertices.forEach((v) => {
      this.waterVertices.push({
        x: v.x,
        y: v.y,
        z: v.z,
        a: Math.random() * Math.PI * 2,
        A: 0.5 + Math.random() * 1.5,
        v: 0.01 + Math.random() * 0.02
      })
    });
    this.water = new THREE.Mesh( this.waterGeometry, this.waterMaterial );
    this.water.position.y = -10
    this.water.receiveShadow = true;
    this.scene.add( this.water );
    
    // island
    
    this.islandGeometry = new THREE.CylinderGeometry( 25, 35, 20, 10, 10 );
    this.islandMaterial = new THREE.MeshPhongMaterial({ color: 0x22cc22, shading: THREE.FlatShading });
    this.islandGeometry.mergeVertices();
    this.islandGeometry.vertices.forEach((v) => {
      v.x += -1 + Math.random()*2;
      v.y += -1 + Math.random()*2;
      v.z += -1 + Math.random()*2;
    });
    this.island = new THREE.Mesh( this.islandGeometry, this.islandMaterial);
    this.island.position.y = -11.1;
    this.island.receiveShadow = true;
    this.scene.add( this.island );
    
    // board

    this.board = new THREE.Mesh( new THREE.BoxBufferGeometry( 25, 10 , 25 ), new THREE.MeshPhongMaterial({ color: 0x679012, shading: THREE.FlatShading }) );
    //this.board.rotation.x = - Math.PI / 2;
    this.board.position.y = -5;
    this.board.receiveShadow = true;
    this.scene.add( this.board );

    this.grid = new THREE.GridHelper( 25, 5, 0x000000, 0x000000 );
    this.grid.material.opacity = 0.2;
    this.grid.material.transparent = true;
    this.scene.add( this.grid );
    
    // renderer

    this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha:true });
    this.renderer.setPixelRatio( window.devicePixelRatio );
    this.renderer.setSize( window.innerWidth, window.innerHeight );
    this.renderer.gammaOutput = true;
    this.renderer.gammaFactor = 2.2;
    this.renderer.shadowMap.enabled = true; // Comment out to increase performance
    this.container.appendChild(this.renderer.domElement);

    window.addEventListener( 'resize', this.onWindowResize, false );
    
    // raycaster
    
    this.raycaster = new THREE.Raycaster();
    this.container.addEventListener( 'mouseup', this.onMouseUp, false);
    
    // Start animation loop
    this.animate();
  }
  
  // Wait
  wait = (bool) => {
    this.inputEnabled = !bool;
    if (this.dragControlsBlock) {
      this.dragControlsWorker.enabled = !bool;
      this.dragControlsBlock.enabled = !bool;
    }
  }
  
  _displayCard = (posX,posY,posZ, nr) => {
    // TODO: Card textures from nr
    let canvas = document.createElement("canvas");
    let ctx = canvas.getContext('2d');
    canvas.width = canvas.height = 256;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect( 0, 0, canvas.width,canvas.height );
    ctx.font = "50pt Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = 'blue';
    ctx.fillText(nr,canvas.width/2,canvas.height/2);
    let texture = new THREE.CanvasTexture(canvas);
    let card = new THREE.Mesh( new THREE.BoxBufferGeometry( 5, 0.1, 10 ), new THREE.MeshPhongMaterial({ color: 0xccaa11, shading: THREE.FlatShading, map: texture }) );
    card.rotation.x = - Math.PI / 2;
    card.position.set(posX,posY,posZ);
    card.name = nr;
    this.camera.add( card );
    this.cards.push( card );
  }
  
  _displayConfirmButton = (posX,posY,posZ) => {
    // Display confirm button
    let confirmButton = new THREE.Mesh( new THREE.BoxBufferGeometry( 5, 2, 2 ), new THREE.MeshPhongMaterial({ color: 0x0000ff, shading: THREE.FlatShading }) );
    confirmButton.rotation.x = - Math.PI / 2;
    confirmButton.position.set(posX,posY,posZ);
    confirmButton.name = "confirm";
    this.camera.add( confirmButton );
  }
  
  _cleanUpCards = () => {
    let con = this.camera.getObjectByName("confirm");
    this.camera.remove(con);
    this.cards.forEach((card) => {
      this.camera.remove(card);
    })
  }
  
  // Display 10 cards to choose from
  Cards10 = () => {
    this.wait(false);
    
    // Display 10 cards
    for ( let i = 0; i < 10; i++ ) {
      this._displayCard(-12+3*(i-(i%2)), 5-12*(i%2), -40, i+1)
    }
    
    this._displayConfirmButton(0, -15, -40);
    
    // Because of init animation
    if (this.playInitAnimation) {
      this.inputEnabled = false;
      this.camera.children.forEach((child) => {child.visible = false;});
    }
  }
  
  // Display 2 cards to choose from
  Cards2 = () => {
    this.wait(false);
    
    // Display 2 cards
    this.props.game.cards.forEach((card,i) => {
      this._displayCard(-10+20*i, 0, -40, card);
    });
    
    //For testing
    //this._displayCard(-10, 0, -40, 2);
    //this._displayCard(-10+20, 0, -40, 5);
    
    this._displayConfirmButton(0, -15, -40);
  }
  
  
  // Initialization functions (called from GamePage via outputHandler)
  // 1. initCards
  // 2. initWorkers (1)
  // 3. initWorkers (2)
  // 4. initGame
  
  // Initialize game (block bag (a simple block for now) and contorls)
  initGame = () => {
    // Initialize block bag
    this.initBlock = new THREE.Mesh( new THREE.BoxBufferGeometry( this.blockSize, this.blockHeight, this.blockSize ), this.blockMaterial);
    this.initBlock.position.set( 0, this.blockHeight / 2, 20 );
    this.initBlock.castShadow = true;
    this.initBlock.receiveShadow = true;
    this.scene.add( this.initBlock );
    
    // Play camera animation
    this.playStartAnimation = true;
    
    // Initialize controls
    this.initControls();
    
    // Disable controls during camera animation
    this.controls.enabled = false;
  }
  
  // Initialize workers of one player next to board
  // (call once for each player after color was selected)
  // nr represents the order ( so if COLOR1 was selected -> nr=1)
  initWorkers = (nr) => {
    for ( let i = 0; i < 2; i++ ) {
      let worker = new THREE.Mesh( new THREE.CylinderBufferGeometry( 0,1,4,20 ), new THREE.MeshLambertMaterial( { color: "#ff0000" } ) ); // TODO: this.props.game.players[nr].color }));
      worker.position.set( 10 - 3 * i - 17 * (nr-1), 2, 20);
      worker.castShadow = true;
      worker.receiveShadow = true;
      this.scene.add( worker );
      // TODO: if (this.props.game.players[nr].id == localStorage.getItem("player_id")) {
      if (nr == 1) {
        this.myWorkers.push( worker );
      } else {
        this.oppoWorkers.push( worker );
      }
    }
  }
  
  // Initialize Cards
  initCards = () => {
    for ( let i = 0; i < 2; i++ ) {
      // TODO: Use this.props.game to get cards
      let card = new THREE.Mesh( new THREE.BoxBufferGeometry( 10, 0.1, 5 ), new THREE.MeshPhongMaterial({ color: 0xccaa11, shading: THREE.FlatShading }) );
      card.position.set( 20 - 40 * i, 0, 5 - 10 * i );
      card.castShadow = true;
      card.receiveShadow = true;
      this.scene.add( card );
    }
  }
  
  // Inititalize Controls
  initControls = () => {
    // orbit controls
    
    this.controls = new OrbitControls( this.camera, this.renderer.domElement );
    this.controls.mouseButtons.LEFT = THREE.MOUSE.RIGHT;
    this.controls.enablePan = false;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 100;
    
    // drag controls

    this.dragControlsWorker = new DragControls( this.myWorkers, this.camera, this.renderer.domElement );
    this.dragControlsWorker.addEventListener( 'dragstart', this.onDragStartWorker);
    this.dragControlsWorker.addEventListener( 'dragend', this.onDragEndWorker);
    
    this.dragControlsBlock = new DragControls( [this.initBlock] , this.camera, this.renderer.domElement );
    this.dragControlsBlock.addEventListener( 'dragstart', this.onDragStartBlock);
    this.dragControlsBlock.addEventListener( 'dragend', this.onDragEndBlock);
  }
  
  // Input
  // Use this.props.inputHandler() to pass input to GamePage in order to process it
  
  onDragStartWorker = (event) => {
    this.controls.enabled = false;
  }
  
  onDragEndWorker = (event) => {
    event.object.position.x = Math.floor( ( event.object.position.x + 2.5 ) / 5 ) * 5;
    event.object.position.z = Math.floor( ( event.object.position.z + 2.5 ) / 5 ) * 5;
    event.object.position.y = 2;
    if ( this.fields[event.object.position.x][event.object.position.z] ) {
      event.object.position.y += this.blockHeight * this.fields[event.object.position.x][event.object.position.z];
    }

    this.controls.enabled = true;
  }
  
  onDragStartBlock = (event) => {
    this.blockDraged = true;
    this.controls.enabled = false;
    
    this.placeholderBlock = new THREE.Mesh( new THREE.BoxBufferGeometry( this.blockSize, this.blockHeight, this.blockSize ), this.blockMaterial );
    this.placeholderBlock.position.set( 0, this.blockHeight / 2, 20 );
    this.scene.add(this.placeholderBlock);
  }
  
  onDragEndBlock = (event) => {
    this.controls.enabled = true;
    this.scene.remove(this.placeholderBlock);
    
    let pointX = Math.floor( ( event.object.position.x + 2.5 ) / 5 ) * 5;
    let pointZ = Math.floor( ( event.object.position.z + 2.5 ) / 5 ) * 5;
    let pointY = this.blockHeight/2;
    
    if ( this.fields[pointX][pointZ] > 2) {
      this.initBlock.position.set( 0, this.blockHeight / 2, 20 );
      return;
    } else if ( this.fields[pointX][pointZ] ) {
      pointY += this.blockHeight * this.fields[pointX][pointZ];
      this.fields[pointX][pointZ] += 1;
    } else {
      this.fields[pointX][pointZ] = 1;
    }
    
    let block = new THREE.Mesh( new THREE.BoxBufferGeometry( this.blockSize, this.blockHeight, this.blockSize ), this.blockMaterial );
    block.position.set(pointX, pointY, pointZ);
    block.castShadow = true;
    block.receiveShadow = true;
    this.scene.add(block);
    this.blocks.push(block);
    
    this.initBlock.position.set( 0, this.blockHeight / 2, 20 );
  }

  onMouseUp = (event) => {
  
    /*if ( this.workerDraged || event.button !== 0 ) {
      this.workerDraged = false;
      return;
    }*/
    
    /*
    if (!this.blockDraged) {
      return;
    }
    */
    
    if (!this.inputEnabled) {
      return;
    }

    event.preventDefault();

    let rect = this.container.getBoundingClientRect();
    this.mouse.x = ( ( event.clientX - rect.left ) / rect.width ) * 2 - 1;
    this.mouse.y = - ( ( event.clientY - rect.top ) / rect.height ) * 2 + 1;

    this.raycaster.setFromCamera( this.mouse, this.camera );

    let intersections = this.raycaster.intersectObjects( this.camera.children );

    if ( intersections.length > 0 && intersections[0] !== null ) {
      let obj = intersections[0].object
      
      switch("CARDS1"){//(this.props.game.status) {
        case "CARDS1":
        case "CARDS2":
        
          // Get selected cards
          let selectedCardNrs = []
          this.cards.forEach((card) => {
            if (card.position.z > -40) {
              selectedCardNrs.push(card.name);
            }
          })
          
          // Check if confirm button was clicked
          if (obj.name == "confirm") {
            if (this.cards.length == 10 && selectedCardNrs.length == 2) {
              this.props.inputHandler(true,{cards:selectedCardNrs});
              this._cleanUpCards();
            } else if (this.cards.length == 2 && selectedCardNrs.length == 1) {
              this.props.inputHandler(false,{card:selectedCardNrs[0]});
              this._cleanUpCards();
            }
          }
          
          // Toggle card
          if (this.cards.includes(obj)) {
            // Select/Deselect card
            if (obj.position.z <= -40 && ((this.cards.length == 10 && selectedCardNrs.length <= 1) || (this.cards.length == 2 && selectedCardNrs.length == 0))) {
              obj.position.z = -35;
            } else {
              obj.position.z = -40;
            }
          }
          break;
      }

      /*
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
      */
    }
  }
  
  // Output
  
  // TODO: Update game according to this.props.game
  // Display game state
  update = () => {
  
  }
  
  animate = () => {
    // animate
    window.requestAnimationFrame(this.animate);
    this.renderer.render(this.scene, this.camera);
    
    // Animate water
    this.water.geometry.vertices.forEach((v,i) => {
      v.x = this.waterVertices[i].x + Math.cos(this.waterVertices[i].a) * this.waterVertices[i].A
      v.y = this.waterVertices[i].y + Math.sin(this.waterVertices[i].a) * this.waterVertices[i].A
      this.waterVertices[i].a += this.waterVertices[i].v;
    });
    this.water.geometry.verticesNeedUpdate = true;
    this.water.position.z -= this.waterSpeed;
    if ( (this.water.position.z <= (-500 + this.cameraFar) && this.waterSpeed > 0) || (this.water.position.z >= (500 - this.cameraFar) && this.waterSpeed < 0) ) {
      this.waterSpeed *= -1;
      this.water.geometry.vertices.forEach((v,i) => {
        this.waterVertices[i].v *= -1;
      });
    }
    
    // Play initialization animation of camera
    if (this.playInitAnimation) {
      //this.camera.position.x -= 1;
      //this.camera.position.y -= 1;
      this.camera.position.z -= this.camera.position.z/90;
      this.camera.lookAt( new THREE.Vector3( 0, 2, 0 ) );
      if (this.camera.position.z <= 100) {
        //this.camera.position.set( 50, 100, 100 );
        this.playInitAnimation = false;
        
        // Logic
        this.camera.children.forEach((child) => {child.visible = true;});
        this.inputEnabled = true;
        
        this.props.initFinish();
      }
    }
    
    // Play start animation of camera
    if (this.playStartAnimation) {
      // TODO: if (this.props.game.players[0] == localStorage.getItem("player_id")) {
      if (false) {
        this.camera.position.x += 0.1;
        this.camera.position.z -= 1.2;
      } else {
        this.camera.position.x -= 2;
        this.camera.position.z -= 1;
      }
      this.camera.position.y -= 1;
      this.camera.lookAt( new THREE.Vector3( 0, 2, 0 ) );
      if (this.camera.position.y <= 40) {
        //this.camera.position.set( -55, 40, 50 );
        this.playStartAnimation = false;
        
        // Enable controls after camera animation
        this.controls.enabled = true;
      }
    }
  }

  onWindowResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize( window.innerWidth, window.innerHeight );
  }
  
  render() {
    return (
      <div style={{position:"absolute",top:"0px",zIndex:"-1"}} ref={container => { this.container = container }} />
    )
  }
}

export default Game;
