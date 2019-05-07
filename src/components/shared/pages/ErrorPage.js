import React from "react";
import styled from "styled-components";
import {withRouter} from "react-router-dom";
import {Button} from "../../../views/design/Button";


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

class ErrorPage extends React.Component {
  constructor(props) {
    super(props);
  }
  
  render() {
    return (
      <ErrorContainer>
        <ErrorLabel>{this.props.error}</ErrorLabel>
        <Button onClick={() => {
          this.props.history.push("/home");
        }}>
          Back
        </Button>
      </ErrorContainer>
    );
  }
}

export default withRouter(ErrorPage);
