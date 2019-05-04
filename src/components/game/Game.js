import React from "react";
import * as THREE from "three";
import DragControls from 'three-dragcontrols';
import OrbitControls from 'three-orbitcontrols';
import GodCardsData from "../../views/design/GodCardsData.json";

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
    this.playStartAnimation = 0;
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
    
    // block bag (a simple block for now)
    
    this.initBlock = new THREE.Mesh( new THREE.BoxBufferGeometry( this.blockSize, this.blockHeight, this.blockSize ), this.blockMaterial);
    this.initBlock.position.set( 0, this.blockHeight / 2, 20 );
    this.initBlock.castShadow = true;
    this.initBlock.receiveShadow = true;
    this.scene.add( this.initBlock );
    
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
    
    // orbit controls
    
    this.controls = new OrbitControls( this.camera, this.renderer.domElement );
    this.controls.mouseButtons.LEFT = THREE.MOUSE.RIGHT;
    this.controls.enablePan = false;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 100;
    this.controls.enabled = false;
    
    // drag controls

    this.dragControlsWorker = new DragControls( this.myWorkers, this.camera, this.renderer.domElement );
    this.dragControlsWorker.addEventListener( 'dragstart', this.onDragStartWorker);
    this.dragControlsWorker.addEventListener( 'dragend', this.onDragEndWorker);
    this.dragControlsWorker.enabled = false;
    this.dragControlsWorker.deactivate();
    
    this.dragControlsBlock = new DragControls( [this.initBlock] , this.camera, this.renderer.domElement );
    this.dragControlsBlock.addEventListener( 'dragstart', this.onDragStartBlock);
    this.dragControlsBlock.addEventListener( 'dragend', this.onDragEndBlock);
    this.dragControlsBlock.enabled = false;
    this.dragControlsBlock.deactivate();
    
    // Start animation loop
    this.animate();
    
  }
  
  // Functions called by GamePage (and this)
  
  // Initialize cards
  initCards = () => {
    // TODO: Which card on which side
    this.props.game.cards.forEach((cardnr,i) => {
      let texture = new THREE.CanvasTexture(this._canvasCardTexture(cardnr));
      let card = new THREE.Mesh( new THREE.BoxBufferGeometry( 5, 0.1, 10 ), new THREE.MeshPhongMaterial({ color: 0xccaa11, shading: THREE.FlatShading, map: texture }) );
      card.position.set( 20 - 40 * i, 0, 5 - 10 * i );
      card.rotation.y = Math.PI / 2 - Math.PI*i;
      card.castShadow = true;
      card.receiveShadow = true;
      card.name = cardnr;
      this.scene.add( card );
      this.cards.push( card );
    });
  }
  
  // Initialize workers of one player next to board
  // (call once for each player after color was selected)
  // nr represents the order ( so if COLOR1 was selected -> nr=1)
  initWorkers = (nr,curr=true) => {
    // TODO: Which workers on which side
    let colorPreset = {"BLUE":"#0000ff","GREY":"#dddddd","WHITE":"#ffffff"}
    let playerWorkers = null;
    this.props.game.players.forEach((player) => {
      if(player.isCurrentPlayer && curr) {
        playerWorkers = player;
      } else if(!player.isCurrentPlayer && !curr) {
        playerWorkers = player;
      }
    });
    
    for ( let i = 0; i < 2; i++ ) {
      let worker = new THREE.Mesh( new THREE.CylinderBufferGeometry( 0,1,4,20 ), new THREE.MeshLambertMaterial( { color: colorPreset[playerWorkers.color] } ) );
      worker.position.set( 10 - 3 * i - 17 * (nr-1), 2, 20);
      worker.castShadow = true;
      worker.receiveShadow = true;
      this.scene.add( worker );
      if (playerWorkers.id == localStorage.getItem("player_id")){
        this.myWorkers.push( worker );
      } else {
        this.oppoWorkers.push( worker );
      }
    }
  }
  
  // Always call this function in the update() function of GamePage when not current player
  setControls = (lookAround = true, select = true, move = false, build = false) => {
    this.controls.enabled = lookAround;
    this.inputEnabled = select;
    if (move) {
      this.dragControlsWorker.enabled = true;
      this.dragControlsWorker.activate();
    } else {
      this.dragControlsWorker.enabled = false;
      this.dragControlsWorker.deactivate();
    }
    if (build) {
      this.dragControlsBlock.enabled = true;
      this.dragControlsBlock.activate();
    } else {
      this.dragControlsBlock.enabled = false;
      this.dragControlsBlock.deactivate();
    }
  }
  
  _canvasCardTexture = (nr) => {
    // Texture
    let canvas = document.createElement("canvas");
    let ctx = canvas.getContext('2d');
    canvas.width = 128;
    canvas.height = 256;
    canvas.style.width = 64;
    canvas.style.height= 128;
    ctx.scale(2,2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect( 0, 0, canvas.width,canvas.height );
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = 'blue';
    ctx.font = "6pt American Typewriter";
    ctx.fillText(GodCardsData[nr].name,canvas.width/4,10);
    ctx.font = "4pt American Typewriter";
    GodCardsData[nr].text.forEach((line,i) => {
      ctx.fillText(line,canvas.width/4,25+10*i);
    })
    // DEBUG
    ctx.fillText(nr,canvas.width/4,canvas.height/2-10);
    return canvas;
  }
  
  _displayCard = (posX,posY,posZ, nr) => {
    // Display card
    let texture = new THREE.CanvasTexture(this._canvasCardTexture(nr));
    let card = new THREE.Mesh( new THREE.BoxBufferGeometry( 5, 0.1, 10 ), new THREE.MeshPhongMaterial({ color: 0xccaa11, shading: THREE.FlatShading, map: texture }) );
    card.rotation.x = - Math.PI / 2;
    card.position.set(posX,posY,posZ);
    card.name = nr;
    this.camera.add( card );
    this.cards.push( card );
  }
  
  _displayConfirmButton = (posX,posY,posZ) => {
    // Texture
    let canvas = document.createElement("canvas");
    let ctx = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 128;
    canvas.style.width = 128;
    canvas.style.height= 64;
    ctx.scale(2,2);
    ctx.fillStyle = '#0000FF';
    ctx.fillRect( 0, 0, canvas.width,canvas.height );
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = '#FFFFFF';
    ctx.font = "15pt American Typewriter";
    ctx.fillText("CONFIRM",canvas.width/4,canvas.height/4);
    
    // Display confirm button
    let texture = new THREE.CanvasTexture(canvas);
    let confirmButton = new THREE.Mesh( new THREE.BoxBufferGeometry( 4, 2, 2 ), new THREE.MeshPhongMaterial({ shading: THREE.FlatShading, map: texture }) );
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
    this.setControls(false,true); // lookAround=false,select=true
    
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
    this.setControls(false,true); // lookAround=false,select=true
    
    // Display 2 cards
    this.props.game.cards.forEach((card,i) => {
      this._displayCard(-10+20*i, 0, -40, card);
    });
    
    //For testing
    //this._displayCard(-10, 0, -40, 2);
    //this._displayCard(-10+20, 0, -40, 5);
    
    this._displayConfirmButton(0, -15, -40);
  }
  
  // Initialize postion selection (nr is either 1 or 2 depending on the player)
  Position = (nr) => {
    // Play camera animation
    this.playStartAnimation = nr;
    this.setControls(false,false); // lookAround=false,select=false
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
    
    // TODO: !!!!!!!!!!!!!!
    
    switch(this.props.game.status) {
        case "POSITION1":
        
          break;
        case "POSITION2":
        
          break;
        case "MOVE":
        
          break;
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
    
    
    // TODO: !!!!!!!!!!!!!!
    
    switch(this.props.game.status) {
        case "BUILD":
        
          break;
    }
    
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

    //let intersections = this.raycaster.intersectObjects( this.camera.children );
    let intersectionObjectsArray = [...this.camera.children,...this.scene.children];
    let intersections = this.raycaster.intersectObjects( intersectionObjectsArray );

    if ( intersections.length > 0 && intersections[0] !== null ) {
      let obj = intersections[0].object
      
      switch(this.props.game.status) {
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
        case "POSITION1":
        case "POSITION2":
        case "MOVE":
        case "BUILD":
          if (this.cards.includes(obj) && obj.visible && this.scene.getObjectByName("displayCard") == null) {
              let displayCard = obj.clone();
              displayCard.name = "displayCard";
              displayCard.position.set(0,0,-20);
              displayCard.rotation.set(- Math.PI / 2,0,0);
              this.camera.add(displayCard);
              obj.visible = false;
          }
          if (obj.name == "displayCard") {
              this.camera.remove(obj);
              this.cards.forEach((card) => {
                card.visible = true;
              });
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
    if (this.playStartAnimation > 0) {
      if (this.playStartAnimation == 1) {
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
        this.playStartAnimation = 0;
        
        // Enable controls after camera animation
        this.setControls(true,true,true); // lookAround=true,select=false,move=true
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
