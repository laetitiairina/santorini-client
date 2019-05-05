import styled from "styled-components";
import backgroundGradient from "./background-gradient.png";

export const Label = styled.div`
  padding: 20px;
  padding-left: 20px;
  padding-right: 20px;
  font-weight: 700;
  text-transform: uppercase;
  text-align: center;
  color: #ffffff;
  width: ${props => props.width || null};
  border-radius: 10px;
  cursor: ${props => (props.disabled ? "default" : "pointer")};
  opacity: ${props => (props.disabled ? 0.4 : 1)};
  background: #1059ff;
  background-image: url(${backgroundGradient});
  background-position: center;
  animation: move 1s ease-in infinite alternate;

  @keyframes move {
    0% {transform: translateY(0px);}
    100% {transform: translateY(10px);}
  }
`;
