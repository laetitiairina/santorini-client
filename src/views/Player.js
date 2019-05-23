import React from "react";
import styled from "styled-components";
import {Slot} from "./design/Slot"

const Container = styled.div`
  margin: 6px;
  width: 80%;
  padding: 10px;
  border-radius: 40px;
  display: block;
  align-items: center;
  text-align:left;
  display:flex;
  border: 2.5px solid #2167AC;
  background: rgba(62,87,116,0.2);
  &:hover {
    transform: translateY(-2px);
  }
  &:active {
    transform: translateY(4px);
  }
  transition: all 0.3s ease;
`;

const UserName = styled.div`
  font-weight: normal;
  font-size: x-large;
  color: #2167AC;
  margin-left: 5px;
`;

const Symbol = styled.div`
  margin-left: auto;
  margin-right: 0px;
`;

/**
 * This is an example of a Functional and stateless component (View) in React. Functional components are not classes and thus don't handle internal state changes.
 * Conceptually, components are like JavaScript functions. They accept arbitrary inputs (called “props”) and return React elements describing what should appear on the screen.
 * They are reusable pieces, and think about each piece in isolation.
 * Functional components have to return always something. However, they don't need a "render()" method.
 * https://reactjs.org/docs/components-and-props.html
 * @FunctionalComponent
 */
const Player = ({ user }) => {
  return (
    <Container>
      <UserName>{user.username}</UserName>
      <Symbol>
        <Slot size="15px" enabled={true}></Slot>
      </Symbol>
    </Container>
  );
};

export default Player;
