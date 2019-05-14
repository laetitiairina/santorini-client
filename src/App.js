import React, { Component } from "react";
import Header from "./views/Header";
import AppRouter from "./components/shared/routers/AppRouter";
import styled from "styled-components";

/**
 * Happy coding!
 * React Template by Lucas Pelloni
 */
/**
 * Game by SoPra FS19 Group 10
 */
class App extends Component {
  render() {
    return (
      <div>
        {/*<Header height={"100"} />*/}
        <AppRouter />
      </div>
    );
  }
}

export default App;
