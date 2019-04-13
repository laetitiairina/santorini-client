import styled from "styled-components";

export const Button = styled.button`
  &:hover {
    background: #3E5774;
  }
  
  text-align: center;
  color: #E4F5B2;
  border-color: #2167AC;
  border-style: solid;
  
  cursor: ${props => (props.disabled ? "default" : "pointer")};
  opacity: ${props => (props.disabled ? 0.6 : 1)};
  
  background: transparent;
`;
