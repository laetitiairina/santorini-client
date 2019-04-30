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
`;

const UsersContainer = styled(BaseContainer)`
  color: white;
  position: absolute;
  left: 100px;
`;

const UsersStyle = styled.ul`
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
      users: null
    };
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
        {!this.state.users ? (
              <Spinner/>
          ) : (
              <UsersContainer>
                <UsersStyle>
                  {this.state.users.map(user => {
                    if (user.status === "ONLINE") {
                      return (
                          <PlayerContainer>
                            <Player user={user}/>
                          </PlayerContainer>
                      );
                    }
                  })}
                </UsersStyle>
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
