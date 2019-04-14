import React from "react";
import styled, {keyframes} from "styled-components";
import {BaseContainer} from "../../helpers/layout";
import {getDomain} from "../../helpers/getDomain";
import Player from "../../views/Player";
import {Spinner} from "../../views/design/Spinner";
import {withRouter} from "react-router-dom";
import {Button} from "../../views/design/Button"
import {init, animate} from '../../components/game/Prototype'

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
  position: absolute;
  bottom: 200px;
  right: 117.5px;
  
  width: 250px;
  height: 261px;
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
      token: null,
      users: null,
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

    // three.js prototype
    init();
    animate();
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
    .then(async returnedPlayer => {
      const player = new Player(returnedPlayer);
    })
    .catch(err => {
      console.log(err);
      alert("Something went wrong creating the player: " + err);
    });
  }

  addPlayerToQueue() {
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
      console.log(player);
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
      alert('Opponent found!');
      localStorage.setItem('game_id', result);
      this.props.history.push('../gamescreen')
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

export default withRouter(StartPage);
