import React from "react";
import styled from "styled-components";
import {BaseContainer} from "../../helpers/layout";
import {Button} from "../../views/design/Button";
import {withRouter} from "react-router-dom";
import {getDomain} from "../../helpers/getDomain";
import EndPopUp from "./EndPopUp";
import ChooseColorPopUp from "./ChooseColorPopUp";
import {Spinner} from "../../views/design/Spinner";

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

    if (this.props.location.state) {
      this.player = this.props.location.state.player;
      this.unautherizedAccess = false;
    } else {
      // Page /game was accessed without proper initialization of the game -> display error msg
      this.unautherizedAccess = true;
    }

    this.state = {
      status: null,
      amountOfPolls: 0,
      gameEnds: false,
      isWinner: false,
      blockedColor: null,
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

  update() {
    switch(this.state.status) {
      case "CARDS1":
        console.log("CARDS1");

        break;
      case "CARDS2":
        console.log("CARDS2");

        break;
      case "STARTPLAYER":
        console.log("STARTPLAYER");

        break;
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
          this.player.currentPlayer = response.currentPlayer;
          this.player.isCurrentPlayer = this.player.currentPlayer; // TODO: only necessary because of weird name change
        })
        .catch(err => {
          console.log(err);
        });
        break;
      case "POSITION1":
        console.log("POSITION1");
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

  render() {
    return (
        <Container>
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
            <PopupContainer>
              <EndPopUp appears={this.gameEnds()} winner={this.state.isWinner} props={this.props}/>
              <ChooseColorPopUp appears={this.chooseColor()} setColor={this.setColor} blockedColor={this.getBlockedColor()}/>
            </PopupContainer>
          )}
        </Container>
    );
  }
}

export default withRouter(GamePage);
