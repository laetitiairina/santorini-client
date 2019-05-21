import React from "react";
import { Redirect } from "react-router-dom";
import Header from "../../../views/Header";
import ErrorPage from "../pages/ErrorPage";

/**
 * routeProtectors interfaces can tell the router whether or not it should allow navigation to a requested route.
 * They are functional components. Based on the props passed, a route gets rendered.
 * In this case, if the user is authenticated (i.e., a token is stored in the local storage)
 * {props.children} are rendered --> The content inside the <GameGuard> in the App.js file, i.e. the user is able to access the main app.
 * If the user isn't authenticated, the components redirects to the /login screen
 * @Guard
 * @param props
 */
export const GameGuard = props => {
  if (localStorage.getItem('game_id') && localStorage.getItem('player_id') && localStorage.getItem('playerToken')) {
    return props.children;
  } else {
    // Game page was accessed without proper initialization of the game -> redirect to error page
    return (<div><Header height={"100"} /><ErrorPage error="Game not Initialized!" /></div>);
  }
};
