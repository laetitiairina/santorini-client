import React from "react";
import styled from "styled-components";
import Popup from 'reactjs-popup';
import {BaseContainer} from "../../helpers/layout";
import {Button} from "../../views/design/Button";
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

const WorkerButton = styled(Button)`
  &:hover {
    border-bottom-color: white;
    background-color: transparent;
  }

  border-color: transparent;
  border-width: 5px;
  padding: 35px;
`

const NextButton = styled(Button)`
  margin-bottom: 20px;
`;


class ChooseColorPopUp extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      isChooseColor: this.props.isChooseColor,
      blue: false,
      grey: false,
      white: false,
      color: null, // can later be replaced with the COLOR ENUM
    };
  }

  render() {
    return (
        <Popup modal open={this.state.isChooseColor} closeOnDocumentClick={false}
               contentStyle={{background: "transparent", color: "#E4F5B2", border: "5px solid #2167AC"}}>
          {close => (
          <Container>
            <Header> CHOOSE A COLOR </Header>
            <Contents>
              <WorkerButton style={{borderBottomColor: (this.state.blue) ? "#E4F5B2" : "transparent"}}
                            onMouseOver={() => {
                              this.setState({blue: true});
                            }}
                            onMouseOut={() => {
                              if (this.state.color !== "blue") this.setState({blue: false});
                            }}
                            onClick={() => {
                              this.setState({blue: true, white: false, grey: false, color: "blue"})
                            }}>
                <Worker src={Blue} alt={"Blue Worker"}/>
              </WorkerButton>
              <WorkerButton style={{borderBottomColor: (this.state.grey) ? "#E4F5B2" : "transparent"}}
                            onMouseOver={() => {
                              this.setState({grey: true});
                            }}
                            onMouseOut={() => {
                              if (this.state.color !== "grey") this.setState({grey: false});
                            }}
                            onClick={() => {
                              this.setState({grey: true, blue: false, white: false, color: "grey"})
                            }}>
                <Worker src={Grey} alt={"Grey Worker"}/>
              </WorkerButton>
              <WorkerButton style={{borderBottomColor: (this.state.white) ? "#E4F5B2" : "transparent"}}
                            onMouseOver={() => {
                              this.setState({white: true});
                            }}
                            onMouseOut={() => {
                              if (this.state.color !== "white") this.setState({white: false});
                            }}
                            onClick={() => {
                              this.setState({white: true, blue: false, grey: false, color: "white"})
                            }}>
                <Worker src={White} alt={"White Worker"}/>
              </WorkerButton>
            </Contents>
            <NextButton
                onClick={() => {
                  this.props.setColor( {isChooseColor : false, color: this.state.color} );
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
