import React from "react";
import styled, {css, keyframes} from "styled-components";
import {BaseContainer} from "../../helpers/layout";
import {getDomain} from "../../helpers/getDomain";
import Player from "../../views/Player";
import {Spinner} from "../../views/design/Spinner";
import {Button} from "../../views/design/Button";
import {withRouter} from "react-router-dom";
import * as THREE from "three";
import DragControls from 'three-dragcontrols';
import OrbitControls from 'three-orbitcontrols';

const Container = styled(BaseContainer)`
  color: white;
  text-align: center;
  justify-content: left;
`;

const UsersContainer = styled(BaseContainer)`
  color: white;
  position: absolute;
  left: 100px;
`;

const Users = styled.ul`
  list-style: none;
  padding-left: 0;
  max-height: 580px;
  overflow: auto;
`;

const PlayerContainer = styled.li`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const ModesContainer = styled(BaseContainer)`
  position: absolute;
  right: 100px;
  width: 300px;
  height: 500px;
  overflow: hidden;
  color: #3E5774;
`;

const ModeButton = styled.button`
  box-sizing: border-box;
  width: 150px;
  border: 5px solid #2167AC;
  padding: 20px;
 
  border-bottom-right-radius: ${props => props.rightBottom || null};
  border-bottom-left-radius: ${props => props.leftBottom || null};
  border-top-right-radius: ${props => props.rightTop || null};
  border-top-left-radius: ${props => props.leftTop || null};
  
  border-right-width:${props => props.borderRight || null};
  border-left-width:${props => props.borderLeft || null};
  
  color: #E4F5B2;
  font-size: x-large;
`;

const Spin = keyframes`
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
`;

const NoSpin = keyframes`
    0% { transform: rotate(360deg); }
    100% { transform: rotate(0deg); }
`;

const StartButton = styled.button`
  position: absolute;
  bottom: 200px;
  right: 117.5px;
  
  width: 250px;
  height: 261px;
  border-radius: 50%;
  
  border-right: 8px solid #2167AC;
  border-left: 8px solid #2167AC;
  border-bottom: 8px solid #2167AC;
  border-top: ${props => props.loaderStrip || null};
  color: #E4F5B2;
  font-size: 50px;
  
  animation: ${props => props.animation || null} 1.5s infinite;
`;

const LoaderText = styled.div`
  animation: ${props => props.animation || null} 1.5s infinite;
`;

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

class StartPage extends React.Component {
  constructor() {
    super();
    this.state = {
      users: null,
      isGodMode: false,
      inQueue: false,
      godColor: "transparent",
      simpleColor: "#3E5774",
      startButtonColor: "transparent",
      animationButton: "normal",
      animationText: "normal",
      loaderStrip: "8px solid #2167AC"
    };
  }

  logout() {
    localStorage.removeItem("token");
    this.props.history.push("/login");
  }

  componentDidMount() {
    fetch(`${getDomain()}/users`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    })
      .then(response => response.json())
      .then(async users => {
        this.setState({users});
      })
      .catch(err => {
        console.log(err);
        alert("Something went wrong fetching the users: " + err);
      });

    // three.js
    init();
    animate();
  }

  render() {
    return (
      <Container>
        <ModesContainer>
          <h1>MODE</h1>
          <ModeButton leftBottom={'40px'} leftTop={'40px'} float={"right"} borderRigth={"2.5px"}
                      style={{ backgroundColor: this.state.godColor }} disabled={this.state.inQueue}
                      onMouseOver={() => {
                        this.setState({godColor: "#3E5774"});
                      }}
                      onMouseOut={() => {
                        if (!this.state.isGodMode) this.setState({godColor: "transparent"});
                      }}
                      onClick={() => {
                      this.setState({isGodMode : true, godColor : "#3E5774", simpleColor : "transparent"});
                      }}
          >
            {"GOD"}
          </ModeButton>
          <ModeButton rightBottom={'40px'} rightTop={'40px'} float={"left"} borderLeft={"2.5px"}
                      style={{ backgroundColor: this.state.simpleColor}} disabled={this.state.inQueue}
                      onMouseOver={() => {
                        this.setState({simpleColor: "#3E5774"});
                      }}
                      onMouseOut={() => {
                        if (this.state.isGodMode) this.setState({simpleColor: "transparent"});
                      }}
                      onClick={() => {
                      this.setState({isGodMode : false, simpleColor : "#3E5774", godColor : "transparent"});
                      }}
          >
            {"SIMPLE"}
          </ModeButton>
        </ModesContainer>
        <StartButton style={{ backgroundColor: this.state.startButtonColor}} disabled={this.state.inQueue}
                     animation={this.state.animationButton} loaderStrip={this.state.loaderStrip}
                     onMouseOver={() => {
                       this.setState({startButtonColor: "#3E5774"});
                     }}
                     onMouseOut={() => {
                       if (!this.state.inQueue) this.setState({ startButtonColor: "transparent"});
                     }}
                     onClick={() => {
                       this.setState({inQueue : true, startButtonColor : "#3E5774", animationButton : Spin, animationText: NoSpin, loaderStrip: "8px solid white"});
                     }}
        >
          <LoaderText animation={this.state.animationText}>
          {"START"}
          </LoaderText>
        </StartButton>
          <div id="container"/>
        {!this.state.users ? (
          <Spinner/>
        ) : (
          <UsersContainer>
            <Users>
              {this.state.users.map(user => {
                if (user.status === "ONLINE") {
                  return (
                    <PlayerContainer>
                      <Player user={user}/>
                    </PlayerContainer>
                  );
                }
              })}
            </Users>
          </UsersContainer>
        )}
      </Container>
    );
  }
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render( scene, camera );
}

function  init() {

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

export default withRouter(StartPage);
