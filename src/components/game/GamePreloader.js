import * as THREE from "three";
import bgTexture from "../../views/design/background-gradient.png";

const STLLoader = require('three-stl-loader')(THREE);

class GamePreloader {

  constructor() {
    //THREE.Cache.enabled = true;
    this.preloadContent = {waterTexture:null,blockGeometry0:null,blockGeometry1:null,blockGeometry2:null,workerGeometry:null};
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
    });
  }
  
  checkResolve = (resolve) => {
    if (this.preloadContent.waterTexture != null && this.preloadContent.blockGeometry0 != null && this.preloadContent.blockGeometry1 != null && this.preloadContent.blockGeometry2 != null && this.preloadContent.workerGeometry != null) {
      clearInterval(this.checkPreloadInterval);
      resolve(this.preloadContent);
    }
  }
}

export default GamePreloader;
