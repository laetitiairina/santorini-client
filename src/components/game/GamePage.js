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
    
    // Create reference to outputHandler so GamePage can call functions in Game component
    this.outputHander = React.createRef();
    
    
    // ???

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
      game: null, // game object, ex. {"status":"MOVE", "board": ...}
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
  getPlayer() {
    const url = `${getDomain()}/players/${this.player.id}`;

    fetch(`${url}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    })
    .then(response => response.json())
    .then(response => {
      this.player.currentPlayer = response.currentPlayer;
      this.player.isCurrentPlayer = this.player.currentPlayer; // TODO: only necessary because of weird name change
    })
    .catch(err => {
      console.log(err);
    });
  }
  
  // Fetch game
  getGame() {
    const url = `${getDomain()}/games/${this.state.game.id}`;

    fetch(`${url}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    })
    .then(response => response.json())
    .then(response => {
      this.setState({ game: response });
    })
    .catch(err => {
      console.log(err);
    });
  }

  update() {
    // TODO:
    // 1. Get new game object from server
    
    
    // 2. Check if current player
    
    
    // 3. If currentPlayer, switch action
    switch(this.state.status) {
      case "CARDS1":
        console.log("CARDS1");

        break;
      case "CARDS2":
        console.log("CARDS2");

        break;
      case "STARTPLAYER":
        console.log("STARTPLAYER");
        
        // Display cards on board when they have been chosen
        this.outputHander.current.initCards();
        
        break;
      case "COLOR1":
      case "COLOR2":
        console.log("COLOR 1 & 2");
        
        // Can't do this in current implementation with how the player is accessed:
        // Display workers of player 1 next to board when color1 has been chosen but color2 not yet
        this.outputHander.current.initWorkers(1);

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
          this.player.currentPlayer = response.currentPlayer;
          this.player.isCurrentPlayer = this.player.currentPlayer; // TODO: only necessary because of weird name change
        })
        .catch(err => {
          console.log(err);
        });
        break;
      case "POSITION1":
        console.log("POSITION1");
        
        // Display workers of player 2 next to board when color has been chosen
        this.outputHander.current.initWorkers(2);
        // Init game
        this.outputHander.current.initGame();
        
        break;
      case "POSITION2":
        console.log("POSITION2");
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
          // this.setState({isWinner : BOOLEAN});
        break;
    }
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
        this.setState({status : response[fields[0]]});
        resolve(response[fields[0]]);
        this.update();
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
  
  // Input handler from player (this function gets called from Game component (ex.: Player moves a worker on the board)
  inputHandler = () => {
  
  }

  render() {
    return (
      <div>
        <div style={{color:"#000000"}}>STATUS: {this.state.status}</div>
        {!this.state.status ? (
          this.unautherizedAccess ? (
            <ErrorContainer>
              <ErrorLabel>Game not initializated!</ErrorLabel>
              <BackButton onClick={() => {this.props.history.push("/home");}}>Back</BackButton>
            </ErrorContainer>
          ): (
            <Spinner/>
          )
        ) : (
          <GameContainer>
            <PopupContainer>
              <EndPopUp appears={this.gameEnds()} winner={this.state.isWinner} props={this.props}/>
              <ChooseColorPopUp appears={this.chooseColor()} setColor={this.setColor} blockedColor={this.getBlockedColor()}/>
            </PopupContainer>
            <Game game={this.state.game} inputHandler={this.inputHandler} ref={this.outputHander}/>
          </GameContainer>
        )}
      </div>
    );
  }
}

export default withRouter(GamePage);
