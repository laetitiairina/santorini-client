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

const AttributionLabel = styled.p`
  margin: 10px;
  font-size: 12px;
  text-transform: none;
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
          <AttributionLabel>
            BASE BLOCK, MIDDLE BLOCK, TOP BLOCK: <a href="https://www.thingiverse.com/thing:2591325">Santorini</a> by <a href="https://www.thingiverse.com/Cinderella">Cinderella</a> is licensed under the <a href="http://creativecommons.org/licenses/by-sa/3.0/">Creative Commons - Attribution - Share Alike</a> license.
          </AttributionLabel>
          <AttributionLabel>
            WORKER: <a href="https://www.thingiverse.com/thing:3434960">Quake 1 - Ogre</a> by <a href="https://www.thingiverse.com/Conqueror_Worm">Conqueror_Worm</a> is licensed under the <a href="http://creativecommons.org/licenses/by/3.0/">Creative Commons - Attribution</a> license.
          </AttributionLabel>
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
