import React from "react";
import styled, {keyframes} from "styled-components";
import {BaseContainer} from "../../helpers/layout";
import {getDomain} from "../../helpers/getDomain";
import {withRouter, Link} from "react-router-dom";
import {Button} from "../../views/design/Button"
import {Button2} from "../../views/design/Button2"
import {Slot} from "../../views/design/Slot"
import {Spinner} from "../../views/design/Spinner"
import Login from "../login/Login";
import Users from "../login/Users";
import GamePreloader from "./GamePreloader";

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
  overflow: hidden;
  height: 500px;

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

const RejoinContainer = styled.div`
  overflow: hidden;
  position: absolute;
  top: 575px;
  right: 0px;
  width: 40%;
  height: 100px;
`;

const Appear = keyframes`
    0% { transform: translateX(300px); }
    100% { transform: translateX(0px); }
`;

const Disappear = keyframes`
    0% { transform: translateX(0px); }
    100% { transform: translateX(300px); }
`;

const RejoinButton = styled(Button2)`
  &:hover {
    background-color:"#3E5774";
  }
  &:active {
    background-color:"#3E5774";
    opacity: 0.6;
  }
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border-width: 4px;
  background-color:"transparent";
  position: absolute;
  right:20%;

  text-transform: uppercase;
  font-size: 14px;

  visibility: ${props => props.activeGame ? "visible" : "hidden"};

  animation: ${props => props.activeGameAnimation || null} 1.5s forwards;
`;

const CreditsContainer = styled.div`
  width: 100%;
`;

const CreditsLink = styled(Link)`
  margin: 20px;
  color:white;

  &:hover {
    color:green;
  }
  &:active {
    color:white;
  }
`;

// TODO: Delete after M3
const TestWarningContainer = styled.div`
  position:absolute;
  right:10px;
  top:10px;
`;
const TestWarningLabel= styled.div`
  margin-top: 20px;
  color: #fffff;
  background-color: #3E5774;
  animation: warning 15s;
  font-size:12px;
  width:150px;
  padding: 10px;
  border-radius: 5px;
  font-family: "Arial",sans-serif;
  transform: translateY(-500px);

  @keyframes warning {
    0% {transform: translateY(-500px);}
    10% {transform: translateY(0px);}
    90% {transform: translateY(0px);}
    100% {transform: translateY(-500px);}
  }
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
      loaderStrip: "#2167AC",
      activeGame: false,
      activeGameAnimation: null,
      isRejoining: false
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
    
    // Check if user has active game
    if (localStorage.getItem('game_id') && localStorage.getItem('player_id') && localStorage.getItem('playerToken')) {
      const url = `${getDomain()}/games/${localStorage.getItem('game_id')}`;
      const fields = ['status'];
    
      fetch(`${url}?fields=${fields.join('&')}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Token": localStorage.getItem('playerToken')
        },
      })
      .then(response => {
        if (!response.ok) {
          // If response not ok get response text and throw error
          return response.text().then( err => { throw Error(err); } );
        } else {
          // Get returned status
          return response.json();
        }
      })
      .then(response => {
        if (response[fields[0]] && response[fields[0]] !== "END") {
          // Display option to rejoin active game
          this.setState({activeGame:true, activeGameAnimation:Appear});
        }
      })
      .catch(err => {
        console.log(err);
      });
    }
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
      // Stop polling
      clearInterval(this.poller);
      
      // Save game id to local storage
      localStorage.setItem('game_id', result);
      
      // Update state
      this.setState({
        foundGame: true,
        startButtonText : "GAME FOUND",
        animationButton: "normal",
        animationText: "normal",
        loaderStrip: "#2167AC"
      });
      
      this.startGame();
      
      },
      rejected => {
        // Reset search
        this.resetSearch();
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
      this.poller = setInterval(() => this.poll(url, fields, 60, resolve, reject), 100)
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
  
  resetSearch = () => {
    clearInterval(this.poller);
    this.setState(
        {
          inQueue: false,
          animationButton: "normal",
          animationText: "normal",
          startButtonText: "START",
          startButtonTextSize: "50px",
          loaderStrip: "#2167AC"
        }
    );
  }
  
  abortSearch() {
    this.resetSearch()
    
    const url = `${getDomain()}/players/${localStorage.getItem('player_id')}`;
    const id = localStorage.getItem('player_id');
    const token = localStorage.getItem('playerToken');
    
    fetch(`${url}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Token": token
      },
      body: JSON.stringify({
        id: id,
        game_id: -1
      })
    })
    .then(response => {
      if (!response.ok) {
        // If response not ok get response text and throw error
        return response.text().then( err => { throw Error(err); } );
      }
    })
    .catch(err => {
      console.log(err);
    });
    
    localStorage.removeItem('player_id');
    localStorage.removeItem('playerToken');
  }

  componentWillUnmount() {
    clearInterval(this.poller);
  }
  
  startGame = (delay=1000) => {
    // Start game
    if (this.props.preload) {
      // Redirect to game page
      setTimeout(() => this.props.history.push("/game"), delay);
    } else {
      // Preload textures and models then redirect to game page
      let gamePreloader = new GamePreloader();
      gamePreloader.preload().then((content) => {
        this.props.updatePreload(content);
        setTimeout(() => this.props.history.push("/game"), delay/2);
      });
    }
  }

  render() {
    return (
        <Container>
          <TestWarningContainer>
            <TestWarningLabel>
              <h2>M3</h2><p>For Testing:</p><p>It is recommended to use 2 different devices!</p>
            </TestWarningLabel>
          </TestWarningContainer>
          <ContainerLeft>
            {!this.state.loggedIn ? (
              <Login login={this.login.bind(this)} />
            ) : (
              <Users />
            )}
            <CreditsContainer>
              <CreditsLink to="/credits">Credits</CreditsLink>
            </CreditsContainer>
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
                           this.setState({inQueue : true, activeGameAnimation: Disappear, startButtonColor : "#3E5774", startButtonText : "SEARCHING", startButtonTextSize:"30px", animationButton : Spin, animationText: NoSpin, loaderStrip: "white"});
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
                      this.abortSearch();
                    }}
                  >Abort</AbortButton>
                ) : (<div></div>)}
                <LoaderSlots>
                  <Slot size="15px" enabled={this.state.inQueue}></Slot>
                  <Slot size="15px" enabled={this.state.foundGame}></Slot>
                </LoaderSlots>
              </LoaderContent>
            </StartButton>
            <RejoinContainer>
              {this.state.activeGame ? (
                <RejoinButton activeGame={this.state.activeGame} activeGameAnimation={this.state.activeGameAnimation}
                  onClick={() => {
                    this.setState({isRejoining:true});
                    this.startGame(0);
                  }}
                >
                  {this.state.isRejoining ? (<div style={{textAlign:"center",justifyContent:"center",display:"flex",position:"absolute",margin:"auto",width:"100px",height:"100px",left:"-15px",top:"3px"}}><Spinner /></div>) : (<div>Rejoin Game</div>)}
                </RejoinButton>
              ) : (<div></div>)}
            </RejoinContainer>
            <div id="container"/>
          </ContainerRight>
        </Container>
    );
  }
}

export default withRouter(StartPage);
