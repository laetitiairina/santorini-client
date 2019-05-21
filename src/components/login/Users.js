import React from "react";
import styled from "styled-components";
import { BaseContainer } from "../../helpers/layout";
import { getDomain } from "../../helpers/getDomain";
import User from "../shared/models/User";
import { withRouter } from "react-router-dom";
import { Button } from "../../views/design/Button";
import Player from "../../views/Player";
import {Spinner} from "../../views/design/Spinner";

const Container = styled(BaseContainer)`
  color: white;
  text-align: center;
  justify-content: left;
  margin-bottom: 20px;
  padding: 0px;
  width: 60%;
`;

const UsersContainer = styled(BaseContainer)`
  color: white;
  padding: 0px;
`;

const UsersStyle = styled.ul`
  list-style: none;
  padding: 0px;
  max-height: 40vh;
  overflow: auto;

  ::-webkit-scrollbar {
    width: 5px;
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background: rgba(44,161,194,0.7);
    border-radius: 10px;
  }
`;

const PlayerContainer = styled.li`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const NameContainer = styled(BaseContainer)`
  display: flex;
  justify-content: center;
  margin: 20px;
  color: #3E5774;
`;

const NameInfoLabel = styled.label`
  color: #3E5774;
  font-weight: 1;
  padding-top: 14px;
  margin-bottom: 10px;
`;

const NameLabel = styled.label`
  font-size: 20px;
  padding-top: 10px;
  padding-left: 20px;
  color: #3E5774;
  margin-bottom: 10px;
`;

/**
 * Classes in React allow you to have an internal state within the class and to have the React life-cycle for your component.
 * You should have a class (instead of a functional component) when:
 * - You need an internal state that cannot be achieved via props from other parent components
 * - You fetch data from the server (e.g., in componentDidMount())
 * - You want to access the DOM via Refs
 * https://reactjs.org/docs/react-component.html
 * @Class
 */
class Users extends React.Component {
  /**
   * If you don’t initialize the state and you don’t bind methods, you don’t need to implement a constructor for your React component.
   * The constructor for a React component is called before it is mounted (rendered).
   * In this case the initial state is defined in the constructor. The state is a JS object containing two fields: name and username
   * These fields are then handled in the onChange() methods in the resp. InputFields
   */
  constructor() {
    super();
    this.state = {
      users: null,
      username: null
    };
  }
  
  // Logout user
  logout() {
    fetch(`${getDomain()}/users/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Token": localStorage.getItem('userToken')
      },
      body: JSON.stringify({})
    })
    .then(response => {
      if (!response.ok) {
        // If response not ok get response text and throw error
        return response.text().then( err => { throw Error(err); } );
      } else {
        // Get response
        return response.text();
      }
    })
    .then(response => {
      // Logout user
      this.props.logout();
    })
    .catch(err => {
      console.log(err);
      alert("Something went wrong fetching: " + err);
      
      // logout user even if logout on serverside was unsuccessful
      this.props.logout();
    });
  }

  /**
   * componentDidMount() is invoked immediately after a component is mounted (inserted into the tree).
   * Initialization that requires DOM nodes should go here.
   * If you need to load data from a remote endpoint, this is a good place to instantiate the network request.
   * You may call setState() immediately in componentDidMount().
   * It will trigger an extra rendering, but it will happen before the browser updates the screen.
   */
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
        <NameContainer>
          <NameInfoLabel>Playing as</NameInfoLabel>
          <NameLabel>
            {this.state.users ? (
              <div>
                {this.state.users.map(user => {
                  if (user.id == localStorage.getItem('user_id')){
                    return (user.username);
                  }
                })}
              </div>
            ) :(<div></div>)}
          </NameLabel>
        </NameContainer>
        <h2 style={{color:"#3E5774"}}>Users</h2>
        {!this.state.users ? (
              <Spinner/>
          ) : (
              <UsersContainer>
                <UsersStyle>
                  {this.state.users.map(user => {
                    if (user.status === "ONLINE") {
                      return (
                          <PlayerContainer
                            key={user.id}
                            onClick={() => {
                              this.props.history.push("/profile/"+user.id);
                            }}
                          >
                            <Player user={user}/>
                          </PlayerContainer>
                      );
                    }
                  })}
                </UsersStyle>
                <Button
                  width="50%"
                  onClick={() => {
                    this.logout();
                  }}
                >
                  Logout
                </Button>
              </UsersContainer>
          )}
      </Container>
    );
  }
}

/**
 * You can get access to the history object's properties via the withRouter.
 * withRouter will pass updated match, location, and history props to the wrapped component whenever it renders.
 */
export default withRouter(Users);
