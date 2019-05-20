import React from "react";
import styled from "styled-components";
import Header from "../../../views/Header";
import { BrowserRouter, Redirect, Route, Switch } from "react-router-dom";
import { GameGuard } from "../routeProtectors/GameGuard";
import GameRouter from "./GameRouter";
import { LoginGuard } from "../routeProtectors/LoginGuard";
import Login from "../../login/Login";
import StartPage from "../../game/StartPage";
import GamePage from "../../game/GamePage";
import ErrorPage from "../pages/ErrorPage";
import Credits from "../pages/Credits";

/**
 * Main router of your application.
 * In the following class, different routes are rendered. In our case, there is a Login Route with matches the path "/login"
 * and another Router that matches the route "/game".
 * The main difference between these two routes is the following:
 * /login renders another component without any sub-route
 * /game renders a Router that contains other sub-routes that render in turn other react components
 * Documentation about routing in React: https://reacttraining.com/react-router/web/guides/quick-start
 */
class AppRouter extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      preload: null
    }
  }
  
  updatePreload = (content) => {
    this.setState({preload:content});
  }

  render() {
    return (
      <BrowserRouter>
        <Switch>
          <Route
            path="/game"
            render={() => (
              <GameGuard>
                {/*<GameRouter base={"/game"} />*/}
                <GamePage preload={this.state.preload} updatePreload={this.updatePreload.bind(this)} />
              </GameGuard>
            )}
          />
          <Route
            path="/login"
            exact
            render={() => (
              <LoginGuard>
                <Redirect to={"/home"} />
              </LoginGuard>
            )}
          />
          <Route
            path="/register"
            exact
            render={() => (
              <div style={{textAlign:"center"}}>Registration coming soon!</div>
            )}
          />
          <Route
            path="/credits"
            exact
            render={() => (
              <Credits />
            )}
          />
          <Route
            path="/home"
            exact
            render={() => (
              <div>
                <Header height={"100"} />
                <StartPage preload={this.state.preload} updatePreload={this.updatePreload.bind(this)} />
              </div>
            )} />
          <Route path="/" exact render={() => <Redirect to={"/home"} />} />
          <Route
            path="*"
            render={() => (
              <ErrorPage error="Page Not Found!" />
            )}
          />
        </Switch>
      </BrowserRouter>
    );
  }
}
/*
* Don't forget to export your component!
 */
export default AppRouter;
