import * as THREE from "three";
import bgTexture from "../../views/design/background-gradient.jpeg";
import GodCardsData from "../../views/design/GodCardsData";

const STLLoader = require('three-stl-loader')(THREE);

class GamePreloader {

  constructor() {
    //THREE.Cache.enabled = true;
    this.preloadContent = {
      waterTexture:null,
      blockGeometry0:null,
      blockGeometry1:null,
      blockGeometry2:null,
      workerGeometry:null,
      font:null,
      cardsText:{}
    };
    this.checkPreloadInterval = null;
  }
  
  preload = () => {
    // Preload water texture
    return new Promise((resolve,reject) => {
      this.checkPreloadInterval = setInterval(() => this.checkResolve(resolve), 100);
      // water
      let loaderTexture = new THREE.TextureLoader().load(bgTexture, (texture) => {
        this.preloadContent.waterTexture = texture;
      });
      // blocks
      let loaderSTL = new STLLoader();
      loaderSTL.load("./content/models/Base_1.1.stl", (geometry) => {
        this.preloadContent.blockGeometry0 = geometry;
      });
      loaderSTL.load("./content/models/Middle_1.1.stl", (geometry) => {
        this.preloadContent.blockGeometry1 = geometry;
      });
      loaderSTL.load("./content/models/Top_1.1.stl", (geometry) => {
        this.preloadContent.blockGeometry2 = geometry;
      });
      loaderSTL.load("./content/models/ogreout.stl", (geometry) => {
        this.preloadContent.workerGeometry = geometry;
      });
      // cards
      let fontLoader = new THREE.FontLoader();
      fontLoader.load("./content/fonts/helvetiker_bold.typeface.json", (font) => {
        this.preloadContent.font = font;
        for ( let nr = 1; nr <= 10; nr++ ) {
          let cardText = new THREE.Group();
          this._addLine(cardText,font,GodCardsData[nr].name,-2,0x333333,5);
          GodCardsData[nr].text.forEach((line,i) => {
            this._addLine(cardText,font,line,i,0x333333);
          });
          this.preloadContent.cardsText[nr] = cardText;
        }
      });
    });
  }
  
  // Same as in Game.js
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
  
  checkResolve = (resolve) => {
    if (this.preloadContent.waterTexture != null && this.preloadContent.blockGeometry0 != null && this.preloadContent.blockGeometry1 != null && this.preloadContent.blockGeometry2 != null && this.preloadContent.workerGeometry != null && this.preloadContent.font != null && Object.keys(this.preloadContent.cardsText).length == 10) {
      clearInterval(this.checkPreloadInterval);
      resolve(this.preloadContent);
    }
  }
}

export default GamePreloader;
