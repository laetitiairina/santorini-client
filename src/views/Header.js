import React from "react";
import styled from "styled-components";
import { ReactLogo } from "./ReactLogo";
import {BaseContainer} from "../helpers/layout";

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

const Exit = styled.button`
  &:hover {
    background: #3E5774;
  }
  
  box-sizing: border-box;
  background: transparent;
  border: 2.5px solid #2167AC;
  padding: 10px;
  border-radius: 40px;
  color: #E4F5B2;
  text-align: center;
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
      <ButtonContainer>
        <Exit>EXIT</Exit>
      </ButtonContainer>
    </Container>
  );
};

/**
 * Don't forget to export your component!
 */
export default Header;
