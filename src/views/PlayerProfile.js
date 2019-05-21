import React from "react";
import styled from "styled-components";

const Container = styled.div`
  margin: 6px 0;
  width: 75%;
  min-width: 200px;
  max-width: 500px;
  padding: 10px;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const DataContainer = styled.div`
  margin: 6px 0;
  width: 90%;
  padding: 10px;
  border-radius: 100px;
  display: flex;
  align-items: center;
  border: 1px solid #2167AC;
`;

const FieldContainer = styled.div`
  width: 50%;
  display: flex;
  align-items: center;
  color: rgba(44,161,194,0.7);
`;

const Label = styled.label`
  text-transform: uppercase;
  text-align: left;
  width: 50%;
  color: #2167AC;
  font-weight: 700;
`;

const Field = styled.div`
  font-weight: lighter;
  text-align: right;
  width: 100%;
  color: #2CA1C2;
  font-weight: 700;
`;

const InputField = styled.input`
  &::placeholder {
    color: #2CA1C277;
  }
  //height: 35px;
  text-align: right;
  width: 100%;
  padding-left: 15px;
  padding-right: 15px;
  border: none;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.2);
  color: #2CA1C2;
  font-weight: 700;
`;

/**
 * This is an example of a Functional and stateless component (View) in React. Functional components are not classes and thus don't handle internal state changes.
 * Conceptually, components are like JavaScript functions. They accept arbitrary inputs (called “props”) and return React elements describing what should appear on the screen.
 * They are reusable pieces, and think about each piece in isolation.
 * Functional components have to return always something. However, they don't need a "render()" method.
 * https://reactjs.org/docs/components-and-props.html
 * @FunctionalComponent
 */
const PlayerProfile = props => {
  return (
    <Container>
      <DataContainer>
        <Label>Username</Label>
        <FieldContainer>
          {props.edit ? (
            <InputField
              placeholder={props.user.username}
              onChange={e => {
                props.handleInputChange("changeUsername", e.target.value);
              }}
            />
          ) : (
            <Field>{props.user.username}</Field>
          )}
        </FieldContainer>
      </DataContainer>
      <DataContainer>
        <Label>Status</Label>
        <Field>{props.user.status}</Field>
      </DataContainer>
      <DataContainer>
        <Label>Creation Date</Label>
        <Field>{props.user.creationDate.substring(0,10)}</Field>
      </DataContainer>
      <DataContainer>
        <Label>Birthday Date</Label>
        <FieldContainer>
          {props.edit ? (
            <InputField
              placeholder={props.user.birthdayDate}
              onChange={e => {
                props.handleInputChange("changeBirthDate", e.target.value);
              }}
            />
          ) : (
            <Field>{props.user.birthdayDate}</Field>
          )}
        </FieldContainer>
      </DataContainer>
      <DataContainer>
        <Label>Wins / Losses</Label>
        <Field>{props.user.wins + " / " + props.user.losses}</Field>
      </DataContainer>
    </Container>
  );
};

export default PlayerProfile;
