import styled from "styled-components";

export const Button = styled.button`
  &:hover {
    transform: translateY(-2px);
  }
  &:active {
    transform: translateY(4px);
  }
  padding: 10px;
  padding-left: 20px;
  padding-right: 20px;
  font-weight: 700;
  text-transform: uppercase;
  text-align: center;
  color: rgba(255, 255, 255, 1);
  width: ${props => props.width || null};
  border: none;
  border-radius: 20px;
  cursor: ${props => (props.disabled ? "default" : "pointer")};
  opacity: ${props => (props.disabled ? 0.4 : 1)};
  background: #2CA1C2; /* #1059ff */
  transition: all 0.3s ease;
`;
