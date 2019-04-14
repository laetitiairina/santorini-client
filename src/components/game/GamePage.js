import React from "react";
import styled from "styled-components";
import { BaseContainer } from "../../helpers/layout";
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
    constructor(props) {
        super(props);
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