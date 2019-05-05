import styled from "styled-components";

export const Slot = styled.div`
  width: ${props => props.size || null};
  height: ${props => props.size || null};
  border: 2px solid #2167AC;
  border-radius: ${props => props.size || null};
  margin: ${props => props.margin || "5px"};
  background: ${props => (props.enabled ? "#2CA1C2" : "transparent")}; /* #2CA1C2 */ /* #1059ff */
`;
