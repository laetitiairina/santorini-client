import React from "react";
import { Redirect } from "react-router-dom";

/**
 *
 * Another way to export directly your functional component.
 */
export const LoginGuard = props => {
  if (localStorage.getItem('userToken')) {
    return props.children;
  }
  // if user is not logged in, redirect to /home
  return <Redirect to={"/home"} />;
};
