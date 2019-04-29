import React from "react";
import styled from "styled-components";
import {BaseContainer} from "../../helpers/layout";
import {Button} from "../../views/design/Button";
import {withRouter} from "react-router-dom";
import {getDomain} from "../../helpers/getDomain";
import EndPopUp from "./EndPopUp";
import User from "../shared/models/User";
import ChooseColorPopUp from "./ChooseColorPopUp";


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


const ExitButton = styled(Button)`

`;

const QuestionMarkButton = styled(Button)`

`;

class GamePage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      status: null,
      amountOfPolls: 0,
      isEnd: false,
      isWinner: false,
      isChooseColor: true,
      color: null,
    };
  }

  logout() {
    localStorage.removeItem("token");
    this.props.history.push("/login");
  }

  listenForGameStateChange() {
    const url = `${getDomain()}/games/${localStorage.getItem('game_id')}`;
    const fields = ['status'];
    this.startPolling(url, fields).then(
        result => this.setState({status: result}),
        rejected => alert(rejected)
    );
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
        resolve(response[fields[0]]);
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
    console.log(param);
    this.setState({
      isChooseColor: param.isChooseColor,
      color: param.color
    });
  };

  render() {
    return (
        <Container>
             <EndPopUp isEnd={this.state.isEnd} winner={this.state.isWinner} props={this.props}/>
             <ChooseColorPopUp isChooseColor={this.state.isChooseColor} setColor={this.setColor}/>
        </Container>
    );
  }
}

export default withRouter(GamePage);