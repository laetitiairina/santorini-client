import React from "react";
import styled from "styled-components";
import {BaseContainer} from "../helpers/layout";
import {Button} from '../views/design/Button'

/**
 * Using styled-components you can visual HTML primitives and use props with it!
 * The idea behind this external package, it's to have a better structure and overview for your HTML and CSS
 * Using styled-components, you can have styling conditions using the following syntax: ${props => ...}
 * https://www.styled-components.com/
 */
const Container = styled.div`
  height: ${props => props.height}px;
  background: ${props => props.background};
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Title = styled.h1`
  font-weight: normal;
  font-size: 70px;
  color: #2167AC;
  text-align: center;
`;

const ButtonContainer = styled(BaseContainer)`
  position: absolute;
  right: 100px;
  overflow: hidden;
  color: #3E5774;
`;

const Exit = styled(Button)`
  border-radius: 40px;
  box-sizing: border-box;
  
  padding: 10px;
  right: 100px;
`;

/**
 * This is an example of a Functional and stateless component (View) in React. Functional components are not classes and thus don't handle internal state changes.
 * Conceptually, components are like JavaScript functions. They accept arbitrary inputs (called “props”) and return React elements describing what should appear on the screen.
 * They are reusable pieces, and think about each piece in isolation.
 * Functional components have to return always something. However, they don't need a "render()" method.
 * https://reactjs.org/docs/components-and-props.html
 * @FunctionalComponent
 */
const Header = props => {
  return (
    <Container height={props.height}>
      <Title>Santorini</Title>
      {/* TODO: Implement function in App.js to update inGame boolean*/}
      {!props.inGame ? (<div></div>) : (
        <ButtonContainer>
          <Exit>EXIT</Exit>
        </ButtonContainer>
      )}
    </Container>
  );
};

/**
 * Don't forget to export your component!
 */
export default Header;
