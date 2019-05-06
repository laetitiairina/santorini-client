import React from "react";
import styled from "styled-components";
import Popup from 'reactjs-popup';
import {BaseContainer} from "../../helpers/layout";
import {Button} from "../../views/design/Button";
import {Button2} from "../../views/design/Button2";
import Blue from "../../views/design/Worker_blue.png"
import Grey from "../../views/design/Worker_Grey.png"
import White from "../../views/design/Worker_white.png"
import {withRouter} from "react-router-dom";

const Container = styled(BaseContainer)`
  text-align: center;
  justify-content: left;
`;

const Header = styled.div`
  border-bottom: 2.5px solid #2167AC;
  font-size: xx-large;
  text-align: center;
  padding: 10px;
`

const Contents = styled.div`
  width: 100%;
  padding: 20px 5px;
`

const Worker = styled.img`
  width: 100%;
  pointer-events: none;
  user-select: none;
`

const WorkerButton = styled(Button2)`
  &:hover {
    border-bottom-color: #1059ff;
    background-color: transparent;
  }

  border-radius: 40px;
  border-color: transparent;
  border-width: 5px;
  padding: 35px;
`

const NextButton = styled(Button)`

`;


class ChooseColorPopUp extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      blue: false,
      grey: false,
      white: false,
      color: null,
    };
  }

  render() {
    return (
        <Popup modal open={this.props.appears} closeOnDocumentClick={false}
               contentStyle={{background: "transparent", color: "#1059ff", border: "0px"}} overlayStyle={{background: "transparent"}}>
          {close => (
          <Container>
            {/*<Header> CHOOSE A COLOR </Header>*/}
            <Contents>
              <WorkerButton style={{borderBottomColor: (this.state.blue) ? "#1059ff" : "transparent",
                visibility: (this.props.blockedColor === "BLUE") ? "hidden" : "visible"}}
                            onMouseOver={() => {
                              this.setState({blue: true});
                            }}
                            onMouseOut={() => {
                              if (this.state.color !== "BLUE") this.setState({blue: false});
                            }}
                            onClick={() => {
                              this.setState({blue: true, white: false, grey: false, color: "BLUE"})
                            }}>
                <Worker src={Blue} alt={"Blue Worker"}/>
              </WorkerButton>
              <WorkerButton style={{borderBottomColor: (this.state.grey) ? "#1059ff" : "transparent",
                visibility: (this.props.blockedColor === "GREY") ? "hidden" : "visible"}}
                            onMouseOver={() => {
                              this.setState({grey: true});
                            }}
                            onMouseOut={() => {
                              if (this.state.color !== "GREY") this.setState({grey: false});
                            }}
                            onClick={() => {
                              this.setState({grey: true, blue: false, white: false, color: "GREY"})
                            }}>
                <Worker src={Grey} alt={"Grey Worker"}/>
              </WorkerButton>
              <WorkerButton style={{borderBottomColor: (this.state.white) ? "#1059ff" : "transparent",
                visibility: (this.props.blockedColor === "WHITE") ? "hidden" : "visible"}}
                            onMouseOver={() => {
                              this.setState({white: true});
                            }}
                            onMouseOut={() => {
                              if (this.state.color !== "WHITE") this.setState({white: false});
                            }}
                            onClick={() => {
                              this.setState({white: true, blue: false, grey: false, color: "WHITE"})
                            }}>
                <Worker src={White} alt={"White Worker"}/>
              </WorkerButton>
            </Contents>
            <NextButton
                disabled={!this.state.color}
                onClick={() => {
                  this.props.setColor( {color: this.state.color} );
                  close();
                }}
            >
              NEXT
            </NextButton>
          </Container>
          )}
        </Popup>
    );
  }
}

export default withRouter(ChooseColorPopUp);
