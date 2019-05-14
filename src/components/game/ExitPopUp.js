import React from "react";
import styled from "styled-components";
import Popup from 'reactjs-popup';
import {BaseContainer} from "../../helpers/layout";
import {Button} from "../../views/design/Button";

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

const Contents =  styled.div`
  width: 100%;
  padding: 20px 5px;
`

/**
 * This is an example of a Functional and stateless component (View) in React. Functional components are not classes and thus don't handle internal state changes.
 * Conceptually, components are like JavaScript functions. They accept arbitrary inputs (called “props”) and return React elements describing what should appear on the screen.
 * They are reusable pieces, and think about each piece in isolation.
 * Functional components have to return always something. However, they don't need a "render()" method.
 * https://reactjs.org/docs/components-and-props.html
 * @FunctionalComponent
 * */
const ExitPopUp = ({appears, displayExit, props}) => {
  return (
      <Popup modal open={appears} closeOnDocumentClick={false} contentStyle={{background: "transparent", color: "#E4F5B2", border: "0px"}}>
            <Container>
              <Header> EXIT GAME </Header>
              <Contents>
                Do you want to quit the current Game?
              </Contents>
                <Button style={{margin:"20px"}}
                    onClick={() => {
                      props.history.push("/home");
                    }}
                >
                  Exit
                </Button>
                <Button style={{margin:"20px"}}
                    onClick={() => {
                      displayExit(false);
                    }}
                >
                  Continue
                </Button>
            </Container>
      </Popup>
  );
};

export default ExitPopUp;
