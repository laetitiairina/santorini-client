import React from "react";
import styled from "styled-components";
import {BaseContainer} from "../../helpers/layout";
import {getDomain} from "../../helpers/getDomain";
import Player from "../../views/Player";
import {Spinner} from "../../views/design/Spinner";
import {Button} from "../../views/design/Button";
import {withRouter} from "react-router-dom";

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
  max-height: 555px;
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
`;

const ModeContainer = styled.button`
  &:hover {
    color: black;
  }
  background-color: #819CBA;
  box-sizing: border-box;
  width: 100%;
  border: 1px solid #374D21;
  padding: 20px;
 
  border-bottom-right-radius: ${props => props.rightBottom || null};
  border-bottom-left-radius: ${props => props.leftBottom || null};
  border-top-right-radius: ${props => props.rightTop || null};
  border-top-left-radius: ${props => props.leftTop || null};
  
  color: #D6F0E7;
  font-weight: normal;
  font-family: "American Typewriter",serif;
  font-size: x-large;
`;

const Mode = styled.div`
  font-weight: normal;
  font-family: "American Typewriter",serif;
  font-size: x-large;
  color: #D6F0E7;
`;

class StartPage extends React.Component {
  constructor() {
    super();
    this.state = {
      users: null
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
        // delays continuous execution of an async operation for 0.8 seconds.
        // This is just a fake async call, so that the spinner can be displayed
        // feel free to remove it :)
        await new Promise(resolve => setTimeout(resolve, 800));

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
          <ModeContainer rightTop={'40px'} leftTop={'40px'}>
            {"GOD MODE"}
          </ModeContainer>
          <ModeContainer rightBottom={'40px'} leftBottom={'40px'}>
            {"SIMPLE MODE"}
          </ModeContainer>
        </ModesContainer>
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
            {/*<Button*/}
            {/*  width="100%"*/}
            {/*  onClick={() => {*/}
            {/*    this.logout();*/}
            {/*  }}*/}
            {/*>*/}
            {/*  Logout*/}
            {/*</Button>*/}
          </UsersContainer>
        )}
      </Container>
    );
  }
}

export default withRouter(StartPage);
