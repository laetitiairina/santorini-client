import React from "react";
import * as THREE from "three";
import DragControls from 'three-dragcontrols';
import OrbitControls from 'three-orbitcontrols';
import GodCardsData from "../../views/design/GodCardsData";
import godCardsEnum from "../../helpers/godCardsEnum";

class Game extends React.Component {

  constructor(props) {
    super(props);
    
    // Have move and build validity check in frontend (this)
    this.frontendCheck = true;
    // TODO: update this
    this.implementedCards = [1,2,4];
    
    this.cameraNear = 0.25;
    this.cameraFar = 300;
    this.cameraLookAtPos = new THREE.Vector3(0, 2, 0);
    this.cameraInitPos = new THREE.Vector3(50, 100, 500);
    this.cameraSelectPos = new THREE.Vector3(50, 100, 100);
    this.cameraRightPos = new THREE.Vector3(25, 50, 0);
    this.cameraLeftPos = new THREE.Vector3(-25, 50, 0);
    this.cameraActions = {};
    this.cameraCurrentAction = null;
    this.selectDis = -30;
    this.selectCardDis = -40;
    this.selectDelta = 1;
    this.selectCardDelta = 5; // Has to be bigger than 0
    this.cards = [];
    this.cardsHorizontal = true;
    this.blockHeight = 3;
    this.blockSize = 4.5;
    this.blockBagPos = new THREE.Vector3(0, this.blockHeight / 2, 17);
    this.blockGeometries = [];
    this.blockMaterials = new Array(3).fill(new THREE.MeshPhongMaterial({ color: 0xaaaaaa, flatShading: true }));
    this.domeBagPos = new THREE.Vector3(0, this.blockHeight / 2, 22);
    this.domeGeometry = new THREE.ConeBufferGeometry((this.blockSize-0.5*3)/2, this.blockHeight, 10);
    this.domeMaterial = new THREE.MeshPhongMaterial({ color: 0x0000ff, flatShading: true });
    this.blocks = [];
    this.colorPreset = {"BLUE":"#4444ff","GREY":"#888888","WHITE":"#ffffff"};
    this.initWorkerPos = new THREE.Vector3(10, 2, 17);
    this.workerGeometry = new THREE.CylinderBufferGeometry( 0,1,4,10 );
    this.myWorkers = [];
    this.oppoWorkers = [];
    this.mouse = new THREE.Vector2();
    this.blockDraged = false;
    this.fields = {};
    for (let i = -10; i <= 10; i += 5) {
      this.fields[i] = {};
      for (let j = -10; j <= 10; j += 5) {
        this.fields[i][j] = {"blocks":0,"hasDome":false,"worker":null};
      }
    }
    this.posEnum = {"-10":0,"-5":1,"0":2,"5":3,"10":4};
    this.posRevEnum = {"0":-10,"1":-5,"2":0,"3":5,"4":10};
    this.playStartAnimation = 0;
    this.playInitAnimation = true;
    this.waterSpeed = 1.2;
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
    this.camera.position.copy(this.cameraSelectPos);
    this.camera.lookAt(this.cameraLookAtPos);
    this.scene.add(this.camera);
    
    // camera animation
    
    this.cameraAnimationMixer = new THREE.AnimationMixer(this.camera);
    this.cameraAnimationMixer.addEventListener('finished', this.finishedCameraAnimation);
    
    this.cameraActions["init"] = this.createAction("init",3,this.cameraInitPos,this.cameraSelectPos,new THREE.Vector3(this.cameraSelectPos.x,this.cameraSelectPos.y,this.cameraSelectPos.z+100));
    
    this.cameraActions["right"] = this.createAction("right",2,this.cameraSelectPos,this.cameraRightPos);
    this.cameraActions["left"] = this.createAction("left",2,this.cameraSelectPos,this.cameraLeftPos);
    
    this.cameraCurrentAction = this.cameraActions["init"];
    this.cameraCurrentAction.play();
    
    // clock (for camera animation)
    
    this.clock = new THREE.Clock();

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
    this.dirLight.shadow.camera.far = 500;
    this.scene.add( this.dirLight );
    
    this.ambiLight = new THREE.AmbientLight( 0xffcccc, 0.4 );
    this.scene.add( this.ambiLight );

    // water
    
    this.waterGeometry = new THREE.PlaneGeometry( 1000, 1000, 127, 127);
    this.waterMaterial = new THREE.MeshPhongMaterial({ color: 0x60c0ff, flatShading: true });
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
        v: (1/3)*this.waterSpeed + Math.random() * (2/3)*this.waterSpeed
      })
    });
    this.water = new THREE.Mesh( this.waterGeometry, this.waterMaterial );
    this.water.position.y = -10
    this.water.receiveShadow = true;
    this.scene.add( this.water );
    
    // island
    
    this.islandGeometry = new THREE.CylinderGeometry( 25, 35, 20, 10, 10 );
    this.islandMaterial = new THREE.MeshPhongMaterial({vertexColors: THREE.FaceColors, flatShading: true });
    this.islandGeometry.mergeVertices();
    this.islandGeometry.vertices.forEach((v) => {
      v.x += -1 + Math.random()*2;
      v.y += -1 + Math.random()*2;
      v.z += -1 + Math.random()*2;
    });
    let islandColors = [0x44cc44,0x44ee44];
    this.islandGeometry.faces.forEach((f) => {
      f.color.setHex(islandColors[Math.floor(Math.random()*islandColors.length)]);
    });
    this.island = new THREE.Mesh( this.islandGeometry, this.islandMaterial);
    this.island.position.y = -11.1;
    this.island.receiveShadow = true;
    this.scene.add( this.island );
    
    // board

    this.board = new THREE.Mesh( new THREE.BoxBufferGeometry( 25, 10 , 25 ), new THREE.MeshPhongMaterial({ color: 0x679012, flatShading: true }) );
    //this.board.rotation.x = - Math.PI / 2;
    this.board.position.y = -5;
    this.board.receiveShadow = true;
    this.scene.add( this.board );

    this.grid = new THREE.GridHelper( 25, 5, 0x000000, 0x000000 );
    this.grid.material.opacity = 0.2;
    this.grid.material.transparent = true;
    this.scene.add( this.grid );
    
    // block geometries
    
    for(let i = 0; i < 3; i++) {
      this.blockGeometries.push(new THREE.CylinderBufferGeometry((this.blockSize-0.5*i)/2, (this.blockSize-0.5*i)/2, this.blockHeight, 10));
    }
    
    this.blockGeometries.push(this.domeGeometry);
    this.blockMaterials.push(this.domeMaterial);
    
    // block bag (a simple block for now)
    
    this.blockBag = new THREE.Mesh( this.blockGeometries[0], this.blockMaterials[0]);
    this.blockBag.position.copy(this.blockBagPos);
    this.blockBag.castShadow = true;
    this.blockBag.receiveShadow = true;
    this.blockBag.name = "blockBag";
    this.scene.add( this.blockBag );
    
    // dome bag (a simple dome for now)
    
    this.domeBag = new THREE.Mesh( this.domeGeometry, this.domeMaterial);
    this.domeBag.position.copy(this.domeBagPos);
    this.domeBag.castShadow = true;
    this.domeBag.receiveShadow = true;
    this.domeBag.name = "domeBag";
    this.scene.add( this.domeBag );
    
    // renderer

    this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha:true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.gammaOutput = true;
    this.renderer.gammaFactor = 2.2;
    this.renderer.shadowMap.enabled = true; // Comment out to increase performance
    this.container.appendChild(this.renderer.domElement);

    window.addEventListener( 'resize', this.onWindowResize, false );
    
    // raycaster
    
    this.raycaster = new THREE.Raycaster();
    this.container.addEventListener( 'mousedown', this.onMouseDown, false);
    this.container.addEventListener( 'mouseup', this.onMouseUp, false);
    this.container.addEventListener( 'touchstart', this.onMouseDown, false);
    this.container.addEventListener( 'touchend', this.onMouseUp, false);
    
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
    
    this.dragControlsBlock = new DragControls( [this.blockBag,this.domeBag], this.camera, this.renderer.domElement );
    this.dragControlsBlock.addEventListener( 'dragstart', this.onDragStartBlock);
    this.dragControlsBlock.addEventListener( 'drag', this.onDragBlock);
    this.dragControlsBlock.addEventListener( 'dragend', this.onDragEndBlock);
    this.dragControlsBlock.enabled = false;
    this.dragControlsBlock.deactivate();
    
    // Start animation loop
    this.animate();
    
  }
  
  // Get larger screen size
  isHorizontal = () => {
    if (window.innerWidth > window.innerHeight) {
      return true;
    } else {
      return false;
    }
  }
  
  // Create action for camera animation
  createAction = (name,duration,startPos, endPos, middlePos=null) => {
    let times = [0,1];
    let values = [
      startPos.x,startPos.y,startPos.z,
      endPos.x,endPos.y,endPos.z
    ]
    if (middlePos) {
      times = [0,0.5,1];
      values = [
        startPos.x,startPos.y,startPos.z,
        middlePos.x,middlePos.y,middlePos.z,
        endPos.x,endPos.y,endPos.z
      ]
    }
    
    let track = new THREE.VectorKeyframeTrack('.position',times,values);
    track.setInterpolation(THREE.InterpolateSmooth);
    let clip = new THREE.AnimationClip(name,1,[track]);
    let action = this.cameraAnimationMixer.clipAction(clip);
    action.clampWhenFinished = true;
    action.setDuration(duration);
    action.setLoop(THREE.LoopOnce);
    return action;
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
      let nameTag = new THREE.Mesh( new THREE.BoxBufferGeometry( 5, 0.1, 2 ), new THREE.MeshPhongMaterial({ color: 0xffffff, flatShading: true, map: textureNameTag }) );
      nameTag.position.set( 20 - 40 * i, 0, -5 + 10 * i );
      nameTag.rotation.y = Math.PI / 2 - Math.PI*i;
      this.scene.add( nameTag );
    
      // Display card of players
      let textureCard = new THREE.CanvasTexture(this._canvasCardTexture(godCardsEnum[player.card]));
      let card = new THREE.Mesh( new THREE.BoxBufferGeometry( 5, 0.1, 10 ), new THREE.MeshPhongMaterial({ color: 0xccaa11, flatShading: true, map: textureCard }) );
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
  initWorkers = () => {
    if (this.myWorkers.length > 0 && this.oppoWorkers.length > 0) {
      return;
    }
    
    this.props.game.players.forEach((player) => {
      if (player.color) {
        if (player.id == localStorage.getItem('player_id')){
          if (this.myWorkers.length == 0) {
            this._initWorkers(player,this.myWorkers);
          }
        } else {
          if (this.oppoWorkers.length == 0) {
            this._initWorkers(player,this.oppoWorkers);
          }
        }
      }
    });
  }
  
  _initWorkers = (player,arr) => {
    for ( let i = 0; i < 2; i++ ) {
      let worker = new THREE.Mesh(this.workerGeometry, new THREE.MeshPhongMaterial({color: this.colorPreset[player.color], flatShading: true}));
      
      if (player.id == this.props.game.players[0].id) {
        worker.position.set(this.initWorkerPos.x - 3 * i - 17 * 0, this.initWorkerPos.y, this.initWorkerPos.z);
      } else {
        worker.position.set(this.initWorkerPos.x - 3 * i - 17 * 1, this.initWorkerPos.y, this.initWorkerPos.z);
      }
      
      worker.castShadow = true;
      worker.receiveShadow = true;
      this.scene.add( worker );
      worker.userData = {"worker":player.workers[i],"field":null,"onBoard":false,"posX":null,"posY":null};
      
      arr.push( worker );
    }
  }
  
  // Always call this function in the update() function of GamePage when not current player
  setControls = (lookAround, select, move = false, build = false) => {
    // Tell GamePage about lookAround
    this.props.cameraControlsEnabled(lookAround);
    
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
  
  // Set camera position
  setCameraPos = (pos) => {
    if(!this.controls.enabled){
      return;
    }
    
    if (this.playInitAnimation || this.playStartAnimation != 0) {
      return;
    }
    
    switch (pos) {
      case "top":
        this.camera.position.set(0,60,0);
        this.camera.lookAt(this.cameraLookAtPos);
        break;
      case "front":
        this.camera.position.set(0,0,60);
        this.camera.lookAt(this.cameraLookAtPos);
        break;
      case "back":
        this.camera.position.set(0,0,-60);
        this.camera.lookAt(this.cameraLookAtPos);
        break;
      case "left":
        this.camera.position.set(-60,0,0);
        this.camera.lookAt(this.cameraLookAtPos);
        break;
      case "right":
        this.camera.position.set(60,0,0);
        this.camera.lookAt(this.cameraLookAtPos);
        break;
      case "side":
        this.camera.position.set(30,60,30);
        this.camera.lookAt(this.cameraLookAtPos);
        break;
      default:
        break;
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
    draw["ctx"].font = "bold 6pt American Typewriter";
    draw["ctx"].fillText(GodCardsData[nr].name,draw["canvas"].width/4,10);
    draw["ctx"].font = "bold 3.8pt American Typewriter";
    GodCardsData[nr].text.forEach((line,i) => {
      draw["ctx"].fillText(line,draw["canvas"].width/4,25+10*i);
    })
    draw["ctx"].fillText(nr,draw["canvas"].width/4,draw["canvas"].height/2-10);
    // TODO: Remove when all cards are implemented
    if (!this.implementedCards.includes(nr)) {
      draw["ctx"].font = "bold 3pt American Typewriter";
      draw["ctx"].fillStyle = 'red';
      draw["ctx"].fillText("NOT IMPLEMENTED YET",draw["canvas"].width/4,draw["canvas"].height/2-20);
    }
    return draw["canvas"];
  }
  
  _displayCard = (posX,posY,posZ, nr) => {
    // Display card
    let texture = new THREE.CanvasTexture(this._canvasCardTexture(nr));
    let card = new THREE.Mesh( new THREE.BoxBufferGeometry( 5, 0.1, 10 ), new THREE.MeshPhongMaterial({ color: 0xccaa11, flatShading: true, map: texture }) );
    card.rotation.x = - Math.PI / 2;
    card.position.set(posX,posY,posZ);
    card.name = nr;
    this.camera.add( card );
    this.cards.push( card );
  }
  
  _displayConfirmButton = (posX,posY,posZ) => {
    // Display confirm button
    let texture = new THREE.CanvasTexture(this._canvasTextTexture("Confirm",15,128,64));
    
    let confirmMaterials = new Array(6).fill(new THREE.MeshPhongMaterial({ flatShading: true}));
    confirmMaterials[3] = new THREE.MeshPhongMaterial({ flatShading: true, map: texture });
    
    let confirmButton = new THREE.Mesh(new THREE.BoxBufferGeometry( 4, 2, 2 ), confirmMaterials);
    confirmButton.rotation.x = - Math.PI / 2;
    confirmButton.position.set(posX,posY,posZ);
    confirmButton.name = "confirm";
    confirmButton.visible = false;
    this.camera.add( confirmButton );
  }
  
  _displayUsernames = (posX,posY,posZ, username) => {
    // Display card
    let texture = new THREE.CanvasTexture(this._canvasTextTexture(username,15,128,64));
    let usernameTag = new THREE.Mesh( new THREE.BoxBufferGeometry( 8, 0.1, 4 ), new THREE.MeshPhongMaterial({ color: 0xffffff, flatShading: true, map: texture }) );
    usernameTag.position.set(posX,posY,posZ);
    usernameTag.rotation.x = - Math.PI / 2;
    usernameTag.name = "select";
    if(username == "YOU") {
      usernameTag.userData = {"level":"player","data":{isCurrentPlayer:true}};
    } else {
      usernameTag.userData = {"level":"opponent","data":{isCurrentPlayer:true}};
    }
    this.camera.add( usernameTag );
  }
  
  _displayColors = (posX,posY,posZ, color) => {
    // Display color
    let geometry = this.workerGeometry;
    let material = new THREE.MeshPhongMaterial({color: this.colorPreset[color], flatShading: true});
    let colorMesh = new THREE.Mesh(geometry, material);
    colorMesh.position.set(posX,posY,posZ);
    colorMesh.rotation.z = 0.1;
    colorMesh.rotation.x = 0.1;
    colorMesh.scale.set(2,2,2);
    colorMesh.name = "select";
    colorMesh.userData = {"level":"player","data":{"color":color}};
    this.camera.add(colorMesh);
  }
  
  _cleanUpSelection = () => {
    while(this.camera.children.length) {
      this.camera.remove(this.camera.children[0]);
    }
  }
  
  // Display 10 cards to choose from
  Cards10 = () => {
    this.setControls(false,true); // lookAround=false,select=true
    
    // Display 10 cards
    for ( let i = 0; i < 10; i++ ) {
      this._displayCard(-12+3*(i-(i%2)), 5-11*(i%2), this.selectCardDis, i+1)
    }
    
    this._displayConfirmButton(0, -14, this.selectCardDis);
    
    // Make sure everything fits on the screen
    this.resizeCardSelection();
    
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
      this._displayCard(-5+10*i, 0, this.selectCardDis, godCardsEnum[cardname]);
    });
    
    //For testing
    //this._displayCard(-10, 0, -40, 2);
    //this._displayCard(-10+20, 0, -40, 5);
    
    this._displayConfirmButton(0, -10, this.selectCardDis);
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
      this._displayUsernames(-5+10*i, 0, this.selectDis, this._getUsername(player));
    });
    
    // Make sure everything fits on the screen
    this.resizeSelection();
  }
  
  // Display colors to choose from
  Color = () => {
    this.setControls(false,true); // lookAround=false,select=true
    
    // Block color if already chosen
    let blockedColor = null;
    this.props.game.players.forEach((player) => {
      if(player.color != null) {
        blockedColor = player.color;
      }
    });
    
    // Display colors
    let i = 0;
    for (let color in this.colorPreset) {
      if (color != blockedColor) {
        this._displayColors(10*(i-1), 0, this.selectDis, color);
      }
      i++;
    }
    
    // Make sure everything fits on the screen
    this.resizeSelection();
    
    // Because of init animation
    if (this.playInitAnimation) {
      this.inputEnabled = false;
      this.camera.children.forEach((child) => {child.visible = false;});
    }
  }
  
  // Initialize postion selection (nr is either 1 or 2 depending on the player)
  Position = () => {
    // Play camera animation
    if (this.props.game.players[0].id  == localStorage.getItem('player_id')) {
      this.playStartAnimation = 1;
      this.playCameraAnimation("right");
    } else {
      this.playStartAnimation = 2;
      this.playCameraAnimation("left");
    }
    
    // Disable controls during animation
    this.setControls(false,false); // lookAround=false,select=false
  }
  
  // Input
  // Use this.props.inputHandler() to pass input to GamePage in order to process it
  
  frontendMoveBuildCheck = (posX,posZ) => {
    if(!this.frontendCheck) {
      return true;
    }
    if (this.fields[posX][posZ].blocks > 3 || this.fields[posX][posZ].hasDome) {
      return false;
    }
    if (this.fields[posX][posZ].worker != null) {
      return false;
    }
    return true;
  }
  
  frontendGodCardsMoveCheck = () => {
    if(!this.frontendCheck) {
      return false;
    }
    if(!this.props.game.isGodMode) {
      return false;
    }
    let ownCardNr = null;
    let oppoCardNr = null;
    this.props.game.players.forEach((player) => {
      if (player.id == localStorage.getItem('player_id')) {
        ownCardNr = godCardsEnum[player.card];
      } else {
        oppoCardNr = godCardsEnum[player.card];
      }
    });
    
    // APOLLO
    if (ownCardNr == 1) {
      return true;
    }
    return false;
  }
  
  onDragStartWorker = (event) => {
    this.controls.enabled = false;
    this.inputEnabled = false;
    
    this.draged = true;
    
    this.dragedWorkerInitPos = event.object.position.clone();
    
    // Create ghost worker
    this.ghostWorker = event.object.clone();
    this.ghostWorker.material = event.object.material.clone();
    this.ghostWorker.material.transparent = true;
    this.ghostWorker.material.opacity = 0.4;
    this.ghostWorker.name = "ghost";
    this.ghostWorker.castShadow = false;
    this.ghostWorker.receiveShadow = false;
    this.scene.add(this.ghostWorker);
  }
  
  onDragWorker = (event) => {
    let posX = Math.floor( ( event.object.position.x + 2.5 ) / 5 ) * 5;
    let posZ = Math.floor( ( event.object.position.z + 2.5 ) / 5 ) * 5;
    
    // Update ghost worker position
    if (posX > 10 || posX < -10 || posZ > 10 || posZ < -10) {
      this.ghostWorker.position.y = -500;
    } else {
      if (!this.frontendMoveBuildCheck(posX,posZ) && !this.frontendGodCardsMoveCheck()) {
        this.ghostWorker.material.color.setHex(0xff0000);
      } else {
        this.ghostWorker.material.color.setHex(0x00ff00);
      }
      this.ghostWorker.position.x = posX;
      this.ghostWorker.position.z = posZ;
      this.ghostWorker.position.y = 2 + this.blockHeight * this.fields[posX][posZ].blocks;
      if(this.fields[posX][posZ].worker != null || this.fields[posX][posZ].hasDome) {
        this.ghostWorker.position.y += this.blockHeight;
      }
    }
  }
  
  onDragEndWorker = (event) => {
    this.controls.enabled = true;
    this.inputEnabled = true;
    
    // Remove ghost worker
    this.scene.remove(this.ghostWorker);
    
    let posX = Math.floor( ( event.object.position.x + 2.5 ) / 5 ) * 5;
    let posZ = Math.floor( ( event.object.position.z + 2.5 ) / 5 ) * 5;
    
    if (posX > 10 || posX < -10 || posZ > 10 || posZ < -10 || (!this.frontendMoveBuildCheck(posX,posZ) && !this.frontendGodCardsMoveCheck())) {
      // Reset position of worker
      event.object.position.copy(this.dragedWorkerInitPos);
    } else {
      // Worker was placed on board
      event.object.position.x = posX;
      event.object.position.z = posZ;
      event.object.position.y = 2 + this.blockHeight * this.fields[posX][posZ].blocks;
      
      // Set userData of worker
      event.object.userData.onBoard = true;
      event.object.userData.posX = this.posEnum[posX];
      event.object.userData.posY = this.posEnum[posZ];
      
      let workerFields = [];
    
      switch(this.props.game.status) {
        case "POSITION1":
        case "POSITION2":
          // If both workers are on board, get fields of workers, set workers of fields and send input
          this.myWorkers.forEach((worker) => {
            if(worker.userData.onBoard) {
              this.props.game.board.fields.forEach((field) => {
                if(field.posX == worker.userData.posX && field.posY == worker.userData.posY) {
                  field.worker = worker.userData.worker;
                  worker.userData.field = field;
                  workerFields.push(field);
                  
                  // Update frontend field
                  this.fields[this.posRevEnum[field.posX]][this.posRevEnum[field.posY]].worker = worker.userData.worker;
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
          // Get old field of worker
          this.props.game.board.fields.forEach((field) => {
            if (field.id == event.object.userData.field.id) {
              field.worker = null;
              workerFields.push(field);
              
              // Update frontend field
              this.fields[this.posRevEnum[field.posX]][this.posRevEnum[field.posY]].worker = null;
            }
          });
          
          // Get new field of worker
          this.props.game.board.fields.forEach((field) => {
            if(field.posX == event.object.userData.posX && field.posY == event.object.userData.posY) {
              field.worker = event.object.userData.worker;
              event.object.userData.field = field;
              workerFields.push(field);
              
              // Update frontend field
              this.fields[this.posRevEnum[field.posX]][this.posRevEnum[field.posY]].worker = event.object.userData.worker;
            }
          });
          
          // Remove and set worker
          /*workerFields[0].worker = null;
          workerFields[1].worker = event.object.userData.worker;
          event.object.userData.field = workerFields[1];*/

          // Send input to GamePage
          this.props.inputHandler("board",workerFields);
      
          break;
      }
    }
  }
  
  onDragStartBlock = (event) => {
    this.controls.enabled = false;
    this.inputEnabled = false;
    
    this.draged = true;
    
    this.placeholderBlock = event.object.clone();
    this.scene.add(this.placeholderBlock);
    
    if (event.object.name == "domeBag") {
      event.object.geometry = this.domeGeometry;
      event.object.material = this.domeMaterial;
    } else {
      event.object.geometry = this.blockGeometries[0];
      event.object.material = this.blockMaterials[0];
    }
    
    // Create ghost block
    this.ghostBlock = event.object.clone();
    this.ghostBlock.material = event.object.material.clone();
    this.ghostBlock.material.transparent = true;
    this.ghostBlock.material.opacity = 0.4;
    this.ghostBlock.name = "ghost";
    this.ghostBlock.castShadow = false;
    this.ghostBlock.receiveShadow = false;
    this.scene.add(this.ghostBlock);
  }
  
  onDragBlock = (event) => {
    let posX = Math.floor( ( event.object.position.x + 2.5 ) / 5 ) * 5;
    let posZ = Math.floor( ( event.object.position.z + 2.5 ) / 5 ) * 5;
    
    // Update ghost block position
    if (posX > 10 || posX < -10 || posZ > 10 || posZ < -10) {
      this.ghostBlock.position.y = -500;
    } else {
      if (!this.frontendMoveBuildCheck(posX,posZ)) {
        this.ghostBlock.material.color.setHex(0xff0000);
      } else {
        this.ghostBlock.material.color.setHex(0x00ff00);
      }
      
      // Update geometry
      if (event.object.name == "domeBag") {
        //
      } else {
        if (event.object.geometry != this.blockGeometries[this.fields[posX][posZ].blocks]) {
          event.object.geometry = this.blockGeometries[this.fields[posX][posZ].blocks];
          this.ghostBlock.geometry = this.blockGeometries[this.fields[posX][posZ].blocks];
        }
      }
      
      this.ghostBlock.position.x = posX;
      this.ghostBlock.position.z = posZ;
      this.ghostBlock.position.y = this.blockHeight/2 + this.blockHeight * this.fields[posX][posZ].blocks;
      if(this.fields[posX][posZ].worker != null || this.fields[posX][posZ].hasDome) {
        this.ghostBlock.position.y += this.blockHeight;
      }
    }
  }
  
  onDragEndBlock = (event) => {
    this.controls.enabled = true;
    this.inputEnabled = true;
  
    // Remove ghost block
    this.scene.remove(this.ghostBlock);
    
    let posX = Math.floor( ( event.object.position.x + 2.5 ) / 5 ) * 5;
    let posZ = Math.floor( ( event.object.position.z + 2.5 ) / 5 ) * 5;
    
    event.object.position.copy(this.placeholderBlock.position);
    event.object.geometry = this.placeholderBlock.geometry.clone();
    event.object.material = this.placeholderBlock.material.clone();
    this.scene.remove(this.placeholderBlock);
    
    if (posX > 10 || posX < -10 || posZ > 10 || posZ < -10 || !this.frontendMoveBuildCheck(posX,posZ)) {
      // Invalid action
    } else {
      switch(this.props.game.status) {
          case "BUILD":
            // Get number of blocks on field before
            let blockNr = this.fields[posX][posZ].blocks;
            let blockField = [];
          
            // Get new field of worker
            this.props.game.board.fields.forEach((field) => {
              if(field.posX == this.posEnum[posX] && field.posY == this.posEnum[posZ]) {
                blockField.push(field);
              }
            });
          
            if (event.object.name == "domeBag") {
              
              // Create dome
              this.createDome(posX,posZ,blockNr);
              
              // Update field frontend and backend
              this.fields[posX][posZ].hasDome = true;
              blockField[0].hasDome = true;
              
            } else {
            
              // Create block
              this.createBlock(posX,posZ,blockNr);
              
              // Update field frontend and backend
              if (this.fields[posX][posZ].blocks >= 3) {
                // Has dome to field
                this.fields[posX][posZ].hasDome = true;
                blockField[0].hasDome = true;
              } else {
                // Add block to field
                this.fields[posX][posZ].blocks += 1;
                blockField[0].blocks += 1;
              }
            }

            // Send input to GamePage
            this.props.inputHandler("board",blockField);
            break;
      }
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
    
    if (event.type == "touchstart") {
      event = event.changedTouches[0];
    }
    
    let intersections = this._raycasterGetIntersections(event);

    if ( intersections.length > 0 && intersections[0] !== null ) {
      let obj = intersections[0].object;
      
      if (!this.props.game) {
        return;
      }
      switch(this.props.game.status) {
        case "CARDS1":
        case "CARDS2":
        case "STARTPLAYER":
        case "COLOR1":
        case "COLOR2":
          // Check if obj was clicked, then move it back
          if (obj.position.z == this.selectCardDis && obj.name && (obj.name == "confirm" || !isNaN(obj.name))) {
            obj.position.z = obj.position.z-this.selectDelta;
          } else if (obj.name == "select") {
            obj.position.z = this.selectDis-this.selectDelta;
          }
          break;
      }
    }
  }

  onMouseUp = (event) => {
  
    // TODO: Throws error sometimes
    // Make sure all ghosts are removed
    /*
    if(this.draged) {
      this.scene.traverse((child) => {
        if(child.name == "ghost") {
          this.scene.remove(child);
        }
      });
      this.draged = false;
    }
    */
    
    if (!this.inputEnabled) {
      return;
    }

    event.preventDefault();
    
    if (event.type == "touchend") {
      event = event.changedTouches[0];
    }

    // Get intersections
    let intersections = this._raycasterGetIntersections(event);

    if ( intersections.length > 0 && intersections[0] !== null ) {
      let obj = intersections[0].object
      
      if (!this.props.game) {
        return;
      }
      switch(this.props.game.status) {
        case "CARDS1":
        case "CARDS2":
          if(this.camera.getObjectByName("confirm")) {
            this.camera.getObjectByName("confirm").position.z = this.selectCardDis;
          }
          
          // Get selected cards before
          let selectedCardNrsBefore = this._getSelectedCardNrs();
          
          // Toggle card
          if (this.cards.includes(obj)) {
            // CARDS1
            // Select/Deselect card
            if (obj.position.z <= this.selectCardDis && (this.cards.length == 10 && selectedCardNrsBefore.length < 2)) {
              obj.position.z = this.selectCardDis+this.selectCardDelta;
              
            // CARDS 2
            } else if (obj.position.z <= this.selectCardDis && this.cards.length == 2) {
              this.cards.forEach((card) => {
                card.position.z = this.selectCardDis;
              });
              obj.position.z = this.selectCardDis+this.selectCardDelta;
            } else {
              obj.position.z = this.selectCardDis;
            }
          }
          
          let selectedCardNrs = this._getSelectedCardNrs();
          
          // Display confirm button
          if(this.camera.getObjectByName("confirm")) {
            if ((this.cards.length == 10 && selectedCardNrs.length == 2) || (this.cards.length == 2 && selectedCardNrs.length == 1)) {
              this.camera.getObjectByName("confirm").visible = true;
            } else {
              this.camera.getObjectByName("confirm").visible = false;
            }
          }
          
          // Check if confirm button was clicked
          if (obj.name == "confirm") {
            obj.position.z = this.selectCardDis;
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
          break;
        case "STARTPLAYER":
        case "COLOR1":
          this.handleSelect(obj);
          break;
        case "COLOR2":
          this.handleSelect(obj);
          this.props.game.players.forEach((player) => {
            if (player.id == localStorage.getItem('player_id') && player.isCurrentPlayer) {
              return;
            }
          });
        case "POSITION1":
        case "POSITION2":
        case "MOVE":
        case "BUILD":
          // Display card in front of camera if clicked
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
    }
  }
  
  _getSelectedCardNrs =() => {
    // Get selected cards
    let selectedCardNrs = []
    this.cards.forEach((card) => {
      if (card.position.z > this.selectCardDis) {
        selectedCardNrs.push(card.name);
      }
    })
    return selectedCardNrs;
  }
  
  handleSelect = (obj) => {
    this.camera.children.forEach((child) => {
      if (child.name == "select") {
        child.position.z = this.selectDis;
      }
    })
    // Check if object was selected
    if (obj.name == "select") {
      // Send input to GamePage
      this.props.inputHandler(obj.userData.level,obj.userData.data);
      this._cleanUpSelection();
    }
  }
  
  // Output
  
  // Display game state
  // This function gets called in GamePage
  update = () => {
    for( let field of this.props.game.board.fields ) {
      // Get frontend field
      let frontendField = this.fields[this.posRevEnum[field.posX]][this.posRevEnum[field.posY]];
      
      if (frontendField.blocks < field.blocks || (frontendField.hasDome == false && field.hasDome == true)) {
        // Set blocks
        this.updateBlocks(field,frontendField);
      } else if (frontendField.blocks > field.blocks || (frontendField.hasDome == true && field.hasDome == false)) {
        // Reload board
        this.reloadBoard();
        break;
      }
      
      // Set workers
      this.updateWorkers(field);
      
      // Update frontend fields
      this.updateFields(field);
    }
  }
  
  updateFields = (field) => {
    this.fields[this.posRevEnum[field.posX]][this.posRevEnum[field.posY]].blocks = field.blocks;
    this.fields[this.posRevEnum[field.posX]][this.posRevEnum[field.posY]].hasDome = field.hasDome;
    this.fields[this.posRevEnum[field.posX]][this.posRevEnum[field.posY]].worker = field.worker;
  }
  
  reloadBoard = () => {
    this.blocks.forEach((block) => {
      this.scene.remove(block);
    })
    this.blocks = [];
    
    this.props.game.board.fields.forEach((field) => {
      // Set blocks
      this.updateBlocks(field);
      
      // Set workers
      this.updateWorkers(field);
      
      // Update frontend fields
      this.updateFields(field);
    });
  }
  
  createBlock = (posX,posZ,i) => {
    let block = new THREE.Mesh( this.blockGeometries[i], this.blockMaterials[i]);
    block.position.set( posX, this.blockHeight / 2 + this.blockHeight * i, posZ );
    block.castShadow = true;
    block.receiveShadow = true;
    this.scene.add(block);
    this.blocks.push(block);
  }
  
  createDome = (posX,posZ,i) => {
    let dome = new THREE.Mesh( this.domeGeometry, this.domeMaterial);
    dome.position.set( posX, this.blockHeight / 2 + this.blockHeight * i, posZ );
    dome.castShadow = true;
    dome.receiveShadow = true;
    this.scene.add(dome);
    this.blocks.push(dome);
  }
  
  updateBlocks = (field,oldField={"blocks":0,"hasDome":false,"worker":null}) => {
    for(let i = oldField.blocks; i < field.blocks; i++) {
      this.createBlock(this.posRevEnum[field.posX],this.posRevEnum[field.posY],i);
    }
    if(field.hasDome) {
      this.createDome(this.posRevEnum[field.posX],this.posRevEnum[field.posY],field.blocks);
    }
  }
  
  updateWorkers = (field) => {
    // Set workers
    if (field.worker != null) {
      this.myWorkers.forEach((worker) => {
        if (field.worker.id == worker.userData.worker.id) {
          // Update worker
          this._updateWorker(worker,field);
        }
      });
      this.oppoWorkers.forEach((worker) => {
        if (field.worker.id == worker.userData.worker.id) {
          // Update worker
          this._updateWorker(worker,field);
        }
      });
    }
  }
  
  _updateWorker = (worker,field) => {
    worker.position.x = this.posRevEnum[field.posX];
    worker.position.z = this.posRevEnum[field.posY];
    worker.position.y = 2 + field.blocks * this.blockHeight;
    worker.userData.onBoard = true;
    worker.userData.posX = field.posX;
    worker.userData.posY = field.posY;
    worker.userData.field = field;
  }
  
  playCameraAnimation = (key) => {
    if (!this.cameraCurrentAction.isRunning()) {
      this.cameraCurrentAction = this.cameraActions[key];
      this.cameraCurrentAction.fadeIn(0.1);
      this.cameraCurrentAction.reset().play();
  
      //this.cameraAnimationMixer.addEventListener('finished', this.finishedCameraAnimation);
    }
  }
  
  // Gets called when an animation finished
  finishedCameraAnimation = (event) => {
    //this.cameraAnimationMixer.removeEventListener('finished', this.finishedCameraAnimation);
    
    // Initialization animation finished
    if(event.action.getClip().name == "init") {
      this.playInitAnimation = false;
      
      this.cameraCurrentAction.fadeOut(0.1);
      //this.cameraCurrentAction.enabled = false;
      //this.cameraAnimationMixer.uncacheAction(this.cameraCurrentAction);
      //this.cameraCurrentAction = this.cameraActions["right"];
      
      if (this.playStartAnimation == 1) {
        this.playCameraAnimation("right");
      }
      if (this.playStartAnimation == 2) {
        this.playCameraAnimation("left");
      }
      
      // Logic
      this.camera.children.forEach((child) => {
        if(child.name != "confirm") {
          child.visible = true;
        }
      });
      this.inputEnabled = true;
      
      // Tell GamePage that initialization animation finished
      this.props.initFinish();
      
    // Start animation finished
    } else if(event.action.getClip().name == "right" || event.action.getClip().name == "left") {
      this.playStartAnimation = 0;
      
      // Enable controls after camera animation
      this.setControls(true,true,true); // lookAround=true,select=true,move=true
    }
  }
  
  animate = () => {
    // animate
    window.requestAnimationFrame(this.animate);
    this.renderer.render(this.scene, this.camera);
    
    let delta = this.clock.getDelta()
    if (delta > 1) {
      delta = 1;
    }
    
    // Animate water
    this.water.geometry.vertices.forEach((v,i) => {
      v.x = this.waterVertices[i].x + Math.cos(this.waterVertices[i].a) * this.waterVertices[i].A
      v.y = this.waterVertices[i].y + Math.sin(this.waterVertices[i].a) * this.waterVertices[i].A
      this.waterVertices[i].a += this.waterVertices[i].v*delta;
    });
    this.water.geometry.verticesNeedUpdate = true;
    this.water.position.z -= this.waterSpeed*delta;
    
    // Reverse water if off screen
    if ( (this.water.position.z <= (-500 + this.cameraFar) && this.waterSpeed > 0) || (this.water.position.z >= (500 - this.cameraFar) && this.waterSpeed < 0) ) {
      this.waterSpeed *= -1;
      this.water.geometry.vertices.forEach((v,i) => {
        this.waterVertices[i].v *= -1;
      });
    }
    
    // Animate camera
    // Update camera animation mixer
    if (this.cameraAnimationMixer) {
      this.cameraAnimationMixer.update(delta);
    }
    
    // Update camera look at position when animating camera position
    if (this.cameraCurrentAction) {
      if (this.cameraCurrentAction.isRunning()) {
        this.camera.lookAt(this.cameraLookAtPos);
      }
    }
  }

  onWindowResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize( window.innerWidth, window.innerHeight );
    
    this.resizeSelection();
    this.resizeCardSelection();
  }
  
  resizeCardSelection = () => {
    if(this.isHorizontal() && !this.cardsHorizontal && this.cards.length == 10){
      this.cards.forEach((card,i) =>{
        card.position.set(-12+3*(i-(i%2)), 5-11*(i%2), card.position.z);
        card.scale.set(1,1,1);
      });
      this.cardsHorizontal = true;
    } else if(!this.isHorizontal() && this.cardsHorizontal && this.cards.length == 10) {
      this.cards.forEach((card,i) =>{
        card.position.set( -5+1.5*(i-(i%3)), 8-8*(i%3), card.position.z);
        card.scale.set(0.7,0.7,0.7);
      });
      this.cardsHorizontal = false;
    }
  }
  
  resizeSelection = () => {
    this.camera.children.forEach((child) => {
      if(child.name == "select") {
        if(this.isHorizontal() && child.position.x == 0){
          child.position.x = child.position.y*1.5;
          child.position.y = 0;
          if (child.scale.x > 1) {
            child.scale.set(2,2,2)
          }
        } else if(!this.isHorizontal() && child.position.y == 0){
          child.position.y = child.position.x/1.5;
          child.position.x = 0;
          if (child.scale.x > 1) {
            child.scale.set(1.1,1.1,1.1)
          }
        }
      }
    });
  }
  
  render() {
    return (
      <div style={{position:"absolute",top:"0px",left:"0px",width: "100%", height: "100%",zIndex:"-1"}} ref={container => { this.container = container }} />
    )
  }
}

export default Game;
