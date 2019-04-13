import React from "react";
import styled from "styled-components";
import { BaseContainer } from "../../helpers/layout";
import { getDomain } from "../../helpers/getDomain";
import Player from "../../views/Player";
import { Spinner } from "../../views/design/Spinner";
import { Button } from "../../views/design/Button";
import { withRouter } from "react-router-dom";


const Container = styled(BaseContainer)`
  color: white;
  text-align: center;
  justify-content: left;
`;


const ExitButton = styled(Button)`
`;

const QuestionMarkButton = styled(Button)`

`;

class GamePage extends React.Component {
    constructor() {
        super();
        this.state = {

        };
    }

    logout() {
        localStorage.removeItem("token");
        this.props.history.push("/login");
    }


    render() {
        return (
            <Container>



            </Container>
        );
    }
}



export default withRouter(GamePage);