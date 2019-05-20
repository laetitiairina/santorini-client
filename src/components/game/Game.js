import React from "react";
import * as THREE from "three";
import DragControls from 'three-dragcontrols';
import OrbitControls from 'three-orbitcontrols';
import Sky from 'three-sky';
import GodCardsData from "../../views/design/GodCardsData";
import godCardsEnum from "../../helpers/godCardsEnum";
import bgTexture from "../../views/design/background-gradient.jpeg";

//import STLLoader from 'three-stl-loader';
const STLLoader = require('three-stl-loader')(THREE);

class Game extends React.Component {

  constructor(props) {
    super(props);
    
    // Have move and build validity check in frontend (this)
    this.frontendCheck = true;
    
    this.fogColor = 0xF0F5F7;
    this.skyScalar = 400;
    this.sunSkyPos = new THREE.Vector3(50,200,100);
    this.sunLightPos = new THREE.Vector3(50,200,100);
    this.ambiLightColor = 0xffcccc;
    this.hemiLightColor = 0xcccccc;
    this.cameraNear = 0.25;
    this.cameraFar = 1000;
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
    this.cardsText = [new THREE.Group(),new THREE.Group(),new THREE.Group(),new THREE.Group(),new THREE.Group(),new THREE.Group(),new THREE.Group(),new THREE.Group(),new THREE.Group(),new THREE.Group()] //new Array(10).fill(new THREE.Group());
    this.cardsHorizontal = true;
    this.nameTags = [];
    this.blockHeight = 3;
    this.blockSize = 4.5;
    this.blockBagPos = new THREE.Vector3(-3, this.blockHeight / 2, 17);
    this.blockGeometries = [];
    this.blockMaterials = new Array(3).fill(new THREE.MeshPhongMaterial({ color: 0xaaaaaa, flatShading: true }));
    //[new THREE.MeshPhongMaterial({ color: 0xaaaaaa, flatShading: true }),new THREE.MeshPhongMaterial({ color: 0xbbbbbb, flatShading: true }),new THREE.MeshPhongMaterial({ color: 0xcccccc, flatShading: true })]
    this.domeBagPos = new THREE.Vector3(3, this.blockHeight / 2, 17);
    //this.domeGeometry = new THREE.ConeBufferGeometry((this.blockSize-0.5*3)/2, this.blockHeight, 10);
    this.domeGeometry = new THREE.SphereBufferGeometry((this.blockSize-0.5*3)/2, 8, 5, 0, Math.PI*2, 0, Math.PI/2);
    this.domeGeometry.rotateY(Math.PI/8);
    this.domeGeometry.translate(0.1,-1.5,-0.4);
    this.domeMaterial = new THREE.MeshPhongMaterial({ color: 0x2222ff, flatShading: true });
    this.blocks = [];
    //this.colorPreset = {"BLUE":"#4444ff","GREY":"#888888","WHITE":"#ffffff"};
    this.colorPreset = {"BLUE":"#207AB6","GREY":"#8E68A3","WHITE":"#65CBA6"};
    //this.initWorkerPos = new THREE.Vector3(0, 2, 0);
    this.workerHeight = 4.5;
    this.workerGeometry = new THREE.CylinderBufferGeometry(0,1,4,10);
    this.workerBoundingGeometry = new THREE.BoxBufferGeometry(5,this.workerHeight,5);
    this.workerBoundingMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff, flatShading: true, transparent:true, opacity:0.0 });
    this.myWorkers = [];
    this.oppoWorkers = [];
    this.indicators = [];
    this.indicatorGeometry = new THREE.CylinderBufferGeometry(0,1,4,10);
    this.indicatorMaterialAction = new THREE.MeshPhongMaterial({ color: 0x00ff00, flatShading: true, transparent:true, opacity:0.8 });
    this.indicatorMaterialShow = new THREE.MeshPhongMaterial({ color: 0xffff00, flatShading: true, transparent:true, opacity:0.8 });
    this.cardGeometry = new THREE.BoxBufferGeometry(5,0.1,10);
    this.cardMaterial = new THREE.MeshPhongMaterial({ color: 0x888888, flatShading: true });
    this.nameTagGeometry = new THREE.CylinderBufferGeometry(2,2,1,10);
    this.nameTagMaterial = new THREE.MeshPhongMaterial({ color: 0x888888, flatShading: true });
    this.confirmButtonGeometry = new THREE.BoxBufferGeometry( 4, 0.5, 2 );
    this.confirmButtonMaterial = new THREE.MeshPhongMaterial({ color: 0x888888, flatShading: true });
    this.font = null;
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
    this.playStartAnimation = -1;
    this.playInitAnimation = true;
    this.waterSpeed = 1.2;
    this.shouldAnimateWater = false;
    this.inputEnabled = false;
    
    this.ghostWorker = null;
    this.dragedWorkerInitPos = null;
    this.draged = false;
    this.isTouchControls = false; // When true, bounding box of worker will increase to make it easier to position worker
    
    // Demeter & Hephaestus & Prometheus
    this.lastBuiltBlockField = null;
    
    // Hermes
    this.movedWorkerFields = [null,null,null,null];
    
    // Access via this.props.game instead
    /*
    this.state = {
      game: null // game object, ex. {"status":"MOVE", "board": ...}
    };
    */
  }
  
  componentWillMount() {
  
    // Day / Night
    let hours = (new Date()).getHours();
    if (hours < 8 || hours > 21) {
      this.setTime(true,false); // isNight=true, update=false
    }
    
    // Check if touch controls
    this.isTouchControls = 'ontouchstart' in window || navigator.maxTouchPoints;
  }

  componentDidMount() {

    // scene

    this.scene = new THREE.Scene();
    //this.scene.background = new THREE.Color( 0xFEFFD8 );
    //this.scene.background = new THREE.Color( 0x60c0ff );
    //this.scene.fog = new THREE.Fog(0xFEFFD8, 250, 500);
    this.scene.fog = new THREE.FogExp2(this.fogColor, 0.002);
    
    // sky
    
    this.sky = new Sky();
    this.sky.scale.setScalar(this.skyScalar);
    this.sky.material.uniforms["turbidity"].value = 5;
    this.sky.material.uniforms["rayleigh"].value = 2;
    this.sky.material.uniforms["luminance"].value = 1.1;
    this.sky.material.uniforms["mieCoefficient"].value = 0.002;
    this.sky.material.uniforms["mieDirectionalG"].value = 0.93;
    this.sky.material.uniforms["sunPosition"].value.copy(this.sunSkyPos);
    this.scene.add(this.sky);
    
    // lights

    this.hemiLight = new THREE.HemisphereLight(this.hemiLightColor, 0x000000, 0.8);
    this.scene.add( this.hemiLight );
    
    this.ambiLight = new THREE.AmbientLight(this.ambiLightColor, 0.4 );
    this.scene.add( this.ambiLight );

    this.dirLight = new THREE.DirectionalLight(0xffffff, 0.4);
    this.dirLight.position.copy(this.sunLightPos);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.left = -50;
    this.dirLight.shadow.camera.right = 50;
    this.dirLight.shadow.camera.top = 50;
    this.dirLight.shadow.camera.bottom = -50;
    this.dirLight.shadow.camera.near = 1;
    this.dirLight.shadow.camera.far = this.cameraFar;
    this.scene.add(this.dirLight);
    
    // camera
    
    this.camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, this.cameraNear, this.cameraFar);
    this.camera.position.copy(this.cameraSelectPos);
    this.camera.lookAt(this.cameraLookAtPos);
    this.scene.add(this.camera);
    
    // camera animation
    
    this.cameraAnimationMixer = new THREE.AnimationMixer(this.camera);
    this.cameraAnimationMixer.addEventListener('finished', this.finishedCameraAnimation);
    
    this.cameraActions["init"] = this.createAction(this.cameraAnimationMixer,"init",3,this.cameraInitPos,this.cameraSelectPos,new THREE.Vector3(this.cameraSelectPos.x,this.cameraSelectPos.y,this.cameraSelectPos.z+100));
    
    this.cameraActions["right"] = this.createAction(this.cameraAnimationMixer,"right",2,this.cameraSelectPos,this.cameraRightPos);
    this.cameraActions["left"] = this.createAction(this.cameraAnimationMixer,"left",2,this.cameraSelectPos,this.cameraLeftPos);
    
    this.cameraCurrentAction = this.cameraActions["init"];
    this.cameraCurrentAction.play();
    
    // clock (for animation)
    
    this.clock = new THREE.Clock();

    // water
    
    this.waterGeometry = new THREE.PlaneGeometry( 1000, 1000, 127, 127);
    this.waterMaterial = new THREE.MeshPhongMaterial({ color: 0x33A7C3, flatShading: true }); //0x60c0ff
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
    
    //this.islandGeometry = new THREE.CylinderGeometry( 30, 40, 20, 10, 10 );
    this.islandGeometry = new THREE.SphereGeometry(40, 32, 32);
    this.islandMaterial = new THREE.MeshPhongMaterial({color: 0x967C57, flatShading: true });
    this.islandGeometry.mergeVertices();
    this._randomizeVertices(this.islandGeometry.vertices, 3, 30, 0);
    this.island = new THREE.Mesh( this.islandGeometry, this.islandMaterial);
    //this.island.position.y = -11.1;
    this.island.position.y = -30;
    this.island.receiveShadow = true;
    this.scene.add( this.island );
    
    let nrOfRocks = Math.floor(Math.random()*4+2);
    for(let i = 0; i < nrOfRocks; i++) {
      let rockSize = Math.floor(Math.random()*12+6);
      let rockDiv = Math.max(rockSize/2,4)
      let rockPosAng = Math.random()*Math.PI*2;
      let rockPosX = 32*Math.cos(rockPosAng);
      let rockPosZ = 32*Math.sin(rockPosAng);
      let rockPosY = Math.floor(Math.random()*5-rockSize-5);
      this.rockGeometry = new THREE.SphereGeometry(rockSize, rockDiv, rockDiv);
      this.rockMaterial = new THREE.MeshPhongMaterial({color: 0x7F7F7F, flatShading: true });
      this.rockGeometry.mergeVertices();
      this._randomizeVertices(this.rockGeometry.vertices, 4);
      this.rock = new THREE.Mesh( this.rockGeometry, this.rockMaterial);
      this.rock.position.set(rockPosX,rockPosY,rockPosZ);
      this.rock.receiveShadow = true;
      this.scene.add( this.rock );
    }
    
    // board
    
    let boardColorArr = [0x555555,0x777777];
    for(let i = 0; i < 25; i++) {
      this.board = new THREE.Mesh( new THREE.BoxBufferGeometry(5, 5, 5), new THREE.MeshPhongMaterial({ color: boardColorArr[i%2], flatShading: true }) );
      this.board.position.set((i%5)*5-10,-2.4,Math.floor(i/5)*5-10);
      this.board.receiveShadow = true;
      this.scene.add( this.board );
    }
    
    let nrOfMarks = Math.floor(Math.random()*25+25);
    for(let i = 0; i < nrOfMarks; i++) {
      this.boardMark = new THREE.Mesh( new THREE.BoxBufferGeometry(6, 0.2, 0.2), new THREE.MeshPhongMaterial({ color: 0x888888, flatShading: true }) );
      this.boardMark.position.y = 0.2;
      if(Math.random() > 0.5) {
        this.boardMark.rotation.y = Math.PI / 2;
        this.boardMark.position.x = Math.floor(Math.random()*6)*5-12.5;
        this.boardMark.position.z = Math.floor(Math.random()*5)*5-10;
      } else {
        this.boardMark.position.x = Math.floor(Math.random()*5)*5-10;
        this.boardMark.position.z = Math.floor(Math.random()*6)*5-12.5;
      }
      this.boardMark.receiveShadow = true;
      this.scene.add( this.boardMark );
    }

    /*
    this.grid = new THREE.GridHelper( 25, 5, 0x000000, 0x000000 );
    this.grid.material.opacity = 0.2;
    this.grid.material.transparent = true;
    this.scene.add( this.grid );
    */
    
    // block geometries
    
    for(let i = 0; i < 3; i++) {
      this.blockGeometries.push(new THREE.CylinderBufferGeometry((this.blockSize-0.5*i)/2, (this.blockSize-0.5*i)/2, this.blockHeight, 10));
    }
    
    this.blockGeometries.push(this.domeGeometry);
    this.blockMaterials.push(this.domeMaterial);
    
    // block bag (a simple block for now)
    
    this.blockBag = new THREE.Mesh(this.blockGeometries[0], this.blockMaterials[0]);
    this.blockBag.position.copy(this.blockBagPos);
    this.blockBag.castShadow = true;
    this.blockBag.receiveShadow = true;
    this.blockBag.name = "blockBag";
    this.scene.add( this.blockBag );
    
    // dome bag (a simple dome for now)
    
    this.domeBag = new THREE.Mesh(this.domeGeometry, this.domeMaterial);
    this.domeBag.position.copy(this.domeBagPos);
    this.domeBag.castShadow = true;
    this.domeBag.receiveShadow = true;
    this.domeBag.name = "domeBag";
    this.scene.add( this.domeBag );
    
    // card geometry
    
    this.cardGeometry = new THREE.SphereGeometry(5,10,10);
    this.cardGeometry.mergeVertices();
    this._randomizeVertices(this.cardGeometry.vertices, 2, 0.5, -0.5);
    this.cardGeometry.scale(0.6,1,1);
    
    // confirm button geometry
    
    this.confirmButtonGeometry = this.cardGeometry.clone();
    this.confirmButtonGeometry.scale(0.7,1,0.2);
    
    // name tag geometry
    
    this.nameTagGeometry = this.cardGeometry.clone();
    this.nameTagGeometry.scale(0.8,1,0.5);
    
    // renderer

    this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha:true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.gammaOutput = true;
    this.renderer.gammaFactor = 2.2;
    this.renderer.shadowMap.enabled = true; // Comment out to increase performance
    this.container.appendChild(this.renderer.domElement);

    window.addEventListener( 'resize', this.onWindowResize, false );
    window.addEventListener( 'orientationchange', this.onWindowResize, false );
    
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
    this.controls.maxPolarAngle = Math.PI/2;
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
    
    // preload
    
    if (this.props.preload) {
      // Was preloaded
      this.water.material = new THREE.MeshPhongMaterial({ flatShading: true, map: this.props.preload.waterTexture});
      this._updateBlockGeometry(0,this.props.preload.blockGeometry0.clone());
      this._updateBlockGeometry(1,this.props.preload.blockGeometry1.clone());
      this._updateBlockGeometry(2,this.props.preload.blockGeometry2.clone());
      this._updateWorkerGeometry(this.props.preload.workerGeometry.clone());
      for ( let i = 1; i <= 10; i++ ) {
        this.cardsText[i-1].add(this.props.preload.cardsText[i]);
      }
      this.font = this.props.preload.font;
    } else {
      // Was not preloaded
      // water
      let waterTextureLoader = new THREE.TextureLoader().load(bgTexture, (texture) => {
        this.water.material = new THREE.MeshPhongMaterial({ flatShading: true, map: texture });
      });
      
      // blocks
      let loader = new STLLoader();
      loader.load("./content/models/Base_1.1.stl", (geometry) => {
        this._updateBlockGeometry(0,geometry);
      });
      loader.load("./content/models/Middle_1.1.stl", (geometry) => {
        this._updateBlockGeometry(1,geometry);
      });
      loader.load("./content/models/Top_1.1.stl", (geometry) => {
        this._updateBlockGeometry(2,geometry);
      });
      
      // worker
      loader.load("./content/models/ogreout.stl", (geometry) => {
        this._updateWorkerGeometry(geometry);
      });
      
      // cards
      let textLoader = new THREE.FontLoader();
      textLoader.load("./content/fonts/helvetiker_bold.typeface.json", (font) => {
        this.font = font;
        for ( let nr = 1; nr <= 10; nr++ ) {
          let cardText = new THREE.Group();
          this._addLine(cardText,font,GodCardsData[nr].name,-2,0x333333,5);
          GodCardsData[nr].text.forEach((line,i) => {
            this._addLine(cardText,font,line,i,0x333333);
          });
          this.cardsText[nr-1].add(cardText);
        }
      });
    }
    
    // Get stored graphics setting
    if(localStorage.getItem('graphicsLevel') != null) {
      this.setGraphics(Number(localStorage.getItem('graphicsLevel')));
    }
    
    // Init water animation
    this.animateWater(true,0.017);
    
    // Start animation loop
    this.animate();
  }
  
  _updateBlockGeometry = (nr,geometry) => {
    switch (nr) {
      case 0:
        geometry.center();
        geometry.rotateX(-Math.PI/2);
        geometry.rotateZ(Math.PI/6);
        geometry.scale(0.075,0.075,0.075);
        geometry.rotateY(Math.PI);
        this.blockBag.geometry = geometry;
        break;
      case 1:
        geometry.center();
        geometry.rotateX(-Math.PI/2);
        geometry.translate(3.7,1,0);
        geometry.scale(0.075,0.075,0.075);
        geometry.rotateY(Math.PI);
        break;
      case 2:
        geometry.center();
        geometry.rotateX(-Math.PI/2);
        geometry.translate(-1.3,0.7,5);
        geometry.scale(0.075,0.095,0.075);
        geometry.rotateY(Math.PI);
        break;
    }
    this.blockGeometries[nr] = geometry;
    this.blocks.forEach((block) => {
      if(block.position.y == this.blockHeight / 2 + this.blockHeight * nr) {
        block.geometry = this.blockGeometries[nr];
      }
    });
    /*
    let block = new THREE.Mesh(this.blockGeometries[nr], this.blockMaterials[nr]);
    block.position.set(0,this.blockHeight/2+this.blockHeight*nr,0);
    this.scene.add(block);
    */
  }
  
  _updateWorkerGeometry = (geometry) => {
    geometry.center();
    geometry.rotateX(-Math.PI/2);
    geometry.translate(0,2,0);
    geometry.scale(0.05,0.07,0.05);
    geometry.rotateY(-Math.PI/2);
    this.workerGeometry = geometry;
    this.myWorkers.forEach((worker) => {
      if (this.isTouchControls) {
        worker.getObjectByName("workerModel").geometry = this.workerGeometry;
      } else {
        worker.geometry = this.workerGeometry;
      }
    });
    this.oppoWorkers.forEach((worker) => {
      if (this.isTouchControls) {
        worker.getObjectByName("workerModel").geometry = this.workerGeometry;
      } else {
        worker.geometry = this.workerGeometry;
      }
    });
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
  createAction = (mixer,name,duration,startPos, endPos, middlePos=null, infinite=false) => {
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
    let action = mixer.clipAction(clip);
    action.clampWhenFinished = true;
    action.setDuration(duration);
    if (infinite) {
      action.setLoop(THREE.LoopRepeat);
    } else {
      action.setLoop(THREE.LoopOnce);
    }
    return action;
  }
  
  _randomizeVertices = (vertices,amount,min=null,max=null) => {
    vertices.forEach((v) => {
      v.x += -(amount/2) + Math.random()*amount;
      v.y += -(amount/2) + Math.random()*amount;
      v.z += -(amount/2) + Math.random()*amount;
      if(min != null) {
        v.y = Math.min(v.y,min);
      }
      if(max != null) {
        v.y = Math.max(v.y,max);
      }
    });
  }
  
  // Functions called by GamePage (and this)
  
  // Initialize cards
  initCards = () => {
    if (this.cards.length > 0) {
      return;
    }
    
    this.props.game.players.forEach((player,i) => {
      if (player.card == null) {
        return;
      }
    
      // Display card of players
      //let textureCard = new THREE.CanvasTexture(this._canvasCardTexture(godCardsEnum[player.card]));
      //let card = new THREE.Mesh( this.cardGeometry, new THREE.MeshPhongMaterial({ color: 0xccaa11, flatShading: true, map: textureCard }) );
      let card = new THREE.Mesh( this.cardGeometry, this.cardMaterial );
      card.position.set( 20 - 40 * i, 0, 5 - 10 * i );
      card.rotation.y = Math.PI / 2 - Math.PI*i;
      card.name = godCardsEnum[player.card];
      this.scene.add(card);
      this.cards.push(card);
      // Add text
      //this._addCardText(card, godCardsEnum[player.card]);
      card.add(this.cardsText[godCardsEnum[player.card]-1]);
      card.castShadow = true;
      card.receiveShadow = true;
    });
  }
  
  // Initialize workers of one player next to board (including name tag)
  initWorkers = () => {
    if (this.myWorkers.length > 0 && this.oppoWorkers.length > 0) {
      return;
    }
    
    this.props.game.players.forEach((player,i) => {
      if (player.color) {
        if (player.id == localStorage.getItem('player_id')){
          if (this.myWorkers.length == 0) {
            this._initWorkers(player,i,this.myWorkers);
            this._initNameTag(player,i);
          }
        } else {
          if (this.oppoWorkers.length == 0) {
            this._initWorkers(player,i,this.oppoWorkers);
            this._initNameTag(player,i);
          }
        }
      }
    });
  }
  
  _initWorkers = (player,i,arr) => {
    for ( let j = 0; j < 2; j++ ) {
      let workerModel = new THREE.Mesh(this.workerGeometry, new THREE.MeshPhongMaterial({color: this.colorPreset[player.color], flatShading: true}));
      workerModel.rotation.y = -Math.PI/2 + Math.PI*i;
      workerModel.castShadow = true;
      workerModel.receiveShadow = true;
      
      let worker = null;
      
      if (this.isTouchControls) {
        workerModel.name = "workerModel";
        worker = new THREE.Mesh(this.workerBoundingGeometry, this.workerBoundingMaterial);
        worker.renderOrder = 1;
        worker.add(workerModel);
      } else {
        worker = workerModel;
      }
      
      worker.position.set(15-30*i, this.workerHeight/2, (-2.5+5*i)+(-5+10*i)*j);
      this.scene.add( worker );
      worker.userData = {"worker":player.workers[j],"field":null,"onBoard":false,"posX":null,"posY":null};
      arr.push( worker );
    }
  }
  
  _initNameTag = (player,i) => {
    //let textureNameTag = new THREE.CanvasTexture(this._canvasTextTexture(this._getUsername(player),10,100,40));
    //let nameTag = new THREE.Mesh( new THREE.BoxBufferGeometry( 5, 0.1, 2 ), new THREE.MeshPhongMaterial({ color: 0xffffff, flatShading: true, map: textureNameTag }) );
    let nameTag = new THREE.Mesh( this.nameTagGeometry, new THREE.MeshPhongMaterial({color: this.colorPreset[player.color], flatShading: true}));
    
    nameTag.position.set( 20 - 40 * i, 0, -5 + 10 * i );
    nameTag.rotation.y = Math.PI / 2 - Math.PI*i;
    
    nameTag.castShadow = true;
    nameTag.receiveShadow = true;
    this.scene.add(nameTag);
    this.nameTags.push(nameTag);
    this._addText(nameTag,this._getUsername(player),0xdddddd,-0.3);
  }
  
  _getUsername = (player) => {
    let username = [];
  
    if(player.id == localStorage.getItem('player_id')) {
      username.push("YOU");
    } else {
      username.push("ENEMY");
    }
    
    if(player.username != null) {
      username.push("("+player.username+")");
    } else {
      username.push("(GUEST)");
    }
    
    return username;
  }
  
  _showIndicators = (move, build, bags=true) => {
    this.indicators.forEach((indicator) => {
      indicator.userData = null;
      indicator.parent.remove(indicator);
    })
    this.indicators = [];
    
    if (move) {
      this.myWorkers.forEach((worker) => {
        this._displayIndicator(worker, this.indicatorMaterialAction);
      })
    }
    if (build) {
      if (bags) {
        this._displayIndicator(this.blockBag, this.indicatorMaterialAction);
        this._displayIndicator(this.domeBag, this.indicatorMaterialAction);
      }
      this.myWorkers.forEach((worker) => {
        if (worker.userData.worker.isCurrentWorker) {
          this._displayIndicator(worker, this.indicatorMaterialShow);
        }
      });
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
      
      // Prometheus - allow building in move phase
      if (this.frontendGodCardsCheck(10,true)) {
        build = true;
      }
      
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
    
    if (this.playInitAnimation || this.playStartAnimation > 0) {
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
  
  setGraphics = (level) => {
    switch (level) {
      case 0:
        this.dirLight.castShadow = false;
        this.shouldAnimateWater = false;
        break;
      case 1:
        this.dirLight.castShadow = true;
        this.shouldAnimateWater = false;
        break;
      case 2:
        this.dirLight.castShadow = true;
        this.shouldAnimateWater = true;
        break;
    }
  }
  
  setTime = (isNight,update=true) => {
    if (isNight) {
      this.fogColor = 0x514141;
      this.sunSkyPos.set(-50,10,-100);
      this.sunLightPos.set(-50,150,-100);
      this.ambiLightColor = 0xff4444;
      this.hemiLightColor = 0x888888;
    } else {
      this.fogColor = 0xF0F5F7;
      this.sunSkyPos.set(50,200,100);
      this.sunLightPos.set(50,200,100);
      this.ambiLightColor = 0xffcccc;
      this.hemiLightColor = 0xcccccc;
    }
    if (update) {
      this.scene.fog.color.setHex(this.fogColor);
      this.sky.material.uniforms["sunPosition"].value.copy(this.sunSkyPos);
      this.dirLight.position.copy(this.sunLightPos);
      this.ambiLight.color.setHex(this.ambiLightColor);
      this.hemiLight.color.setHex(this.hemiLightColor);
    }
  }
  
  /*
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
  */
  
  _addLine = (obj,font,line,i,color,size=3,offsetZ=-2) => {
    let geometry = new THREE.TextBufferGeometry(line, {
      font: font,
      size: size,
      height: 2,
      curveSegments:1
    });
    geometry.center();
    geometry.rotateX(-Math.PI/2);
    geometry.scale(0.1,0.1,0.1);
    let text = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({ color: color, flatShading: true}));
    text.position.y = 0.5;
    text.position.z = i*0.7+offsetZ;
    obj.add(text);
  }
  
  _addText = (obj,text,color,offsetZ=0) => {
    let textLoader = new THREE.FontLoader();
    if (this.font != null) {
      text.forEach((line,i) => {
        this._addLine(obj,this.font,line,i,color,5-2*i,offsetZ);
      });
    } else {
      textLoader.load("./content/fonts/helvetiker_bold.typeface.json", (font) => {
        text.forEach((line,i) => {
          this._addLine(obj,font,line,i,color,5-2*i,offsetZ);
        });
      });
    }
  }
  
  /*
  _addCardText = (card, nr) => {
    let textLoader = new THREE.FontLoader();
    textLoader.load("./content/fonts/helvetiker_bold.typeface.json", (font) => {
      this._addLine(card,font,GodCardsData[nr].name,-2,0x333333,5);
      GodCardsData[nr].text.forEach((line,i) => {
        this._addLine(card,font,line,i,0x333333);
      });
    });
  }
  */
  
  _displayCard = (posX,posY,posZ, nr) => {
    //let texture = new THREE.CanvasTexture(this._canvasCardTexture(nr));
    //let card = new THREE.Mesh( this.cardGeometry, new THREE.MeshPhongMaterial({ color: 0xccaa11, flatShading: true, map: texture }) );
    let card = new THREE.Mesh( this.cardGeometry, this.cardMaterial );
    card.rotation.x = Math.PI / 2;
    card.position.set(posX,posY,posZ);
    card.name = nr;
    this.camera.add(card);
    this.cards.push(card);
    // Add text
    //this._addCardText(card, nr);
    card.add(this.cardsText[nr-1]);
  }
  
  _displayConfirmButton = (posX,posY,posZ) => {
    //let texture = new THREE.CanvasTexture(this._canvasTextTexture("Confirm",15,128,64));
    
    //let confirmMaterials = new Array(6).fill(new THREE.MeshPhongMaterial({ flatShading: true}));
    //confirmMaterials[3] = new THREE.MeshPhongMaterial({ flatShading: true, map: texture });
    
    //let confirmButton = new THREE.Mesh(new THREE.BoxBufferGeometry( 4, 2, 2 ), confirmMaterials);
    let confirmButton = new THREE.Mesh(this.confirmButtonGeometry, this.confirmButtonMaterial);
    confirmButton.rotation.x = Math.PI / 2;
    confirmButton.position.set(posX,posY,posZ);
    confirmButton.name = "confirm";
    confirmButton.visible = false;
    this.camera.add(confirmButton);
    this._addText(confirmButton,["Confirm"],0x333333);
  }
  
  _displayIndicator = (obj, material) => {
    let indicator = new THREE.Mesh(this.indicatorGeometry, material);
    indicator.rotation.x = -Math.PI;
    indicator.scale.set(0.4,0.4,0.4);
    //indicator.position.copy(pos);
    indicator.position.y += this.blockHeight+1;
    
    indicator.userData.mixer = new THREE.AnimationMixer(indicator);
    indicator.userData.action = this.createAction(indicator.userData.mixer,"indicate",1,indicator.position,indicator.position,new THREE.Vector3(indicator.position.x,indicator.position.y+1,indicator.position.z),true);
    indicator.userData.action.play();
    
    obj.add(indicator);
    this.indicators.push(indicator);
  }
  
  _displayStartPlayers = (posX,posY,posZ, username) => {
    //let texture = new THREE.CanvasTexture(this._canvasTextTexture(username,15,128,64));
    //let usernameTag = new THREE.Mesh( new THREE.BoxBufferGeometry( 8, 0.1, 4 ), new THREE.MeshPhongMaterial({ color: 0xffffff, flatShading: true, map: texture }) );
    let nameTag = new THREE.Mesh(this.nameTagGeometry, this.nameTagMaterial);
    nameTag.position.set(posX,posY,posZ);
    nameTag.rotation.x = Math.PI / 2;
    nameTag.name = "select";
    if(username[0] == "YOU") {
      nameTag.userData = {"level":"player","data":{isCurrentPlayer:true}};
    } else {
      nameTag.userData = {"level":"opponent","data":{isCurrentPlayer:true}};
    }
    this.camera.add(nameTag);
    this._addText(nameTag,username,0xdddddd,-0.3);
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
    
    if (this.cards.length == 10) {
      return;
    }
    
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
    
    if (this.cards.length == 2) {
      return;
    }
    
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
      while(card.children.length) {
        card.remove(card.children[0]);
      }
      this.camera.remove(card);
    })
    this.cards = [];
  }
  
  // Display both player usernames
  StartPlayer = () => {
    this.setControls(false,true); // lookAround=false,select=true
    
    // Display both usernames
    this.props.game.players.forEach((player,i) => {
      this._displayStartPlayers(-5+10*i, 0, this.selectDis, this._getUsername(player));
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
    this.setControls(true,true,true); // lookAround=true,select=true,move=true
    
    // Play camera animation
    if (this.playStartAnimation == -1) {
      if (this.props.game.players[0].id  == localStorage.getItem('player_id')) {
        this.playStartAnimation = 1;
        this.playCameraAnimation("right");
      } else {
        this.playStartAnimation = 2;
        this.playCameraAnimation("left");
      }
      
      // Disable controls during animation
      this.setControls(false,false,false); // lookAround=false,select=false,move=false
    }
  }
  
  // Input
  // Use this.props.inputHandler() to pass input to GamePage in order to process it
  
  frontendMoveCheck = (posX,posZ,initPos) => {
    if(!this.frontendCheck) {
      return true;
    }
    
    // See if initial positon of worker was outside field -> player is positioning workers
    let initMove = false;
    if (initPos.x > 10 || initPos.x < -10 || initPos.z > 10 || initPos.z < -10) {
      initMove = true;
    }
    
    // Check if field has dome
    if (this.fields[posX][posZ].blocks > 3 || this.fields[posX][posZ].hasDome) {
      return false;
    }
    
    // Check if field has worker, Apollo & Minotaur - allow for move on top of worker
    if (this.fields[posX][posZ].worker != null && !this.frontendGodCardsCheck(1,true,initMove) && !this.frontendGodCardsCheck(8,true,initMove)) {
      return false;
    }
    
    // Allow for placement of worker more than 1 block away from initial position when first positioning workers
    if (initMove) {
      return true;
    }
    
    // Hermes - extend allowed move distance to anywhere on board
    if (this.frontendGodCardsCheck(7,true)) {
      return true;
    }
    
    // Check move distance
    let maxMoveDis = 6;
    // Artemis - extend allowed move distance to 2 fields
    if (this.frontendGodCardsCheck(2,true)) {
      maxMoveDis = 11;
    }
    if (Math.abs((posX+10)-(Math.round(initPos.x)+10)) > maxMoveDis) {
      return false;
    }
    if (Math.abs((posZ+10)-(Math.round(initPos.z)+10)) > maxMoveDis) {
      return false;
    }
    
    // Check move height difference
    if ((this.fields[posX][posZ].blocks - this.fields[Math.round(initPos.x)][Math.round(initPos.z)].blocks) > 1) {
      return false;
    }
    
    return true;
  }
  
  frontendBuildCheck = (posX,posZ,name) => {
    if(!this.frontendCheck) {
      return true;
    }
    
    // Check if field has dome
    if (this.fields[posX][posZ].blocks > 3 || this.fields[posX][posZ].hasDome) {
      return false;
    }
    
    // Check if field has worker
    if (this.fields[posX][posZ].worker != null) {
      return false;
    }
    
    // Check if dome can be build, Atlas - dome can be build at any level
    if (name == "domeBag" && this.fields[posX][posZ].blocks < 3 && !this.frontendGodCardsCheck(4,true)) {
      return false;
    }
    
    // Check build distance from current worker
    let flag = true;
    this.myWorkers.forEach((worker) => {
      if (worker.userData.worker.isCurrentWorker) {
        if (Math.abs((posX+10)-(Math.round(worker.position.x)+10)) > 6) {
          flag = false;
        }
        if (Math.abs((posZ+10)-(Math.round(worker.position.z)+10)) > 6) {
          flag = false;
        }
        // Demeter - check that second block not on same field
        if (this.frontendGodCardsCheck(5, true) && this.lastBuiltBlockField != null && this.posEnum[posX] == this.lastBuiltBlockField.posX && this.posEnum[posZ] == this.lastBuiltBlockField.posY){
          flag = false;
        }
        // Hephaestus - check that second block is on same field
        if(this.frontendGodCardsCheck(6, true) && this.lastBuiltBlockField != null && (!(this.posEnum[posX] == this.lastBuiltBlockField.posX && this.posEnum[posZ] == this.lastBuiltBlockField.posY) || this.fields[posX][posZ].blocks >= 3)) {
          flag = false;
        }
      }
    });
    return flag;
  }
  
  frontendGodCardsCheck = (cardNr,own,initMove=false) => {
    if(!this.props.game.isGodMode) {
      return false;
    }
    if (initMove) {
      return false;
    }
    
    // Get own and opponent card
    let ownCardNr = null;
    let oppoCardNr = null;
    this.props.game.players.forEach((player) => {
      if (player.id == localStorage.getItem('player_id')) {
        ownCardNr = godCardsEnum[player.card];
      } else {
        oppoCardNr = godCardsEnum[player.card];
      }
    });
    
    // Check if own card
    if (own && ownCardNr == cardNr) {
          return true;
    }
    
    // Check if opponent card
    if (!own && oppoCardNr == cardNr) {
          return true;
    }
    
    return false;
  }
  
  onDragStartWorker = (event) => {
    this.controls.enabled = false;
    this.inputEnabled = false;
    
    this._showIndicators(false,false);
    
    this.draged = true;
    
    this.dragedWorkerInitPos = event.object.position.clone();
    
    // Create ghost worker
    if(this.isTouchControls) {
      this.ghostWorker = event.object.getObjectByName("workerModel").clone();
    } else {
      this.ghostWorker = event.object.clone();
    }
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
      if (!this.frontendMoveCheck(posX,posZ,this.dragedWorkerInitPos)) {
        this.ghostWorker.material.color.setHex(0xff0000);
      } else {
        this.ghostWorker.material.color.setHex(0x00ff00);
      }
      this.ghostWorker.position.x = posX;
      this.ghostWorker.position.z = posZ;
      this.ghostWorker.position.y = 2 + this.blockHeight * this.fields[posX][posZ].blocks;
      if(this.fields[posX][posZ].worker != null) {
        this.ghostWorker.position.y += this.workerHeight;
      } else if(this.fields[posX][posZ].hasDome) {
        this.ghostWorker.position.y += this.blockHeight/2;
      }
    }
  }
  
  onDragEndWorker = (event) => {
    this.controls.enabled = true;
    this.inputEnabled = true;
    
    // Remove ghost worker
    this.scene.remove(this.ghostWorker);
    //this.ghostWorker.material.dispose();
    
    let posX = Math.floor( ( event.object.position.x + 2.5 ) / 5 ) * 5;
    let posZ = Math.floor( ( event.object.position.z + 2.5 ) / 5 ) * 5;
    
    // Uncomment to let frontend prevent invalid move
    if (posX > 10 || posX < -10 || posZ > 10 || posZ < -10 || !this.frontendMoveCheck(posX,posZ,this.dragedWorkerInitPos)) {
    // Worker outside field
    //if (posX > 10 || posX < -10 || posZ > 10 || posZ < -10) {
      // Reset position of worker
      event.object.position.copy(this.dragedWorkerInitPos);
      this._showIndicators(this.dragControlsWorker.enabled,this.dragControlsBlock.enabled);
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
          } else {
            this._showIndicators(this.dragControlsWorker.enabled,this.dragControlsBlock.enabled);
          }
          
          break;
        case "MOVE":
          // Prometheus, add block to front of array if built before move
          if (this.frontendGodCardsCheck(10,true) && this.lastBuiltBlockField != null) {
            workerFields.push(this.lastBuiltBlockField);
          }
        
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
          
          // Hermes
          if (this.frontendGodCardsCheck(7,true)) {
            this.myWorkers.forEach((worker,i) => {
              if (workerFields[1].worker.id == worker.userData.worker.id) {
                this.movedWorkerFields[i*2] = workerFields[0];
                this.movedWorkerFields[i*2+1] = workerFields[1];
              }
            });
            if (this.movedWorkerFields[0] == null || this.movedWorkerFields[2] == null) {
              this._showIndicators(this.dragControlsWorker.enabled,this.dragControlsBlock.enabled);
              break;
            } else {
              workerFields = this.movedWorkerFields;
            }
          }

          // Send input to GamePage
          this.props.inputHandler("board",workerFields);
      
          break;
      }
    }
  }
  
  onDragStartBlock = (event) => {
    this.controls.enabled = false;
    this.inputEnabled = false;
    
    this._showIndicators(false,true,false);
    
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
      if (!this.frontendBuildCheck(posX,posZ,event.object.name)) {
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
      if(this.fields[posX][posZ].worker != null) {
        this.ghostBlock.position.y += this.workerHeight;
      } else if(this.fields[posX][posZ].hasDome) {
        this.ghostBlock.position.y += this.blockHeight/2;
      }
    }
  }
  
  onDragEndBlock = (event) => {
    this.controls.enabled = true;
    this.inputEnabled = true;
  
    // Remove ghost block
    this.scene.remove(this.ghostBlock);
    //this.ghostBlock.material.dispose();
    
    let posX = Math.floor( ( event.object.position.x + 2.5 ) / 5 ) * 5;
    let posZ = Math.floor( ( event.object.position.z + 2.5 ) / 5 ) * 5;
    
    event.object.position.copy(this.placeholderBlock.position);
    event.object.geometry = this.placeholderBlock.geometry.clone();
    event.object.material = this.placeholderBlock.material.clone();
    this.scene.remove(this.placeholderBlock);
    //this.placeholderBlock.geometry.dispose();
    //this.placeholderBlock.material.dispose();
    
    // Uncomment to let frontend prevent invalid move
    if (posX > 10 || posX < -10 || posZ > 10 || posZ < -10 || !this.frontendBuildCheck(posX,posZ,event.object.name)) {
    // Worker outside field
    //if (posX > 10 || posX < -10 || posZ > 10 || posZ < -10) {
      // Invalid action
      this._showIndicators(this.dragControlsWorker.enabled,this.dragControlsBlock.enabled);
    } else {
      switch(this.props.game.status) {
        case "MOVE":
          if (!this.frontendGodCardsCheck(10,true) || this.lastBuiltBlockField != null) {
            // Invalid action
            this._showIndicators(this.dragControlsWorker.enabled,this.dragControlsBlock.enabled);
            break;
          }
        case "BUILD":
          // Get number of blocks on field before
          let blockNr = this.fields[posX][posZ].blocks;
          let blockFields = [];
          let myWorker = null;

          // Get new field of block
          this.props.game.board.fields.forEach((field) => {
            if(field.posX == this.posEnum[posX] && field.posY == this.posEnum[posZ]) {
              blockFields.push(field);
            }
          });

          if (event.object.name == "domeBag") {
            
            // Create dome
            this.createDome(posX,posZ,blockNr);
            
            // Update field frontend and backend
            this.fields[posX][posZ].hasDome = true;
            blockFields[0].hasDome = true;
            
          } else {
          
            // Create block
            this.createBlock(posX,posZ,blockNr);
            
            // Update field frontend and backend
            if (this.fields[posX][posZ].blocks >= 3) {
              // Has dome to field
              this.fields[posX][posZ].hasDome = true;
              blockFields[0].hasDome = true;
            } else {
              // Add block to field
              this.fields[posX][posZ].blocks += 1;
              blockFields[0].blocks += 1;
            }
          }
          
          // Demeter & Hephaestus, can place two blocks
          if((this.frontendGodCardsCheck(5, true) || this.frontendGodCardsCheck(6, true)) && this.lastBuiltBlockField != null){
            blockFields.unshift(this.lastBuiltBlockField);
          }
          
          // Demeter & Hephaestus, if only built one block, don't send input yet
          if ((this.frontendGodCardsCheck(5, true) || this.frontendGodCardsCheck(6, true)) && blockFields.length == 1) {
            this.lastBuiltBlockField = blockFields[0];
            this._showIndicators(this.dragControlsWorker.enabled,this.dragControlsBlock.enabled);
            
            // Tell GamePage to display button to skip building second block
            this.props.skipButtonSet(5);
            break;
          }
          
          // Prometheus, don't send input if build before move
          if (this.props.game.status == "MOVE" && this.frontendGodCardsCheck(10,true) && blockFields.length == 1) {
            this.lastBuiltBlockField = blockFields[0];
            
            this.dragControlsBlock.enabled = false;
            this.dragControlsBlock.deactivate();
            this._showIndicators(this.dragControlsWorker.enabled,this.dragControlsBlock.enabled);
            break;
          }
        
          // Send input to GamePage
          this.props.inputHandler("board",blockFields);
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
          // Check if obj was clicked, then move it back
          if (obj.position.z == this.selectCardDis && obj.name && (obj.name == "confirm" || !isNaN(obj.name))) {
            obj.position.z = obj.position.z-this.selectDelta;
          } else if (obj.name == "select") {
            obj.position.z = this.selectDis-this.selectDelta;
          }
          break;
        case "COLOR2":
          // Check if obj was clicked, then move it back
          if (obj.position.z == this.selectCardDis && obj.name && (obj.name == "confirm" || !isNaN(obj.name))) {
            obj.position.z = obj.position.z-this.selectDelta;
          } else if (obj.name == "select") {
            obj.position.z = this.selectDis-this.selectDelta;
          }
          this.props.game.players.forEach((player) => {
            if (player.id == localStorage.getItem('player_id') && player.isCurrentPlayer) {
              return;
            }
          });
        case "POSITION1":
        case "POSITION2":
        case "MOVE":
        case "BUILD":
          // Remove card or name tag in front of camera
          if (this.camera.getObjectByName("displayCard") != null) {
              this.camera.remove(this.camera.getObjectByName("displayCard"));
              this.cards.forEach((card) => {
                card.visible = true;
              });
              this.nameTags.forEach((nameTag) => {
                nameTag.visible = true;
              });
          }
          // Display card or name tag in front of camera if clicked
          if ((this.cards.includes(obj) || this.nameTags.includes(obj)) && obj.visible && this.camera.getObjectByName("displayCard") == null) {
              let displayCard = obj.clone();
              displayCard.name = "displayCard";
              displayCard.position.set(0,0,-20);
              displayCard.rotation.set(Math.PI/2,0,0);
              this.camera.add(displayCard);
              obj.visible = false;
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
        case "COLOR2":
          this.handleSelect(obj);
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
  
  // God cards skip functions
  
  DemeterHephaestusSkip = () => {
    // Send input to GamePage
    this.props.inputHandler("board",[this.lastBuiltBlockField]);
  }
  
  HermesSkip = () => {
    for(let i = 0; i < 4; i++) {
      if(this.movedWorkerFields[i] == null) {
        this.props.game.board.fields.forEach((field) => {
          let j = (i > 1) ? 1 : 0;
          if (field.id == this.myWorkers[j].userData.field.id) {
            this.movedWorkerFields[i] = field;
          }
        });
      }
    }
    // Send input to GamePage
    this.props.inputHandler("board",this.movedWorkerFields);
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
    
    // Demeter & Hephaestus & Prometheus
    this.lastBuiltBlockField = null;
    
    // Hermes
    this.movedWorkerFields = [null,null,null,null];
    
    // Show indicators
    this._showIndicators(this.dragControlsWorker.enabled,this.dragControlsBlock.enabled);
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
    worker.userData.worker = field.worker;
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
      // Show indicators
      this._showIndicators(this.dragControlsWorker.enabled,this.dragControlsBlock.enabled);
    }
  }
  
  animateWater = (bool,delta) => {
    if (bool) {
      this.water.geometry.vertices.forEach((v,i) => {
        v.x = this.waterVertices[i].x + Math.cos(this.waterVertices[i].a) * this.waterVertices[i].A
        v.y = this.waterVertices[i].y + Math.sin(this.waterVertices[i].a) * this.waterVertices[i].A
        this.waterVertices[i].a += this.waterVertices[i].v*delta;
      });
      this.water.geometry.verticesNeedUpdate = true;
      this.water.position.z -= this.waterSpeed*delta;
      
      // Reverse water if off screen
      if ( (this.water.position.z <= (-500 + this.skyScalar) && this.waterSpeed > 0) || (this.water.position.z >= (500 - this.skyScalar) && this.waterSpeed < 0) ) {
        this.waterSpeed *= -1;
        this.water.geometry.vertices.forEach((v,i) => {
          this.waterVertices[i].v *= -1;
        });
      }
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
    this.animateWater(this.shouldAnimateWater,delta);
    
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
    
    // Animate Indicators
    this.indicators.forEach((indicator) => {
      indicator.userData.mixer.update(delta);
    })
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
      <div style={{position:"absolute",overflow:"hidden",top:"0px",left:"0px",width:"100%", height:"100%",zIndex:"-1"}} ref={container => { this.container = container }} />
    )
  }
}

export default Game;
