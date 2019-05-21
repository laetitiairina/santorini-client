import React from "react";
import styled from "styled-components";
import { BaseContainer } from "../../helpers/layout";
import { getDomain } from "../../helpers/getDomain";
import PlayerProfile from "../../views/PlayerProfile";
import { Spinner } from "../../views/design/Spinner";
import { Button } from "../../views/design/Button";
import { withRouter } from "react-router-dom";
import User from "../shared/models/User";

const Container = styled(BaseContainer)`
  color: white;
  text-align: center;
`;

const ProfileContainer = styled.ul`
  list-style: none;
  padding-left: 0;
`;

const PlayerContainer = styled.li`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 20px;
`;

class Profile extends React.Component {
  constructor() {
    super();
    this.state = {
      user: null,
      own: false,
      edit: false,
      changeUsername: null,
      changeBirthDate: null
    };
  }

  // Navigate back to the route /home
  back() {
    this.props.history.push("/home");
  }
  
  // Checks if user is looking at own profile --> show edit button
  checkOwn() {
    if (this.state.user) {
      if (this.state.user.id.toString() === localStorage.getItem('user_id')) {
        this.setState({ own: true });
      }
    }
  }
  
  // When user is viewing own profile, allow editing and send updates to server when saved
  edit() {
    if (!this.state.own) {
      return;
    }
    if (this.state.edit) {
      // Save changes
      const user = new User(this.state.user);
      user.username = this.state.changeUsername;
      user.birthdayDate = this.state.changeBirthDate;
      
      // Put changes on server
      const id = localStorage.getItem('user_id');
      
      fetch(`${getDomain()}/users/${id}/`, {
        method: "PUT",
        headers: new Headers({
          "Content-Type": "application/json",
          "Token": localStorage.getItem('userToken')
        }),
        body: JSON.stringify(user)
      })
        .then(response => {
          if (!response.ok) {
            // If response not ok get response text and throw error
            return response.text().then( err => { throw Error(err); } );
          } else {
            // Get response
            return response;
          }
        })
        .then(response => {
          // Reload page to update user profile
          //this.setState({ edit: false });
          window.location.reload();
        })
        .catch(err => {
          console.log(err);
          alert("Something went wrong fetching: " + err);
        });
    } else {
      // Allow editing
      this.setState({ edit: true });
    }
  }
  
  // Handle changes when user is editing own profile
  handleInputChange(key, value) {
    // Example: if the key is username, this statement is the equivalent to the following one:
    // this.setState({'username': value});
    this.setState({ [key]: value });
  }

  componentDidMount() {
    const id = this.props.match.params.id;
    
    fetch(`${getDomain()}/users/${id}/`, {
      method: "GET",
      headers: new Headers({
        "Token": localStorage.getItem('userToken')
      })
    })
    .then(response => {
      if (!response.ok) {
        // If response not ok get response text and throw error
        return response.text().then( err => { throw Error(err); } );
      } else {
        // Get returned user
        return response.json();
      }
    })
    .then(async user => {
      // Save recieved user to current state
      this.setState({ user });
      
      // Check if user is looking at own profile
      this.checkOwn();
    })
    .catch(err => {
      console.log(err);
      alert("Something went wrong fetching the user: " + err);
    });
  }

  render() {
    return (
      <Container>
        <h2 style={{color:"#3E5774"}}>Profile</h2>
        {!this.state.user ? (
          <Spinner />
        ) : (
          <ProfileContainer>
            <PlayerContainer key={this.state.user.id}>
              <PlayerProfile
                user={this.state.user}
                edit={this.state.edit}
                handleInputChange={this.handleInputChange.bind(this)}
              />
            </PlayerContainer>
          </ProfileContainer>
        )}
        {!this.state.own ? (<div></div>):(
          <ButtonContainer>
            <Button
              width="10%"
              onClick={() => {
                this.edit();
              }}
            >
            {!this.state.edit ? (<div>Edit</div>):(<div>Save</div>)}
            </Button>
          </ButtonContainer>
        )}
        <ButtonContainer>
          <Button
            width="10%"
            onClick={() => {
              this.back();
            }}
          >
            Back
          </Button>
        </ButtonContainer>
      </Container>
    );
  }
}

export default withRouter(Profile);
