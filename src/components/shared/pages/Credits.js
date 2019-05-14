import React from "react";
import styled from "styled-components";
import {withRouter} from "react-router-dom";
import {Button} from "../../../views/design/Button";


const CreditsContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const CreditsLabel = styled.label`
  color: #ffffff;
  margin: 50px;
  text-transform: uppercase;
  text-align: center;
`;

class Credits extends React.Component {
  render() {
    return (
      <CreditsContainer>
        <CreditsLabel>
          <h1>Credits</h1>
          <h3>Lead Developers</h3>
            <p>Text</p>
            <p>Text</p>
          <h3>Assistent Developers</h3>
            <p>Text</p>
            <p>Text</p>
            <p>Text</p>
          <h3>External Assets</h3>
            <h4>3D Models</h4>
              <p>Text</p>
        </CreditsLabel>
        <Button onClick={() => {
          this.props.history.push("/home");
        }}>
          Back
        </Button>
      </CreditsContainer>
    );
  }
}

export default withRouter(Credits);
