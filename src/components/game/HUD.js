import React from "react";
import styled from "styled-components";
import {Button} from "../../views/design/Button";
import {Label} from "../../views/design/Label";
import {ProgressBar} from "../../views/design/ProgressBar";

const HUDOverlay = styled.div`
  opacity:0.8;
  position: fixed;
  top: 0px;
  left: 0px;
  width: 100%;
  height: 100%;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  justify-content: stretch;
  pointer-events: none;
  user-select: none;
`;

const TopLeftContainer = styled.div`
  position:absolute;
  left:10px;
  top:10px;
  width: 20vw;
  min-width:150px;
`;

const BottomLeftContainer = styled.div`
  position:absolute;
  left:10px;
  bottom:10px;
`;

const MessageLabel = styled(Label)`
`;

const InvalidMoveLabel = styled(Label)`
  margin-top: 10px;
  color: #ff0000;
  animation: show 20s;

  @keyframes show {
    0% {transform: translateY(-100px);}
    1% {transform: translateY(0px);}
    9% {transform: translateY(0px);}
    10% {transform: translateY(-100px);}
    100% {transform: translateY(-100px);}
  }
`;

const SkipButton = styled(Button)`
  pointer-events: all;
  margin-top: 15px;
  margin-bottom: 10px;
  animation: slide 1s;

  @keyframes slide {
    0% {transform: translateY(-100px);}
    100% {transform: translateY(0px);}
  }
`;

const ViewButtonTable = styled.table`
  visibility: ${(props => props.areCameraControlsEnabled ? "visible" : "hidden") || "hidden"};
  position:absolute;
  right:10px;
  bottom:10px;
`;

const ViewButton = styled(Button)`
  pointer-events: all;
  margin:0px;
  width:50px;
  font-size:10px;
  padding-left:0px;
  padding-right:0px;
`;

const TopRightButtonTable = styled.table`
  position:absolute;
  right:10px;
  top:10px;
`;

const ExitButton = styled(Button)`
  pointer-events: all;
  margin-left:5px;
`;

const QuestionMarkButton = styled(Button)`
  pointer-events: all;
`;

const ControlsLabel = styled.button`
  pointer-events: all;
  margin:0px;
  font-size:10px;
  padding: 10px;
  padding-left: 20px;
  padding-right: 20px;
  font-weight: 700;
  text-transform: uppercase;
  text-align: center;
  color: rgba(255, 255, 255, 1);
  border: none;
  border-radius: 20px;
  background: #007090; /* #1059ff */
`;

const ProgressBarContainer = styled.div`
  height: 20px;
  width: 100%;
  position: relative;
  margin-top: 15px;
  background: rgba(255,255,255,0.5);
  border-radius: 10px;
`;

// TODO: Delete this after M3
const FastForwardButton = styled(Button)`
  pointer-events: all;
`;

class HUD extends React.Component {
  constructor(props) {
    super(props);
    
    this.graphicsTextEnum = {0:["LOW","#44aaff"],1:["MID","#4488ff"],2:["HIGH","#4455ff"]};

    this.state = {
      graphicsLevel:1,
      isNight:false,
      minimizeControls:false
    };
  }

  componentDidMount() {
    if (window.matchMedia("only screen and (max-width: 760px)").matches) {
      this.setState({minimizeControls:true});
    }
    let hours = (new Date()).getHours();
    if (hours < 8 || hours > 21) {
      this.setState({isNight:true});
    }
    if(localStorage.getItem('graphicsLevel') != null) {
      this.setState({graphicsLevel:Number(localStorage.getItem('graphicsLevel'))});
    }
  }
  
  render() {
    return (
      <HUDOverlay>
        {this.props.invalidMoveMsg ? (
            <div style={{width:"100%",position:"absolute",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",zIndex:"10"}}><InvalidMoveLabel>{this.props.invalidMoveMsg}</InvalidMoveLabel></div>
          ) : (<div></div>)}
        {this.props.skipButtonCardNr ? (
            <div style={{width:"100%",position:"absolute",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",zIndex:"10"}}>
              <SkipButton onClick={() => {
                this.props.skipGodCard();
              }}>
                {(this.props.skipButtonCardNr == 7) ? ("Skip Move") : ("Skip Build")}
              </SkipButton>
            </div>
          ) : (<div></div>)}
        <TopLeftContainer>
          {this.props.displayMsg ? (
              <MessageLabel><div>{this.props.displayMsg}</div></MessageLabel>
            ) : (<div></div>)}
          {this.props.moveTimeLeftSec ? (
              <ProgressBarContainer>
                <ProgressBar progress={Math.floor(((this.props.moveTimeLeftSec+15)/135)*100)+"%"} color={(this.props.moveTimeLeftSec < 30) ? ((this.props.moveTimeLeftSec < 10) ? "#ff0000" : "#eeaa00") : null}>{this.props.moveTimeLeftSec+" sec"}</ProgressBar>
              </ProgressBarContainer>
            ) : (<div></div>)}
        </TopLeftContainer>
        {/*<BottomLeftContainer>
          <FastForwardButton disabled={this.props.gameEnd || this.props.chooseExit || this.props.instructions} onClick={() => {
            this.props.fastforwardGame();
          }}>
            FAST-FORWARD
          </FastForwardButton>
        </BottomLeftContainer>*/}
        <TopRightButtonTable>
          <tbody>
            <tr>
              <td>
                <QuestionMarkButton disabled={this.props.gameEnd || this.props.chooseExit} onClick={() => {
                  //window.open("https://roxley.com/wp-content/uploads/2016/08/Santorini-Rulebook-Web-2016.08.14.pdf");
                  this.props.showInstructions(!this.props.instructions);
                }}>
                  ?
                </QuestionMarkButton>
              </td>
              <td>
                  <ExitButton disabled={this.props.gameEnd || this.props.instructions} onClick={() => {
                    this.props.displayExit(!this.props.chooseExit);
                  }}>
                    EXIT
                  </ExitButton>
              </td>
            </tr>
          </tbody>
        </TopRightButtonTable>
        {this.state.minimizeControls ? (
          <ViewButtonTable areCameraControlsEnabled={this.props.areCameraControlsEnabled && !this.props.gameEnd && !this.props.instructions && !this.props.chooseExit}>
            <tbody>
              <tr>
                <td>
                  <ViewButton onClick={() => {
                    this.setState({minimizeControls:false});
                  }}>
                    &#9881;
                  </ViewButton>
                </td>
              </tr>
            </tbody>
          </ViewButtonTable>
        ) :(
          <ViewButtonTable areCameraControlsEnabled={this.props.areCameraControlsEnabled && !this.props.gameEnd && !this.props.instructions && !this.props.chooseExit}>
            <tbody>
              <tr>
                <td colSpan="2">
                  <ControlsLabel>
                    GRAPHICS:
                  </ControlsLabel>
                </td>
                <td>
                  <ViewButton style={{backgroundColor:this.graphicsTextEnum[this.state.graphicsLevel][1]}} onClick={() => {
                    this.props.setGraphics((this.state.graphicsLevel+1)%3);
                    this.setState({graphicsLevel:(this.state.graphicsLevel+1)%3});
                  }}>
                    {this.graphicsTextEnum[this.state.graphicsLevel][0]}
                  </ViewButton>
                </td>
              </tr>
              <tr>
                <td>
                  <ViewButton onClick={() => {
                    this.props.setCameraPos("side");
                  }}>
                    SIDE
                  </ViewButton>
                </td>
                <td>
                  <ViewButton onClick={() => {
                    this.props.setCameraPos("front");
                  }}>
                    FRONT
                  </ViewButton>
                </td>
                <td>
                  <ControlsLabel style={{width:"50px",paddingLeft:"0px",paddingRight:"0px"}}>
                    CAM
                  </ControlsLabel>
                </td>
              </tr>
              <tr>
                <td>
                  <ViewButton onClick={() => {
                    this.props.setCameraPos("left");
                  }}>
                    LEFT
                  </ViewButton>
                </td>
                <td>
                  <ViewButton onClick={() => {
                    this.props.setCameraPos("top");
                  }}>
                    TOP
                  </ViewButton>
                </td>
                <td>
                  <ViewButton onClick={() => {
                    this.props.setCameraPos("right");
                  }}>
                    RIGHT
                  </ViewButton>
                </td>
              </tr>
                <tr>
                <td>
                  <ViewButton style={{backgroundColor:this.state.isNight ? "#222222" : "#dddddd"}} onClick={() => {
                    this.props.setTime(!this.state.isNight);
                    this.setState({isNight:!this.state.isNight});
                  }}>
                    {this.state.isNight ? ("NIGHT") : ("DAY")}
                  </ViewButton>
                </td>
                <td>
                  <ViewButton onClick={() => {
                    this.props.setCameraPos("back");
                  }}>
                    BACK
                  </ViewButton>
                </td>
                <td>
                  <ViewButton style={{backgroundColor:"#777777"}} onClick={() => {
                    this.setState({minimizeControls:true});
                  }}>
                    Close
                  </ViewButton>
                </td>
              </tr>
            </tbody>
          </ViewButtonTable>
        )}
      </HUDOverlay>
    );
  }
}

export default HUD;
