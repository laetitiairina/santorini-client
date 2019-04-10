import React from "react";
import circle from "./design/circle.png";
import styled from "styled-components";

const Container = styled.div`
  margin: 6px 0;
  width: 280px;
  padding: 10px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  border: 1px solid #ffffff26;
`;

const UserName = styled.div`
  font-weight: normal;
  font-family: "American Typewriter",serif;
  font-size: x-large;
  color: #D6F0E7;
  margin-left: 5px;
`;

const Symbol = styled.div`
  margin-left: auto;
  margin-right: 10px;
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
        <img src={circle} alt={"Online"} width={"20px"} height={"auto"}/>
      </Symbol>
    </Container>
  );
};

export default Player;
