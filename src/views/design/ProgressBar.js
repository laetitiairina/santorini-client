import styled from "styled-components";

export const ProgressBar = styled.span`
  height: 100%;
  width: ${props => props.progress || null};
  display: block;
  position: relative;
  overflow: hidden;
  background: ${props => props.color || "#2CA1C2"};
  border-radius: 100px;
  color:white;
  text-align: center;
  font-size: 15px;
  font-weight: 700;
`;
