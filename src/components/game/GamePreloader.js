import * as THREE from "three";
import bgTexture from "../../views/design/background-gradient.png";

class GamePreloader {

  constructor() {
    //THREE.Cache.enabled = true;
  }
  
  preload = () => {
    // Preload water texture
    return new Promise((resolve,reject) => {
      let loader = new THREE.TextureLoader().load(bgTexture, (texture) => {
        resolve({waterTexture:texture});
      });
    });
  }
}

export default GamePreloader;
