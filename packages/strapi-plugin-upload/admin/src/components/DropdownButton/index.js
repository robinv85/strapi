import styled from 'styled-components';
import PropTypes from 'prop-types';
import { themePropTypes } from 'strapi-helper-plugin';

const DropdownButton = styled.button`
  display: flex;
  align-items: center;
  height: 30px;
  padding: 0 10px;
  background-color: ${({ theme }) => theme.main.colors.white};
  border: 1px solid ${({ theme }) => theme.main.colors.darkGrey};
  color: ${({ theme }) => theme.main.colors.greyDark};
  font-weight: ${({ theme }) => theme.main.fontWeights.semiBold};
  font-size: ${({ theme }) => theme.main.fontSizes.md};
  border-radius: ${({ theme }) => theme.main.sizes.borderRadius};
  &:active,
  &:focus {
    outline: 0;
  }

  > svg + span,
  > span + svg {
    margin-left: 10px;
  }
  > svg g {
    stroke: ${({ theme }) => theme.main.colors.greyDark};
  }

  ${({ isActive, theme }) =>
    isActive
      ? `
        background-color: ${theme.main.colors.lightBlue};
        border: 1px solid ${theme.main.colors.darkBlue};
        color: ${theme.main.colors.mediumBlue};
        > svg g {
          stroke: ${theme.main.colors.mediumBlue};
        }
      `
      : `
        &:hover {
          background-color: ${theme.main.colors.lightestGrey};
        }
      `}
`;

DropdownButton.defaultProps = {
  isActive: false,
  type: 'button',
};

DropdownButton.propTypes = {
  isActive: PropTypes.bool,
  type: PropTypes.string,
  ...themePropTypes,
};

export default DropdownButton;