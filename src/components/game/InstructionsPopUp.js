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
  height: 50vh;
  padding: 20px 5px;
  font-size: 15px;
  overflow-y:auto;

  ::-webkit-scrollbar {
    width: 5px;
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background: rgba(44,161,194,0.7);
    border-radius: 10px;
  }
`

/**
 * This is an example of a Functional and stateless component (View) in React. Functional components are not classes and thus don't handle internal state changes.
 * Conceptually, components are like JavaScript functions. They accept arbitrary inputs (called “props”) and return React elements describing what should appear on the screen.
 * They are reusable pieces, and think about each piece in isolation.
 * Functional components have to return always something. However, they don't need a "render()" method.
 * https://reactjs.org/docs/components-and-props.html
 * @FunctionalComponent
 * */
const InstructionsPopUp = ({appears, showInstructions}) => {
  return (
      <Popup modal open={appears} closeOnDocumentClick={false} contentStyle={{background: "transparent", color: "#E4F5B2", border: "0px", overflow: "hidden", pointerEvents: "none"}}>
            <Container>
              <Header> Instructions </Header>
              <Contents>
                <p>Player take turns, staring with the Start Player, who first placed their Workers. On your turn, select one of your Workers. You must move and then build with the selected Worker.</p>
                <p><b>MOVE</b> your selected Worker into one of the (up to) eight neighboring spaces. A Worker may move up a maximum of one level higher, move down any number of levels lower, or move along the same level. The space your Worker moves into must be unoccupied (not containing a Worker or Dome).</p>
                <p><b>BUILD</b> a Block or Dome on an unoccupied space neighboring the moved Worker. You can build onto a level of any height. A Dome can only be build on top of three blocks.</p>
                <p>You <b>WIN</b> if one of your Workers moves up on top of 3 Blocks during your turn.</p>
                <p>You <b>LOSE</b> if you are unable to perform a move then build on your turn.</p>
              </Contents>
                <Button style={{pointerEvents:"all",margin:"20px"}}
                    onClick={() => {
                      showInstructions(false);
                    }}
                >
                  Back
                </Button>
            </Container>
      </Popup>
  );
};

export default InstructionsPopUp;
