import React from "react";
import styled, {keyframes} from "styled-components";
import {BaseContainer} from "../../helpers/layout";
import {getDomain} from "../../helpers/getDomain";
import Player from "../../views/Player";
import {withRouter} from "react-router-dom";
import {Button} from "../../views/design/Button"
import {Button2} from "../../views/design/Button2"
import {Slot} from "../../views/design/Slot"
import {Spinner} from "../../views/design/Spinner"
import {init, animate} from '../../components/game/Prototype'
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

const ModeButton = styled(Button2)`
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

const StartButton = styled(Button2)`
  width: 250px;
  height: 250px;
  border-radius: 50%;
  border-width: 8px;
  border-top-color: ${props => props.loaderStrip || null};
  
  font-size: 50px;
  
  animation: ${props => props.animation || null} 1.5s infinite;
`;

const AbortButton = styled(Button)`
  font-size: 15px;
  text-align: center;
  justify-content: center;
  display: flex;
  position: absolute;
  top: 15px;
  left: 0px;
  right: 0px;
  margin: auto;
  width: 50px;
  height: 20px;
`;

const LoaderContent = styled.div`
  animation: ${props => props.animation || null} 1.5s infinite;
  position:relative;
`;

const LoaderText = styled.div`
  text-align: center;
  justify-content: center;
  display: flex;
  position: absolute;
  top: -30px;
  left: 0px;
  right: 0px;
  margin: auto;
  width: 100px;
  height: 100px;
`;

const LoaderSlots = styled.div`
  text-align: center;
  justify-content: center;
  display: flex;
  position: absolute;
  top: 70px;
  left: 0px;
  right: 0px;
  margin: auto;
  width: 100px;
  height: 100px;
`;

const LoaderSpinner = styled.div`
  text-align: center;
  justify-content: center;
  display: flex;
  position: absolute;
  top: -100px;
  left: 0px;
  right: 0px;
  margin: auto;
  width: 100px;
  height: 100px;
`;

class StartPage extends React.Component {
  constructor(props) {
    super(props);
    this.addPlayerToQueue = this.addPlayerToQueue.bind(this);
    this.startPolling = this.startPolling.bind(this);
    this.poll = this.poll.bind(this);
    this.poller = null;
    this.state = {
      loggedIn: false,
      isGodMode: false,
      inQueue: false,
      foundGame: false,
      amountOfPolls: 0,
      godColor: "transparent",
      simpleColor: "#3E5774",
      startButtonText: "START",
      startButtonTextSize: "50px",
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
    localStorage.removeItem('userToken');
    localStorage.removeItem('playerToken');
    this.setState({loggedIn: false});
    this.props.history.push("/home");
  }

  componentDidMount() {
    if (localStorage.getItem('userToken')) {
      this.login();
    }
    // three.js prototype
    //init();
    //animate();
  }

  addPlayerToQueue() {
  
    let bodyContent = {
      isGodMode: this.state.isGodMode
    };
    
    // Send userId and token if user is logged in
    if (localStorage.getItem('user_id') && localStorage.getItem('userToken')) {
      bodyContent = {
        userId: localStorage.getItem('user_id'),
        token: localStorage.getItem('userToken'),
        isGodMode: this.state.isGodMode
      };
    }
    
    fetch(`${getDomain()}/players`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(bodyContent)
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
    .then(player => {
      // Player was created, store id and token
      localStorage.setItem('player_id', player.id);
      localStorage.setItem('playerToken', player.token);
      
      // Start polling to check if game_id is set
      const url = `${getDomain()}/players/${player.id}`;
      const fields = ['game_id'];
      return this.startPolling(url, fields);
    })
    // Handle resolved or rejected Promise form startPolling
    .then(result => {
    
      // Game was found
      
      clearInterval(this.poller);
      
      localStorage.setItem('game_id', result);
      
      this.setState({foundGame: true, startButtonText : "GAME FOUND", animationButton: "normal",
          animationText: "normal"});
      setTimeout(() => this.props.history.push("/game"), 2000);
      
      },
      rejected => {
        clearInterval(this.poller);
        this.setState(
            {
              inQueue: false,
              animationButton: "normal",
              animationText: "normal",
              startButtonText: "START",
              startButtonTextSize: "50px"
            }
        );
        alert("Something went wrong: " + rejected);
      }
    )
    .catch(err => {
      console.log(err);
      alert("Something went wrong: " + err);
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
    fetch(`${url}?fields=${fields.join('&')}`, {
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
                           this.setState({inQueue : true, startButtonColor : "#3E5774", startButtonText : "SEARCHING", startButtonTextSize:"30px", animationButton : Spin, animationText: NoSpin, loaderStrip: "white"});
                           this.addPlayerToQueue();
                         }}
            >
              <LoaderContent animation={this.state.animationText}>
                  <LoaderSpinner>
                    {this.state.foundGame ? (<Spinner />) : (<div></div>)}
                  </LoaderSpinner>
                  <LoaderText style={{fontSize:this.state.startButtonTextSize}}>
                    {this.state.startButtonText}
                  </LoaderText>
                  {(!this.state.foundGame && this.state.inQueue) ? (
                    <AbortButton
                      onClick={() => {
                        // TODO: Abort
                      }}
                    >Abort</AbortButton>
                  ) : (<div></div>)}
                  <LoaderSlots>
                    <Slot size="15px" enabled={this.state.inQueue}></Slot>
                    <Slot size="15px" enabled={this.state.foundGame}></Slot>
                  </LoaderSlots>
              </LoaderContent>
            </StartButton>
            <div id="container"/>
          </ContainerRight>
        </Container>
    );
  }
}

export default withRouter(StartPage);
