import React from "react";
import styled from "styled-components";
import {BaseContainer} from "../../helpers/layout";
import {Button} from "../../views/design/Button";
import {withRouter} from "react-router-dom";
import {getDomain} from "../../helpers/getDomain";
import EndPopUp from "./EndPopUp";
import ChooseColorPopUp from "./ChooseColorPopUp";
import {Spinner} from "../../views/design/Spinner";
import Game from "./Game";

// For testing
//import GamePlayer from "../shared/models/Player"

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

const MessageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #3E5774;
  margin-top: -20px;
  text-transform: uppercase;
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
    
    
    // ??? TODO: Remove player connection in order to be able to reload game if accidentally closed browser

    if (this.props.location.state) {
    
      // Why transfer player via props? We are suppose to send a get request to get the player info anyway? Why pass it?
      // We can even access it via the game object that we request, so no need to make it more complicated
      this.player = this.props.location.state.player;
      this.unautherizedAccess = false;
      
    } else {
      // Page /game was accessed without proper initialization of the game -> display error msg
      this.unautherizedAccess = true;
    }
    
    // For testing
    //this.player = new GamePlayer();
    //this.player.isCurrentPlayer = true;
    //this.unautherizedAccess = false;

    this.state = {
      status: null,
      amountOfPolls: 0,
      gameEnds: false,
      isWinner: false,
      blockedColor: null,
      displayMsg: null,
      finishInitGame: false,
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
    
    // For testing
    //this.update();
  }
  
  // Fetch player
  // Try to avoid using this function, use fetchGame() instead and access player through game entity
  fetchPlayer() {
    const url = `${getDomain()}/players/${this.player.id}`;

    fetch(`${url}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
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
        "Content-Type": "application/json"
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
        if (player.id == localStorage.getItem("player_id")) {
          foundPlayer = player;
        }
      });
    }
    return foundPlayer;
  }

  // Performe action based on status
  update() {
    this.setState({displayMsg:null});
    
    // If page was reloaded, make sure everything is initialized
    if(this.state.game) {
      // TODO: Which card on which side
      if(this.state.game.isGodMode && this.state.game.cards.length > 0) {
        // Display cards on board when they have been chosen
        this.outputHander.current.initCards();
      }
      if(this.state.status == "POSITION2" || this.state.status == "MOVE" || this.state.status == "BUILD" || this.state.status == "END") {
        this.outputHander.current.initWorkers(1);
        if(this.state.status != "POSITION2") {
          this.outputHander.current.initWorkers(2,false);
        }
      }
    }
    
    // !!!!!!!!!!!!ATTENTION: isCurrentPlayer vs currentPlayer !!!!!!!!!!!!!!!!!!!!!
    
    // Switch action of game status
    // Always have one action for current player and one for not current player
    // Template:
    /*
      if (this.getPlayer().isCurrentPlayer) {
        // Do this if current player
      } else {
        // Do this if not current player
        // this.outputHander.current.setControls();
      }
    */
    switch(this.state.status) {
      case "CARDS1":
        console.log("CARDS1");
        if (this.getPlayer().isCurrentPlayer) {
          // Display 10 cards to choose from
          this.outputHander.current.Cards10();
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
          this.outputHander.current.Cards2();
          this.setState({displayMsg:"Choose your card!"});
        } else {
          // Display waiting msg
          this.outputHander.current.setControls(false,false); // lookAround=false,select=false
          this.setState({displayMsg:"Other player is choosing a card..."});
        }
        break;
      case "STARTPLAYER":
        console.log("STARTPLAYER");
        
        break;
        // TODO: recode this
      case "COLOR1":
      case "COLOR2":
        console.log("COLOR 1 & 2");

        const url = `${getDomain()}/players/${this.player.id}`;

        fetch(`${url}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json"
          }
        })
        .then(response => response.json())
        .then(response => {
          // Is there a reason not to save the whole respone in player, except for the naming convention?
          this.player.isCurrentPlayer = response.isCurrentPlayer; // TODO: only necessary because of weird name change
        })
        .catch(err => {
          console.log(err);
        });
        break;
      case "POSITION1":
        console.log("POSITION1");
        
        // Display workers of player 1 next to board when color has been chosen
        this.outputHander.current.initWorkers(1);
        
        if (this.getPlayer().isCurrentPlayer) {
          // Init position (1 = pan left)
          this.outputHander.current.Position(1);
          this.setState({displayMsg:"Position your workers!"});
        } else {
          // Display waiting msg
          this.outputHander.current.setControls(false,false); // lookAround=false,select=false
          this.setState({displayMsg:"Other player is positioning workers..."});
        }
        
        break;
      case "POSITION2":
        console.log("POSITION2");
        
        // Display workers of player 2 next to board when color has been chosen
        this.outputHander.current.initWorkers(2);
        
        if (this.getPlayer().isCurrentPlayer) {
          // Init position (2 = pan right)
          this.outputHander.current.Position(2);
          this.setState({displayMsg:"Position your workers!"});
        } else {
          // Display waiting msg
          this.outputHander.current.setControls();
          this.setState({displayMsg:"Other player is positioning workers..."});
        }
        
        break;
      case "MOVE":
        console.log("MOVE");
        break;
      case "BUILD":
        console.log("BUILD");
        break;
      case "END":
        console.log("END");
        this.setState({gameEnds : true});
        // TODO: backend has to indicate who won
        // Why don't we just set the winner as current player when the status is END and the just check who is current player?
          // this.setState({isWinner : BOOLEAN});
        break;
    }
    
    // if POSITION2,MOVE,BUILD,END update game board accoriding to this.state.game
    //this.outputHander.current.update();
  }

  startPolling(url, fields) {
    return new Promise((resolve, reject) => {
          this.setState({inQueue: true, amountOfPolls: 0});
          this.poller = setInterval(() => this.poll(url, fields, 1000, resolve, reject), 100)
        }
    );
  }

  poll(url, fields, maxPolls, resolve, reject) {
    fetch(`${url}/?fields=${fields.join('&')}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      },
    })
    .then(response => response.json())
    .then(response => {
      this.setState({amountOfPolls: this.state.amountOfPolls + 1});
      if (response[fields[0]] !== this.state.status) {
      
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
    clearInterval(this.poller);
  }

  setColor = (param) => {
    // set new color
    this.player.color = param.color;

    const url = `${getDomain()}/games/${localStorage.getItem('game_id')}`;

    fetch(`${url}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Token": this.player.token
      },
      body: JSON.stringify({
        id: localStorage.getItem("game_id"),
        players: [ this.player ]
      })
    })
    .then(response => {
      if (response.status !== 204) {
        this.player.color = null;
      } else {
        this.setState({blockedColor : param.color})
      }
    })
    .catch(err => {
      console.log(err);
    });
  };

  chooseColor() {
    return (this.player.isCurrentPlayer && (this.state.status === "COLOR1" || this.state.status === "COLOR2"))
  }

  gameEnds() {
    return this.state.gameEnds;
  }

  getBlockedColor() {
    return this.state.blockedColor;
  }
  
  // Game functions (these function gets called from Game component)
  
  initFinish = () => {
    this.setState({finishInitGame: true});
  }
  
  // Input handler from player (this function gets called from Game component (ex.: Player moves a worker on the board)
  inputHandler = (isGame, content) => {
    if (isGame) {
      let gameUpdate = this.state.game;
      Object.keys(content).forEach((key) => {
        gameUpdate[key] = content[key];
      })
      this.updateGame(gameUpdate);
    } else {
      let playerUpdate = this.getPlayer();
      Object.keys(content).forEach((key) => {
        playerUpdate[key] = content[key];
      })
      this.updateGame({
        id: localStorage.getItem("game_id"),
        players: [ playerUpdate ]
      })
    }
  }
  
  // Updates game using a PUT request
  // Use this function for ALL updates of the game
  updateGame = (bodyObject) => {
    const url = `${getDomain()}/games/${localStorage.getItem('game_id')}`;

    fetch(`${url}`, {
      method: "PUT",
      headers: new Headers({
        "Content-Type": "application/json",
        "Token": this.player.token // Send token in headers to authenticate request
      }),
      body: JSON.stringify(bodyObject)
    })
    .then(response => {
      if (!response.ok) {
        // If response not ok get response text and throw error
        return response.text().then( err => { throw Error(err); } );
      }
    })
    .catch(err => {
      console.log(err);
      alert("Something went wrong: " + err);
    });
  }
  
  //

  render() {
    return (
      <div>
        <div style={{color:"#000000"}}>STATUS: {this.state.status}</div>
          {this.unautherizedAccess ? (
            <ErrorContainer>
              <ErrorLabel>Game not initializated!</ErrorLabel>
              <BackButton onClick={() => {this.props.history.push("/home");}}>Back</BackButton>
            </ErrorContainer>
          ) : (
            <GameContainer>
              <PopupContainer>
                <EndPopUp appears={this.gameEnds()} winner={this.state.isWinner} props={this.props}/>
                <ChooseColorPopUp appears={this.chooseColor()} setColor={this.setColor} blockedColor={this.getBlockedColor()}/>
              </PopupContainer>
              {this.state.displayMsg && this.state.finishInitGame ? (
                <MessageContainer>{this.state.displayMsg}</MessageContainer>
                ) : (<div></div>)}
              <Game game={this.state.game} initFinish={this.initFinish} inputHandler={this.inputHandler} ref={this.outputHander}/>
            </GameContainer>
        )}
      </div>
    );
  }
}

export default withRouter(GamePage);
