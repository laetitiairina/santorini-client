import React from "react";
import styled, {css, keyframes} from "styled-components";
import {BaseContainer} from "../../helpers/layout";
import {getDomain} from "../../helpers/getDomain";
import Player from "../../views/Player";
import {Spinner} from "../../views/design/Spinner";
import {Button} from "../../views/design/Button";
import {withRouter} from "react-router-dom";
import Switch from "react-router-dom/es/Switch";


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

const PrototypeContainer = styled(BaseContainer)`
  position: absolute;
  width: 300px;
  height: 500px;
  overflow: hidden;
  color: #3E5774;
`;


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
        <PrototypeContainer>
          {"BEBE"}
        </PrototypeContainer>
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
