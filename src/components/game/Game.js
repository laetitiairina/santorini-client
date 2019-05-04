import React from "react";
import * as THREE from "three";
import DragControls from 'three-dragcontrols';
import OrbitControls from 'three-orbitcontrols';
import GodCardsData from "../../views/design/GodCardsData";
import godCardsEnum from "../../helpers/godCardsEnum";

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
    
    this.ghostWorker = null;
    this.dragedWorkerInitPos = null;
    this.draged = false;
    
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
    this.container.addEventListener( 'mousedown', this.onMouseDown, false);
    this.container.addEventListener( 'mouseup', this.onMouseUp, false);
    
    // orbit controls
    
    this.controls = new OrbitControls( this.camera, this.renderer.domElement );
    //this.controls.mouseButtons.LEFT = THREE.MOUSE.RIGHT;
    this.controls.enablePan = false;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 100;
    this.controls.enabled = false;
    
    // drag controls

    this.dragControlsWorker = new DragControls( this.myWorkers, this.camera, this.renderer.domElement );
    this.dragControlsWorker.addEventListener( 'dragstart', this.onDragStartWorker);
    this.dragControlsWorker.addEventListener( 'drag', this.onDragWorker);
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
    if (this.cards.length > 0) {
      return;
    }
    
    this.props.game.players.forEach((player,i) => {
    
      // Display name tag
      let textureNameTag = new THREE.CanvasTexture(this._canvasTextTexture(this._getUsername(player),10,100,40));
      let nameTag = new THREE.Mesh( new THREE.BoxBufferGeometry( 5, 0.1, 2 ), new THREE.MeshPhongMaterial({ color: 0xffffff, shading: THREE.FlatShading, map: textureNameTag }) );
      nameTag.position.set( 20 - 40 * i, 0, -5 + 10 * i );
      nameTag.rotation.y = Math.PI / 2 - Math.PI*i;
      this.scene.add( nameTag );
    
      // Display card of players
      let textureCard = new THREE.CanvasTexture(this._canvasCardTexture(godCardsEnum[player.card]));
      let card = new THREE.Mesh( new THREE.BoxBufferGeometry( 5, 0.1, 10 ), new THREE.MeshPhongMaterial({ color: 0xccaa11, shading: THREE.FlatShading, map: textureCard }) );
      card.position.set( 20 - 40 * i, 0, 5 - 10 * i );
      card.rotation.y = Math.PI / 2 - Math.PI*i;
      card.castShadow = true;
      card.receiveShadow = true;
      card.name = godCardsEnum[player.card];
      this.scene.add( card );
      this.cards.push( card );
    });
  }
  
  // Initialize workers of one player next to board
  // (call once for each player after color was selected)
  // nr represents the order ( so if COLOR1 was selected -> nr=1)
  initWorkers = (nr,curr=true) => {
    if (this.myWorkers.length > 0 && this.oppoWorkers.length > 0) {
      return;
    }
    
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
      if (playerWorkers.id == this.props.game.players[0].id) {
        worker.position.set( 10 - 3 * i - 17 * 0, 2, 20);
      } else {
        worker.position.set( 10 - 3 * i - 17 * 1, 2, 20);
      }
      worker.castShadow = true;
      worker.receiveShadow = true;
      this.scene.add( worker );
      if (playerWorkers.id == localStorage.getItem('player_id')){
        worker.userData = {"worker":playerWorkers.workers[i],"onBoard":false,"posX":null,"posY":null};
        this.myWorkers.push( worker );
      } else {
        this.oppoWorkers.push( worker );
      }
    }
  }
  
  // Always call this function in the update() function of GamePage when not current player
  setControls = (lookAround, select, move = false, build = false) => {
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
  
  _getUsername = (player) => {
    let username = "GUEST";
    
    if(player.username != null) {
      username = player.username;
    }
  
    if(player.id == localStorage.getItem('player_id')) {
      username = "YOU";
    }
    
    return username;
  }
  
  _setupCanvas = (width,height) => {
    let canvas = document.createElement("canvas");
    let ctx = canvas.getContext('2d');
    let scale = 2;//window.devicePixelRatio;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    canvas.width = width * scale;
    canvas.height = height * scale;
    ctx.scale(scale,scale);
    return {"canvas":canvas,"ctx":ctx};
  }
  
  _canvasTextTexture = (text,size,width,height,bgColor='#FFFFFF',color='#0000FF') => {
    // Texture
    let draw = this._setupCanvas(width,height);
    draw["ctx"].fillStyle = bgColor;
    draw["ctx"].fillRect( 0, 0, draw["canvas"].width,draw["canvas"].height );
    draw["ctx"].textAlign = "center";
    draw["ctx"].textBaseline = "middle";
    draw["ctx"].fillStyle = color;
    draw["ctx"].font = size + "pt American Typewriter";
    draw["ctx"].fillText(text,draw["canvas"].width/4,draw["canvas"].height/4);
    return draw["canvas"];
  }
  
  _canvasCardTexture = (nr) => {
    // Texture
    let draw = this._setupCanvas(64,128);
    draw["ctx"].fillStyle = '#FFFFFF';
    draw["ctx"].fillRect( 0, 0, draw["canvas"].width,draw["canvas"].height );
    draw["ctx"].textAlign = "center";
    draw["ctx"].textBaseline = "middle";
    draw["ctx"].fillStyle = 'blue';
    draw["ctx"].font = "6pt American Typewriter";
    draw["ctx"].fillText(GodCardsData[nr].name,draw["canvas"].width/4,10);
    draw["ctx"].font = "4pt American Typewriter";
    GodCardsData[nr].text.forEach((line,i) => {
      draw["ctx"].fillText(line,draw["canvas"].width/4,25+10*i);
    })
    // DEBUG
    draw["ctx"].fillText(nr,draw["canvas"].width/4,draw["canvas"].height/2-10);
    return draw["canvas"];
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
    // Display confirm button
    let texture = new THREE.CanvasTexture(this._canvasTextTexture("Confirm",15,128,64));
    let confirmButton = new THREE.Mesh( new THREE.BoxBufferGeometry( 4, 2, 2 ), new THREE.MeshPhongMaterial({ shading: THREE.FlatShading, map: texture }) );
    confirmButton.rotation.x = - Math.PI / 2;
    confirmButton.position.set(posX,posY,posZ);
    confirmButton.name = "confirm";
    this.camera.add( confirmButton );
  }
  
  _displayUsernames = (posX,posY,posZ, username) => {
    // Display card
    let texture = new THREE.CanvasTexture(this._canvasTextTexture(username,15,200,80));
    let usernameTag = new THREE.Mesh( new THREE.BoxBufferGeometry( 10, 0.1, 4 ), new THREE.MeshPhongMaterial({ color: 0xffffff, shading: THREE.FlatShading, map: texture }) );
    usernameTag.position.set(posX,posY,posZ);
    usernameTag.rotation.x = - Math.PI / 2;
    if(username == "YOU") {
      usernameTag.name = "YOU";
    } else {
      usernameTag.name = "OPPO";
    }
    this.camera.add( usernameTag );
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
    this.props.game.cards.forEach((cardname,i) => {
      this._displayCard(-5+10*i, 0, -40, godCardsEnum[cardname]);
    });
    
    //For testing
    //this._displayCard(-10, 0, -40, 2);
    //this._displayCard(-10+20, 0, -40, 5);
    
    this._displayConfirmButton(0, -15, -40);
  }
  
  cleanUpCards = () => {
    let con = this.camera.getObjectByName("confirm");
    this.camera.remove(con);
    this.cards.forEach((card) => {
      this.camera.remove(card);
    })
    this.cards = [];
  }
  
  // Display both player usernames
  StartPlayer = () => {
    this.setControls(false,true); // lookAround=false,select=true
    
    // Display both usernames
    this.props.game.players.forEach((player,i) => {
      this._displayUsernames(-10+20*i, 0, -40, this._getUsername(player));
    });
  }
  
  cleanUpUsernames = () => {
    let you = this.camera.getObjectByName("YOU");
    let oppo = this.camera.getObjectByName("OPPO");
    this.camera.remove(you);
    this.camera.remove(oppo);
  }
  
  // Initialize postion selection (nr is either 1 or 2 depending on the player)
  Position = () => {
    // Play camera animation
    if (this.props.game.players[0].id  == localStorage.getItem('player_id')) {
        this.playStartAnimation = 1;
      } else {
        this.playStartAnimation = 2;
      }
    this.setControls(false,false); // lookAround=false,select=false
  }
  
  // Input
  // Use this.props.inputHandler() to pass input to GamePage in order to process it
  
  onDragStartWorker = (event) => {
    this.controls.enabled = false;
    this.inputEnabled = false;
    
    this.draged = true;
    
    this.dragedWorkerInitPos = event.object.position.clone();
    
    // Create ghost worker
    this.ghostWorker = event.object.clone();
    this.ghostWorker.material = event.object.material.clone();
    this.ghostWorker.material.transparent = true;
    this.ghostWorker.material.opacity = 0.3;
    this.ghostWorker.name = "ghost";
    this.scene.add(this.ghostWorker);
  }
  
  onDragWorker = (event) => {
    let posX = Math.floor( ( event.object.position.x + 2.5 ) / 5 ) * 5;
    let posZ = Math.floor( ( event.object.position.z + 2.5 ) / 5 ) * 5;
    
    // Update ghost worker position
    if (posX > 10 || posX < -10 || posZ > 10 || posZ < -10) {
      this.ghostWorker.position.y = -500;
    } else {
      this.ghostWorker.position.x = posX;
      this.ghostWorker.position.z = posZ;
      this.ghostWorker.position.y = 2;
      
      // TODO:
      if (this.fields[posX][posZ]) {
        this.ghostWorker.position.y = 2 + this.blockHeight * this.fields[event.object.position.x][event.object.position.z];
      }
      
    }
  }
  
  onDragEndWorker = (event) => {
    // Remove ghost worker
    this.scene.remove(this.ghostWorker);
    
    let posX = Math.floor( ( event.object.position.x + 2.5 ) / 5 ) * 5;
    let posZ = Math.floor( ( event.object.position.z + 2.5 ) / 5 ) * 5;
    
    if (posX > 10 || posX < -10 || posZ > 10 || posZ < -10) {
      // Reset position of worker
      event.object.position.copy(this.dragedWorkerInitPos);
    } else {
      // Worker was placed on board
      event.object.position.x = posX;
      event.object.position.z = posZ;
      event.object.position.y = 2;
      
      // TODO:
      if (this.fields[posX][posZ]) {
        event.object.position.y = 2 + this.blockHeight * this.fields[event.object.position.x][event.object.position.z];
      }
      
      let posEnum = {"-10":0,"-5":1,"0":2,"5":3,"10":4};
      event.object.userData.onBoard = true;
      event.object.userData.posX = posEnum[posX];
      event.object.userData.posY = posEnum[posZ];
    
      switch(this.props.game.status) {
        case "POSITION1":
        case "POSITION2":
        
            // If both workers are on board, get fields of workers, set workers of fields and send input
            let workerFields = [];
          
            this.myWorkers.forEach((worker) => {
              if(worker.userData.onBoard) {
                this.props.game.board.fields.forEach((field) => {
                  if(field.posX == worker.userData.posX && field.posY == worker.userData.posY) {
                    field.worker = worker.userData.worker;
                    workerFields.push(field);
                  }
                });
              }
            });
          
            if(workerFields.length == 2) {
              // Send input to GamePage
              this.props.inputHandler("board",workerFields);
            }
          
          break;
        case "MOVE":
      
          // TODO: !!!!!
      
          break;
      }
    }
    
    this.controls.enabled = true;
    this.inputEnabled = true;
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
  
  _raycasterGetIntersections = (event) => {
    let rect = this.container.getBoundingClientRect();
    this.mouse.x = ( ( event.clientX - rect.left ) / rect.width ) * 2 - 1;
    this.mouse.y = - ( ( event.clientY - rect.top ) / rect.height ) * 2 + 1;

    this.raycaster.setFromCamera( this.mouse, this.camera );

    //let intersections = this.raycaster.intersectObjects( this.camera.children );
    let intersectionObjectsArray = [...this.camera.children,...this.scene.children];
    let intersections = this.raycaster.intersectObjects( intersectionObjectsArray );
    return intersections;
  }
  
  onMouseDown = (event) => {
    if (!this.inputEnabled) {
      return;
    }
    
    event.preventDefault();
    
    let intersections = this._raycasterGetIntersections(event);

    if ( intersections.length > 0 && intersections[0] !== null ) {
      let obj = intersections[0].object;
      
      switch(this.props.game.status) {
        case "CARDS1":
        case "CARDS2":
        case "STARTPLAYER":
          // Check if obj was clicked, then move it back
          if (obj.name == "confirm" || obj.name == "YOU" || obj.name == "OPPO") {
            obj.position.z = -42;
          }
          break;
      }
    }
  }

  onMouseUp = (event) => {
  
    // TODO: throws error sometimes
    // Make sure all ghosts are removed
    if(this.draged) {
      this.scene.traverse((child) => {
        if(child.name == "ghost") {
          this.scene.remove(child);
        }
      });
      this.draged = false;
    }
  
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

    // Get intersections
    let intersections = this._raycasterGetIntersections(event);

    if ( intersections.length > 0 && intersections[0] !== null ) {
      let obj = intersections[0].object
      
      switch(this.props.game.status) {
        case "CARDS1":
        case "CARDS2":
          if(this.camera.getObjectByName("confirm")) {
            this.camera.getObjectByName("confirm").position.z = -40;
          }
          
          // Get selected cards
          let selectedCardNrs = []
          this.cards.forEach((card) => {
            if (card.position.z > -40) {
              selectedCardNrs.push(card.name);
            }
          })
          
          // Check if confirm button was clicked
          if (obj.name == "confirm") {
            obj.position.z = -40;
            if (this.cards.length == 10 && selectedCardNrs.length == 2) {
              // Convert card nr to name
              let selectedCardNames = [];
              selectedCardNrs.forEach((cardnr) => {
                selectedCardNames.push(GodCardsData[cardnr].name);
              });
              
              // Send input to GamePage
              this.props.inputHandler("game",{cards:selectedCardNames});
              this.cleanUpCards();
              
            } else if (this.cards.length == 2 && selectedCardNrs.length == 1) {
            
              // Send input to GamePage
              this.props.inputHandler("player",{card:GodCardsData[selectedCardNrs[0]].name});
              this.cleanUpCards();
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
        case "STARTPLAYER":
          if(this.camera.getObjectByName("YOU")) {
            this.camera.getObjectByName("YOU").position.z = -40;
          }
          if(this.camera.getObjectByName("OPPO")) {
            this.camera.getObjectByName("OPPO").position.z = -40;
          }
          // Check if self was clicked
          if (obj.name == "YOU") {
          
            // Send input to GamePage
            this.props.inputHandler("player",{isCurrentPlayer:true});
            this.cleanUpUsernames();
            
          } else if (obj.name == "OPPO") {
          
            // Send input to GamePage
            this.props.inputHandler("opponent",{isCurrentPlayer:true});
            this.cleanUpUsernames();
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
