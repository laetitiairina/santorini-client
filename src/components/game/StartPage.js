import React from "react";
import styled, {keyframes} from "styled-components";
import {BaseContainer} from "../../helpers/layout";
import {getDomain} from "../../helpers/getDomain";
import Player from "../../views/Player";
import {withRouter} from "react-router-dom";
import {Button} from "../../views/design/Button"
import {init, animate} from '../../components/game/Prototype'
import GamePlayer from "../shared/models/Player";
import Login from "../login/Login";
import Users from "../login/Users";

const Container = styled(BaseContainer)`
  color: white;
  text-align: center;
  justify-content: left;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-gap: 10px;

  @media only screen and (max-width: 700px){
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 1fr;
  }
`;

const ContainerLeft = styled.div`
  grid-column: 1;
  grid-row: 1;

  @media only screen and (max-width: 700px){
    grid-column: 1;
    grid-row: 2;
  }
`;

const ContainerRight = styled.div`
  grid-column: 2;
  grid-row: 1;

  @media only screen and (max-width: 700px){
    grid-column: 1;
    grid-row: 1;
  }
`;

const ModesContainer = styled(BaseContainer)`
  width: 300px;
  height: 200px;
  overflow: hidden;
  color: #3E5774;
`;

const ModeButton = styled(Button)`
  box-sizing: border-box;
  width: 150px;
  padding: 20px;
 
  border-bottom-right-radius: ${props => props.rightBottom || null};
  border-bottom-left-radius: ${props => props.leftBottom || null};
  border-top-right-radius: ${props => props.rightTop || null};
  border-top-left-radius: ${props => props.leftTop || null};
  
  border-width: 5px;
  border-right-width:${props => props.borderRight || null};
  border-left-width:${props => props.borderLeft || null};
  
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

const StartButton = styled(Button)`
  width: 250px;
  height: 250px;
  border-radius: 50%;
  border-width: 8px;
  border-top-color: ${props => props.loaderStrip || null};
  
  font-size: 50px;
  
  animation: ${props => props.animation || null} 1.5s infinite;
`;

const LoaderText = styled.div`
  animation: ${props => props.animation || null} 1.5s infinite;
`;

class StartPage extends React.Component {
  constructor(props) {
    super(props);
    this.addPlayerToQueue = this.addPlayerToQueue.bind(this);
    this.startPolling = this.startPolling.bind(this);
    this.poll = this.poll.bind(this);
    this.poller = null;
    this.state = {
      player: null,
      loggedIn: false,
      token: null,
      isGodMode: false,
      inQueue: false,
      amountOfPolls: 0,
      godColor: "transparent",
      simpleColor: "#3E5774",
      startButtonColor: "transparent",
      animationButton: "normal",
      animationText: "normal",
      loaderStrip: "#2167AC"
    };
  }
  
  login() {
    this.setState({loggedIn: true});
  }

  logout() {
    localStorage.removeItem("userToken");
    localStorage.removeItem("playerToken");
    this.setState({loggedIn: false});
    this.props.history.push("/home");
  }

  componentDidMount() {
    if (localStorage.getItem("userToken")) {
      this.login();
    }
    // three.js prototype
    //init();
    //animate();
  }

  addPlayer () {
    fetch(`${getDomain()}/players`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        token: this.state.token,
        isGodMode: this.state.isGodMode
      })
    })
    .then(response => response.json())
    .then( returnedPlayer => {
      this.setState({player: returnedPlayer});
    })
    .catch(err => {
      console.log(err);
      alert("Something went wrong creating the player: " + err);
    });
  }

  addPlayerToQueue() {
    // For testing
    /*
    const player1 = new GamePlayer();
    player1.isCurrentPlayer = true;
    this.props.history.push({pathname: '/game', state: {player: player1}});
    */
    
    fetch(`${getDomain()}/players`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        isGodMode: this.state.isGodMode
      })
    })
    .then(response => response.json())
    .then(player => {
      this.setState({player: new GamePlayer(player)});
      
      const url = `${getDomain()}/players/${player.id}`;
      const fields = ['game_id'];
      return this.startPolling(url, fields);
    })
    // Handle resolved or rejected Promise form startPolling
    .then(result => {
      clearInterval(this.poller);
      this.setState(
          {
            game_id: result,
            inQueue: false,
            animationButton: "normal",
            animationText: "normal"
          }
      );
      
      // TODO: Change alert to another form of showing that opponent was found
      alert('Opponent found!');
      this.state.player.game_id = result; // TODO: can be deleted once cascading in DB works.
      localStorage.setItem('game_id', result);
      this.props.history.push({pathname: '/game', state: {player: this.state.player}});
      },
      rejected => {
        clearInterval(this.poller);
        this.setState(
            {
              inQueue: false,
              animationButton: "normal",
              animationText: "normal"
            }
        );
        alert(rejected);
      }
    )
    .catch(err => {
      console.log(err);
    });
  }

  startPolling(url, fields){
    return new Promise((resolve, reject) => {
        this.setState({inQueue: true, amountOfPolls: 0});
        this.poller = setInterval(() => this.poll(url, fields, 60, resolve, reject), 1000)
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
      if(response[fields[0]] !== (null && undefined)) {
        resolve(response[fields[0]]);
      }
        else if (this.state.amountOfPolls >= maxPolls) {
          reject("No match found! Timeout")
        }
    })
    .catch(err => {
      console.log(err);
    });
  }

  componentWillUnmount() {
    clearInterval(this.poller);
  }

  render() {
    return (
        <Container>
          <ContainerLeft>
            {!this.state.loggedIn ? (
              <Login login={this.login.bind(this)} />
            ) : (
              <Users />
            )}
          </ContainerLeft>
          <ContainerRight>
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
                           this.setState({inQueue : true, startButtonColor : "#3E5774", animationButton : Spin, animationText: NoSpin, loaderStrip: "white"});
                           this.addPlayerToQueue();
                         }}
            >
              <LoaderText animation={this.state.animationText}>
                {"START"}
              </LoaderText>
            </StartButton>
            <div id="container"/>
          </ContainerRight>
        </Container>
    );
  }
}

export default withRouter(StartPage);
