import React from "react";
import styled from "styled-components";
import {BaseContainer} from "../../helpers/layout";
import {Button} from "../../views/design/Button";
import {Label} from "../../views/design/Label";
import {Spinner} from "../../views/design/Spinner";

const Container = styled(BaseContainer)`
  color: white;
  text-align: center;
  justify-items: center;
  align-items: center;
  display: grid;
  grid-template-columns: 3fr 7fr 1fr 1fr;
  grid-template-rows: 1fr 10fr 1fr;
  grid-auto-rows: 1fr;
  grid-gap: 10px;
  height:100%;

  @media only screen and (max-width: 700px){
    
  }
`;

const ContainerTopLeft = styled.div`
  grid-column: 1;
  grid-row: 1;

  @media only screen and (max-width: 700px){
    
  }
`;

const ContainerTopMiddleRight = styled.div`
  grid-column: 3;
  grid-row: 1;

  @media only screen and (max-width: 700px){
    
  }
`;

const ContainerTopRight = styled.div`
  grid-column: 4;
  grid-row: 1;

  @media only screen and (max-width: 700px){
    
  }
`;

const ContainerBottomLeft = styled.div`
  grid-column: 1;
  grid-row: 3;

  @media only screen and (max-width: 700px){
    
  }
`;

const ContainerBottomRight = styled.div`
  grid-column: 4;
  grid-row: 3;

  @media only screen and (max-width: 700px){
    
  }
`;

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

const MessageLabel= styled(Label)`
  margin-top:20px;
`;

const InvalidMoveLabel= styled(Label)`
  margin-top: 20px;
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

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const ErrorLabel = styled.label`
  color: #FF0000;
  margin: 50px;
  text-transform: uppercase;
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

const ExitButton = styled(Button)`
  display: fixed;
  right: 20px;
  pointer-events: all;
  margin: 10px;
  margin-top: 20px;
`;

const QuestionMarkButton = styled(Button)`
  pointer-events: all;
  margin: 10px;
  margin-top:20px;
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

// TODO: Delete this after M3
const FastForwardButton = styled(Button)`
  pointer-events: all;
  margin-bottom: 10px;
`;

class HUD extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      graphicsSetting:true
    };
  }

  componentDidMount() {}
  
  render() {
    return (
      <HUDOverlay>
        {this.props.invalidMoveMsg ? (
              <div style={{width:"100%",position:"absolute",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",zIndex:"10"}}><InvalidMoveLabel>{this.props.invalidMoveMsg}</InvalidMoveLabel></div>
            ) : (<div></div>)}
        <Container>
          <ContainerTopLeft>
            {this.props.displayMsg ? (
              <MessageLabel><div>{this.props.displayMsg}</div></MessageLabel>
            ) : (<div></div>)}
          </ContainerTopLeft>
          <ContainerTopMiddleRight>
          <QuestionMarkButton disabled={this.props.gameEnd} onClick={() => {
              // TODO: Display game manual
            }}>
              ?
            </QuestionMarkButton>
          </ContainerTopMiddleRight>
          <ContainerTopRight>
            <ExitButton disabled={this.props.gameEnd} onClick={() => {
              this.props.displayExit(true);
            }}>
              EXIT
            </ExitButton>
          </ContainerTopRight>
          <ContainerBottomLeft>
            <FastForwardButton disabled={this.props.gameEnd} onClick={() => {
              this.props.fastforwardGame();
            }}>
              FAST-FORWARD
            </FastForwardButton>
          </ContainerBottomLeft>
          <ContainerBottomRight>
          </ContainerBottomRight>
        </Container>
        <ViewButtonTable areCameraControlsEnabled={this.props.areCameraControlsEnabled && !this.props.gameEnd}>
          <tr>
            <td colspan="2">
              <ControlsLabel>
                GRAPHICS:
              </ControlsLabel>
            </td>
            <td>
              <ViewButton disabled={this.props.gameEnd} onClick={() => {
                this.props.setGraphics(!this.state.graphicsSetting);
                this.setState({graphicsSetting:!this.state.graphicsSetting});
              }}>
                {this.state.graphicsSetting ? ("HIGH") : ("LOW")}
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
            <td></td>
            <td>
              <ViewButton onClick={() => {
                this.props.setCameraPos("back");
              }}>
                BACK
              </ViewButton>
            </td>
            <td></td>
          </tr>
        </ViewButtonTable>
      </HUDOverlay>
    );
  }
}

export default HUD;
