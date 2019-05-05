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
  grid-template-columns: 3fr 8fr 1fr 1fr;
  grid-template-rows: 1fr 10fr 1fr;
  grid-gap: 10px;

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
  grid-column: 3;
  grid-row: 1;

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

const TopViewButton = styled(Button)`
  pointer-events: all;
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

class HUD extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
    };
  }

  componentDidMount() {

  }
  
  render() {
    return (
      <HUDOverlay>
        <Container>
          <ContainerTopLeft>
            {this.props.displayMsg ? (
              <MessageLabel><div>{this.props.displayMsg}</div></MessageLabel>
            ) : (<div></div>)}
          </ContainerTopLeft>
          <ContainerTopMiddleRight>
          <QuestionMarkButton onClick={() => {
              // TODO: Display Manual
            }}>
              ?
            </QuestionMarkButton>
          </ContainerTopMiddleRight>
          <ContainerTopRight>
            <ExitButton onClick={() => {
              // TODO: Send exit signal to GamePage
            }}>
              EXIT
            </ExitButton>
          </ContainerTopRight>
          <ContainerBottomLeft>
          </ContainerBottomLeft>
          <ContainerBottomRight>
            <TopViewButton onClick={() => {
              // TODO: Send signal to GamePage to put camera at specific position
            }}>
              TOP
            </TopViewButton>
          </ContainerBottomRight>
        </Container>
      </HUDOverlay>
    );
  }
}

export default HUD;
