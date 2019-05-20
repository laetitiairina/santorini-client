import React from "react";
import styled from "styled-components";
import {BaseContainer} from "../../helpers/layout";
import {Button} from "../../views/design/Button";
import {withRouter} from "react-router-dom";
import {getDomain} from "../../helpers/getDomain";
import InstructionsPopUp from "./InstructionsPopUp";
import ExitPopUp from "./ExitPopUp";
import EndPopUp from "./EndPopUp";
import Game from "./Game";
import statusEnum from "../../helpers/statusEnum";
import HUD from "./HUD";

const GameContainer = styled.div`
  overflow:hidden;
`;

const PopupContainer = styled.div`

`;

class GamePage extends React.Component {
  constructor(props) {
    super(props);

    // References to Game component
    
    // Bind inputHandler so it can get called from Game component
    this.inputHandler = this.inputHandler.bind(this);
    this.initFinish = this.initFinish.bind(this);
    
    // Create reference to outputHandler so GamePage can call functions in Game component
    this.outputHandler = React.createRef();
    
    this.poller = null;

    this.state = {
      status: null,
      prevStatus: null,
      amountOfPolls: 0,
      gameEnd: false,
      endState: null,
      displayMsg: null,
      invalidMoveMsg: null,
      chooseExit: false,
      instructions: false,
      finishInitGame: false,
      areCameraControlsEnabled: false,
      skipButtonCardNr: null, // Demeter & Hephaestus & Hermes
      game: null // game object, ex. {"status":"MOVE", "board": ...}
    };
  }

  componentDidMount() {
    // Get game status
    const url = `${getDomain()}/games/${localStorage.getItem('game_id')}`;
    const fields = ['status'];
    this.startPolling(url, fields).then(
        async result => {
          await this.setState({status: result});
        },
        rejected => alert(rejected)
    );
  }
  
  startPolling(url, fields) {
    return new Promise((resolve, reject) => {
      this.poller = setInterval(() => this.poll(url, fields, resolve, reject), 1000)
    });
  }

  poll(url, fields, resolve, reject) {
    fetch(`${url}?fields=${fields.join('&')}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Token": localStorage.getItem('playerToken')
      },
    })
    .then(response => response.json())
    .then(response => {
      this.setState({amountOfPolls: this.state.amountOfPolls + 1});
      if (response[fields[0]] !== this.state.status) {
        
        this.setState({prevStatus : this.state.status});
        
        // Why does the status get set 2 times?
        this.setState({status : response[fields[0]]});
        resolve(response[fields[0]]);
        
        // Status changed, now:
        // 1. Get new game object from server
        // 2. Performe update action according to game status (switch)
        this.fetchGame();
      }
    })
    .catch(err => {
      console.log(err);
    });
  }
  
  componentWillMount() {
    document.body.style.overflow = "hidden";
  }

  componentWillUnmount() {
    document.body.style.overflow = "visible";
     if (this.poller) {
      clearInterval(this.poller);
    }
  }
  
  // Fetch player
  // Try to avoid using this function, use fetchGame() instead and access player through game entity
  fetchPlayer() {
    const url = `${getDomain()}/players/${this.player.id}`;

    fetch(`${url}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Token": localStorage.getItem('playerToken')
      }
    })
    .then(response => {
      if (!response.ok) {
        // If response not ok get response text and throw error
        return response.text().then( err => { throw Error(err); } );
      } else {
        // Get returned player
        return response.json();
      }
    })
    .then(response => {
      // Do stuff with player here
    })
    .catch(err => {
      console.log(err);
    });
  }
  
  // Fetch game
  // Use this function to update this.state.game every time the game status changes,
  // afterwards this.update gets called automatically
  fetchGame() {
    const url = `${getDomain()}/games/${localStorage.getItem('game_id')}`;

    fetch(`${url}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Token": localStorage.getItem('playerToken')
      }
    })
    .then(response => {
      if (!response.ok) {
        // If response not ok get response text and throw error
        return response.text().then( err => { throw Error(err); } );
      } else {
        // Get returned game
        return response.json();
      }
    })
    .then(response => {
      this.setState({ game: response });
      this.update();
    })
    .catch(err => {
      console.log(err);
    });
  }
  
  // Get player
  getPlayer = () => {
    let foundPlayer = null;
    if (this.state.game) {
      this.state.game.players.forEach((player) => {
        if (player.id == localStorage.getItem('player_id')) {
          foundPlayer = player;
        }
      });
    }
    return foundPlayer;
  }
  
  // Get opponent player
  getOpponentPlayer = () => {
    let foundPlayer = null;
    if (this.state.game) {
      this.state.game.players.forEach((player) => {
        if (player.id != localStorage.getItem('player_id')) {
          foundPlayer = player;
        }
      });
    }
    return foundPlayer;
  }

  // Performe action based on status
  update() {
    if (this.state.gameEnd) {
      return;
    }
    
    this.setState({displayMsg:null});
    
    // Demeter & Hephaestus & Hermes
    this.setState({skipButtonCardNr:null});
    
    // TODO: Maybe delete this
    let diffBetweenStatus = 1;
    if (this.state.prevStatus != null) {
      diffBetweenStatus = statusEnum[this.state.game.status] - statusEnum[this.state.prevStatus];
    }
    
    // Make sure everything is initialized (this allows for reload of page)
    if(((this.state.game.isGodMode && statusEnum[this.state.game.status] > 1) || (!this.state.game.isGodMode && statusEnum[this.state.game.status] > 4)) && (this.state.prevStatus == null || diffBetweenStatus > 1)) {
      
      // Init cards
      if(this.state.game.isGodMode && statusEnum[this.state.game.status] > 2) {
        // Display cards on board when they have been chosen
        this.outputHandler.current.initCards();
      }
      
      // Init workers
      if(statusEnum[this.state.game.status] > 5) {
        this.outputHandler.current.initWorkers();
      }
      if(statusEnum[this.state.game.status] > 7) {
        this.outputHandler.current.initWorkers();
      }
    }
    
    // Switch action of game status
    // Always have one action for current player and one for not current player
    // Template:
    /*
      if (this.getPlayer().isCurrentPlayer) {
        // Do this if current player
      } else {
        // Do this if not current player
        // this.outputHandler.current.setControls(<lookAround>,<select>);
      }
    */
    switch(this.state.game.status) {
      case "CARDS1":
        console.log("CARDS1");
        
        if (this.getPlayer().isCurrentPlayer) {
          // Display 10 cards to choose from
          this.outputHandler.current.Cards10(); // Controls get set inside here
          this.setState({displayMsg:"Choose 2 cards!"});
        } else {
          // Display waiting msg
          this.outputHandler.current.setControls(false,false); // lookAround=false,select=false
          this.setState({displayMsg:"Other player is choosing cards..."});
        }
        
        break;
      case "CARDS2":
        console.log("CARDS2");
        
        if (this.getPlayer().isCurrentPlayer) {
          // Display 2 cards to choose from
          this.outputHandler.current.Cards2(); // Controls get set inside here
          this.setState({displayMsg:"Choose your card!"});
        } else {
          // Display waiting msg
          this.outputHandler.current.setControls(false,false); // lookAround=false,select=false
          this.setState({displayMsg:"Other player is choosing a card..."});
        }
        
        break;
      case "STARTPLAYER":
        console.log("STARTPLAYER");
        
        if(this.state.game.isGodMode) {
          // Display cards on board after they have been chosen
          this.outputHandler.current.initCards();
        }
        
        if (this.getPlayer().isCurrentPlayer) {
          // Display both player usernames
          this.outputHandler.current.StartPlayer(); // Controls get set inside here
          this.setState({displayMsg:"Choose a start player!"});
        } else {
          // Display waiting msg
          this.outputHandler.current.setControls(false,false); // lookAround=false,select=false
          this.setState({displayMsg:"Other player is choosing start player..."});
        }
        
        break;
      case "COLOR1":
      case "COLOR2":
        console.log("COLOR 1 & 2");

        if (this.getPlayer().isCurrentPlayer) {
          // Display msg
          this.outputHandler.current.Color(); // Controls get set inside here
          this.setState({displayMsg:"Choose a color!"});
        } else {
          // Display waiting msg
          if (this.state.game.status == "COLOR1") {
            this.outputHandler.current.setControls(false,false); // lookAround=false,select=false
          } else {
            this.outputHandler.current.setControls(true,true); // lookAround=true,select=true
          }
          this.setState({displayMsg:"Other player is choosing color..."});
        }
        
        break;
      case "POSITION1":
      case "POSITION2":
        console.log("POSITION 1 & 2");
        
        // Initialize workers of players who have chosen a color
        this.outputHandler.current.initWorkers();
        
        if (this.getPlayer().isCurrentPlayer) {
          // Init position
          this.outputHandler.current.Position(); // Controls get set inside here
          this.setState({displayMsg:"Position your workers! (Drag & Drop)"});
        } else {
          // Display waiting msg
          if (this.state.game.status == "POSITION1") {
            this.outputHandler.current.setControls(false,false); // lookAround=false,select=false
          } else {
            this.outputHandler.current.setControls(true,true); // lookAround=true,select=true
          }
          this.setState({displayMsg:"Other player is positioning workers..."});
        }
        
        break;
      case "MOVE":
        console.log("MOVE");
        
        if (this.getPlayer().isCurrentPlayer) {
          // Set controls so workers can be moved
          this.outputHandler.current.setControls(true,true,true); // lookAround=true,select=true,move=true
          this.setState({displayMsg:"Move a worker! (Drag & Drop)"});
          
          // Athena - if opponent has card
          if (this.outputHandler.current.frontendGodCardsCheck(3,false)) {
            if (this.state.game.message) {
              this.setState({displayMsg:"Move a worker! " + this.state.game.message});
            }
          }
          
          // Hermes
          if (this.outputHandler.current.frontendGodCardsCheck(7,true)) {
            this.setState({skipButtonCardNr:7});
          }
          
        } else {
          // Display waiting msg
          this.outputHandler.current.setControls(true,true); // lookAround=true,select=true
          this.setState({displayMsg:"Other player is moving..."});
        }
        
        break;
      case "BUILD":
        console.log("BUILD");
        
        if (this.getPlayer().isCurrentPlayer) {
          // Set controls so player can build
          this.outputHandler.current.setControls(true,true,false,true); // lookAround=true,select=true,move=false,build=true
          this.setState({displayMsg:"Build! (Drag & Drop)"});
        } else {
          // Display waiting msg
          this.outputHandler.current.setControls(true,true); // lookAround=true,select=true
          this.setState({displayMsg:"Other player is building..."});
        }
        
        break;
      case "END":
        console.log("END");
        
        this.setState({gameEnd : true});
        
        if (this.getPlayer().isCurrentPlayer) {
          // Display winning msg
          this.outputHandler.current.setControls(true,true); // lookAround=true,select=true,move=false,build=true
          this.setState({displayMsg:"You Won! Congratulations!"});
          if (this.state.game.message) {
            this.setState({displayMsg:"You Won! Congratulations! " + this.state.game.message});
          }
          this.setState({endState : "WON"});
        } else if (this.getOpponentPlayer().isCurrentPlayer) {
          // Display losing msg
          this.outputHandler.current.setControls(true,true); // lookAround=true,select=true
          this.setState({displayMsg:"You Lost!"});
          this.setState({endState : "LOST"});
        } else {
          // Game was aborted
          this.outputHandler.current.setControls(false,false); // lookAround=false,select=false
          this.setState({displayMsg:"Game was aborted!"});
          this.setState({endState : "ABORT"});
        }
        
        // Game was finished
        this.deinitGame();
        
        break;
    }
    
    // Always update game board accoriding to this.state.game
    this.outputHandler.current.update();
  }
  
  //
  
  deinitGame() {
    // Stop polling
    if(this.poller) {
      clearInterval(this.poller);
    }

    // Delete game_id, player_id and playerToken from localStorage
    localStorage.removeItem('game_id');
    localStorage.removeItem('player_id');
    localStorage.removeItem('playerToken');
  }

  // Pop-Up helper functions

  showInstructions = (bool) => {
    this.setState({instructions:bool});
  }

  displayExit = (bool) => {
    this.setState({chooseExit:bool});
  }
  
  // Pop-Up functions
  
  // God cards skip button
  skipGodCard = () => {
    if (!this.state.skipButtonCardNr) {
      return;
    }
    switch (this.state.skipButtonCardNr) {
      case 5:
      case 6:
        this.outputHandler.current.DemeterHephaestusSkip();
        break;
      case 7:
        this.outputHandler.current.HermesSkip();
        break;
    }
  }
  
  // Tell Game to set camera position
  setCameraPos = (pos) => {
    this.outputHandler.current.setCameraPos(pos);
  }
  
  // Change graphics setting
  setGraphics = (level) => {
    this.outputHandler.current.setGraphics(level);
    localStorage.setItem('graphicsLevel',level);
  }
  
  // Change time
  setTime = (isNight) => {
    this.outputHandler.current.setTime(isNight);
  }
  
  // M3: Fast-forward
  // TODO: Delete after M3
  // Fast-forward current game
  fastforwardGame = () => {
    if(!this.getPlayer().isCurrentPlayer) {
      alert("You are not the current Player! Wait for your turn!");
      return;
    }
    
    if (!window.confirm("FAST-FORWARD\n\nThe current game state will be discarded!\nYour opponent might not like that!\nAre you sure you want to fast-forward the game?\n")) {
      return;
    }
  
    const url = `${getDomain()}/games/${localStorage.getItem('game_id')}/fastforward`;
    
    fetch(`${url}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Token": localStorage.getItem('playerToken')
      },
      body: JSON.stringify(this.state.game)
    })
    .then(response => {
      if (!response.ok) {
        // If response not ok get response text and throw error
        return response.text().then( err => { throw Error(err); } );
      } else {
        this.outputHandler.current._cleanUpSelection();
      }
    })
    .catch(err => {
      console.log(err);
      alert("Something went wrong: " + err);
    });
  }
  
  // Game functions (these function gets called from Game component)
  
  initFinish = () => {
    this.setState({finishInitGame: true});
  }
  
  cameraControlsEnabled = (bool) => {
    this.setState({areCameraControlsEnabled: bool});
  }
  
  skipButtonSet = (cardNr) => {
    this.setState({skipButtonCardNr:cardNr});
  }

  // Input handler from player (this function gets called from Game component (ex.: Player moves a worker on the board))
  inputHandler = (level, content) => {
  
    // Build skeleton
    let gameUpdate = {
      id: localStorage.getItem("game_id")
    };
    
    let playerUpdate = this.getPlayer();
    
    let boardUpdate = this.state.game.board;
    
    switch(level) {
      case "game":
        // Game
        Object.keys(content).forEach((key) => {
          gameUpdate[key] = content[key];
        })
        this.updateGame(gameUpdate);
        break;
      case "opponent":
        // Opponent
        playerUpdate = this.getOpponentPlayer();
      case "player":
        // Player
        Object.keys(content).forEach((key) => {
          playerUpdate[key] = content[key];
        })
        gameUpdate["players"] = [playerUpdate];
        this.updateGame(gameUpdate);
        break;
      case "board":
        // Board
        boardUpdate["fields"] = content;
        gameUpdate["board"] = boardUpdate;
        this.updateGame(gameUpdate);
        break;
      default:
        break;
    }
  }
  
  // Updates game using a PUT request
  // Use this function for ALL updates of the game
  updateGame = (bodyObject) => {
    const url = `${getDomain()}/games/${localStorage.getItem('game_id')}`;
    
    fetch(`${url}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Token": localStorage.getItem('playerToken')
      },
      body: JSON.stringify(bodyObject)
    })
    .then(response => {
      if (!response.ok) {
        // Handle invalid request
        // Display message
        this.setState({invalidMoveMsg:"Bad Move!"});
        setTimeout(() => this.setState({invalidMoveMsg:null}), 2000);
        
        this.fetchGame();
        
        // If response not ok get response text and throw error
        //return response.text().then( err => { throw Error(err); } );
      }
    })
    .catch(err => {
      console.log(err);
    });
  }

  render() {
    return (
      <GameContainer>
        <PopupContainer>
          <InstructionsPopUp appears={this.state.instructions} showInstructions={this.showInstructions}/>
          <ExitPopUp appears={this.state.chooseExit} displayExit={this.displayExit} props={this.props}/>
          <EndPopUp appears={this.state.gameEnd} endState={this.state.endState} props={this.props}/>
        </PopupContainer>
        {this.state.finishInitGame ? (
          <HUD displayMsg={this.state.displayMsg} invalidMoveMsg={this.state.invalidMoveMsg} chooseExit={this.state.chooseExit} displayExit={this.displayExit} setCameraPos={this.setCameraPos} setGraphics={this.setGraphics} setTime={this.setTime} areCameraControlsEnabled={this.state.areCameraControlsEnabled} gameEnd={this.state.gameEnd} skipButtonCardNr={this.state.skipButtonCardNr} skipGodCard={this.skipGodCard.bind(this)} instructions={this.state.instructions} showInstructions={this.showInstructions} fastforwardGame={this.fastforwardGame.bind(this)}/>
        ) : (<div></div>)}
        <Game game={this.state.game} preload={this.props.preload} initFinish={this.initFinish} cameraControlsEnabled={this.cameraControlsEnabled} inputHandler={this.inputHandler} skipButtonSet={this.skipButtonSet} ref={this.outputHandler}/>
      </GameContainer>
    );
  }
}

export default withRouter(GamePage);
