import React from "react";
import styled from "styled-components";
import {BaseContainer} from "../../helpers/layout";
import {Button} from "../../views/design/Button";
import {withRouter} from "react-router-dom";
import {getDomain} from "../../helpers/getDomain";
import ExitPopUp from "./ExitPopUp";
import ChooseColorPopUp from "./ChooseColorPopUp";
import EndPopUp from "./EndPopUp";
import {Spinner} from "../../views/design/Spinner";
import Game from "./Game";
import statusEnum from "../../helpers/statusEnum";
import HUD from "./HUD";

const Container = styled(BaseContainer)`
  color: white;
  text-align: center;
  justify-content: left;
`;

const ButtonContainer = styled(BaseContainer)`
  position: absolute;
  right: 100px;
  overflow: hidden;
  color: #3E5774;
`;

const PopupContainer = styled.div`

`;

const GameContainer = styled.div`

`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const ErrorLabel = styled.label`
  color: #FF0000;
  margin: 50px;
  text-transform: uppercase;
`;

const BackButton = styled(Button)`

`;

const ExitButton = styled(Button)`

`;

const QuestionMarkButton = styled(Button)`

`;

class GamePage extends React.Component {
  constructor(props) {
    super(props);
    
    // References to Game component
    
    // Bind inputHandler so it can get called from Game component
    this.inputHandler = this.inputHandler.bind(this);
    this.initFinish = this.initFinish.bind(this);
    
    // Create reference to outputHandler so GamePage can call functions in Game component
    this.outputHander = React.createRef();
    
    if (localStorage.getItem('game_id') && localStorage.getItem('player_id') && localStorage.getItem('playerToken')) {
      this.unautherizedAccess = false;
    } else {
      // Page /game was accessed without proper initialization of the game -> display error msg
      this.unautherizedAccess = true;
    }

    this.state = {
      status: null,
      prevStatus: null,
      amountOfPolls: 0,
      gameEnds: false,
      endState: null,
      displayMsg: null,
      chooseExit: false,
      finishInitGame: false,
      areCameraControlsEnabled: false,
      game: null // game object, ex. {"status":"MOVE", "board": ...}
    };
  }

  componentDidMount() {
    // Do not poll game if unautherized access
    if (this.unautherizedAccess) {
      return;
    }
    
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
          this.setState({inQueue: true, amountOfPolls: 0});
          this.poller = setInterval(() => this.poll(url, fields, 1000, resolve, reject), 100)
        }
    );
  }

  poll(url, fields, maxPolls, resolve, reject) {
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
        
      } else if (this.state.amountOfPolls >= maxPolls) {
        reject("Timeout")
      }
    })
    .catch(err => {
      console.log(err);
    });
  }

  componentWillUnmount() {
    /*if (this.poller) {
      clearInterval(this.poller);
    }*/
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
      alert("Something went wrong: " + err);
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
    this.setState({displayMsg:null});
    
    // Make sure everything is initialized (this allows for reload of page)
    if(((this.state.game.isGodMode && statusEnum[this.state.game.status] > 1) || (!this.state.game.isGodMode && statusEnum[this.state.game.status] > 4)) && this.state.prevStatus == null) {
      
      // Init cards
      if(this.state.game.isGodMode && statusEnum[this.state.game.status] > 2) {
        // Display cards on board when they have been chosen
        this.outputHander.current.initCards();
      }
      
      // Init workers
      if(statusEnum[this.state.game.status] > 5) {
        this.outputHander.current.initWorkers();
      }
      if(statusEnum[this.state.game.status] > 7) {
        this.outputHander.current.initWorkers();
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
        // this.outputHander.current.setControls(<lookAround>,<select>);
      }
    */
    switch(this.state.game.status) {
      case "CARDS1":
        console.log("CARDS1");
        
        if (this.getPlayer().isCurrentPlayer) {
          // Display 10 cards to choose from
          this.outputHander.current.Cards10(); // Controls get set inside here
          this.setState({displayMsg:"Choose 2 cards!"});
        } else {
          // Display waiting msg
          this.outputHander.current.setControls(false,false); // lookAround=false,select=false
          this.setState({displayMsg:"Other player is choosing cards..."});
        }
        
        break;
      case "CARDS2":
        console.log("CARDS2");
        
        if (this.getPlayer().isCurrentPlayer) {
          // Display 2 cards to choose from
          this.outputHander.current.Cards2(); // Controls get set inside here
          this.setState({displayMsg:"Choose your card!"});
        } else {
          // Display waiting msg
          this.outputHander.current.setControls(false,false); // lookAround=false,select=false
          this.setState({displayMsg:"Other player is choosing a card..."});
        }
        
        break;
      case "STARTPLAYER":
        console.log("STARTPLAYER");
        
        if(this.state.game.isGodMode) {
          // Display cards on board after they have been chosen
          this.outputHander.current.initCards();
        }
        
        if (this.getPlayer().isCurrentPlayer) {
          // Display both player usernames
          this.outputHander.current.StartPlayer(); // Controls get set inside here
          this.setState({displayMsg:"Choose a start player!"});
        } else {
          // Display waiting msg
          this.outputHander.current.setControls(false,false); // lookAround=false,select=false
          this.setState({displayMsg:"Other player is choosing start player..."});
        }
        
        break;
      case "COLOR1":
      case "COLOR2":
        console.log("COLOR 1 & 2");
        
        if (this.getPlayer().isCurrentPlayer) {
          // Display msg
          this.outputHander.current.Color(); // Controls get set inside here
          this.setState({displayMsg:"Choose a color!"});
        } else {
          // Display waiting msg
          if (this.state.game.status == "COLOR1") {
            this.outputHander.current.setControls(false,false); // lookAround=false,select=false
          } else {
            this.outputHander.current.setControls(true,true); // lookAround=true,select=true
          }
          this.setState({displayMsg:"Other player is choosing color..."});
        }
        
        break;
      case "POSITION1":
      case "POSITION2":
        console.log("POSITION 1 & 2");
        
        // Initialize workers of players who have chosen a color
        this.outputHander.current.initWorkers();
        
        if (this.getPlayer().isCurrentPlayer) {
          // Init position
          this.outputHander.current.Position(); // Controls get set inside here
          this.setState({displayMsg:"Position your workers!"});
        } else {
          // Display waiting msg
          if (this.state.game.status == "POSITION1") {
            this.outputHander.current.setControls(false,false); // lookAround=false,select=false
          } else {
            this.outputHander.current.setControls(true,true); // lookAround=true,select=true
          }
          this.setState({displayMsg:"Other player is positioning workers..."});
        }
        
        break;
      case "MOVE":
        console.log("MOVE");
        
        if (this.getPlayer().isCurrentPlayer) {
          // Set controls so workers can be moved
          this.outputHander.current.setControls(true,true,true); // lookAround=true,select=true,move=true
          this.setState({displayMsg:"Move a worker!"});
        } else {
          // Display waiting msg
          this.outputHander.current.setControls(true,true); // lookAround=true,select=true
          this.setState({displayMsg:"Other player is moving..."});
        }
        
        break;
      case "BUILD":
        console.log("BUILD");
        
        if (this.getPlayer().isCurrentPlayer) {
          // Set controls so player can build
          this.outputHander.current.setControls(true,true,false,true); // lookAround=true,select=true,move=false,build=true
          this.setState({displayMsg:"Build!"});
        } else {
          // Display waiting msg
          this.outputHander.current.setControls(true,true); // lookAround=true,select=true
          this.setState({displayMsg:"Other player is building..."});
        }
        
        break;
      case "END":
        console.log("END");
        
        this.setState({gameEnds : true});
        
        if (this.getPlayer().isCurrentPlayer) {
          // Display winning msg
          this.outputHander.current.setControls(true,true); // lookAround=true,select=true,move=false,build=true
          this.setState({displayMsg:"You Won! Congratulations!"});
          this.setState({endState : "WON"});
        } else if (this.getOpponentPlayer().isCurrentPlayer) {
          // Display losing msg
          this.outputHander.current.setControls(true,true); // lookAround=true,select=true
          this.setState({displayMsg:"You Lost!"});
          this.setState({endState : "LOST"});
        } else {
          // Game was aborted
          this.outputHander.current.setControls(false,false); // lookAround=false,select=false
          this.setState({displayMsg:"Game was aborted!"});
          this.setState({endState : "ABORT"});
        }
        
        // Game was finished
        this.deinitGame();
        
        break;
    }
    
    // Always update game board accoriding to this.state.game
    this.outputHander.current.update();
  }
  
  //
  
  deinitGame() {
    // Stop polling
    /*if(this.poller) {
      clearInterval(this.poller);
    }*/

    // Delete game_id, player_id and playerToken from localStorage
    localStorage.removeItem('game_id');
    localStorage.removeItem('player_id');
    localStorage.removeItem('playerToken');
  }

  // Pop-Up helper functions
  
  displayExit = (bool) => {
    this.setState({chooseExit:bool});
  }
  
  // Game functions (these function gets called from Game component)
  
  initFinish = () => {
    this.setState({finishInitGame: true});
  }
  
  cameraControlsEnabled = (bool) => {
    this.setState({areCameraControlsEnabled: bool});
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
      // TODO: handle bad move/build
      if (!response.ok) {
        // TODO: handle invalid request
        // If response not ok get response text and throw error
        return response.text().then( err => { throw Error(err); } );
      }
    })
    .catch(err => {
      console.log(err);
      alert("Something went wrong: " + err);
    });
  }
  
  // Camera functions
  
  // Tell Game to set camera position
  setCameraPos = (pos) => {
    this.outputHander.current.setCameraPos(pos);
  }
  
  //

  render() {
    return (
      <div>
        {this.unautherizedAccess ? (
          <ErrorContainer>
            <ErrorLabel>Game not initializated!</ErrorLabel>
            <BackButton onClick={() => {this.props.history.push("/home");}}>Back</BackButton>
          </ErrorContainer>
        ) : (
          <GameContainer>
            <PopupContainer>
              <ExitPopUp appears={this.state.chooseExit} displayExit={this.displayExit} deinitGame={this.deinitGame} props={this.props}/>
              <EndPopUp appears={this.state.gameEnds} endState={this.state.endState} props={this.props}/>
            </PopupContainer>
            {this.state.finishInitGame ? (
              <HUD displayMsg={this.state.displayMsg} displayExit={this.displayExit} setCameraPos={this.setCameraPos} areCameraControlsEnabled={this.state.areCameraControlsEnabled}/>
            ) : (<div></div>)}
            <Game game={this.state.game} initFinish={this.initFinish} cameraControlsEnabled={this.cameraControlsEnabled} inputHandler={this.inputHandler} ref={this.outputHander}/>
          </GameContainer>
        )}
      </div>
    );
  }
}

export default withRouter(GamePage);
