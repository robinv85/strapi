import React, { useReducer } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { Select } from '@buffetjs/core';
import { getFilterType } from 'strapi-helper-plugin';
import getTrad from '../../utils/getTrad';

import reducer, { initialState } from './reducer';

import Wrapper from './Wrapper';
import Button from './Button';
import InputWrapper from './InputWrapper';

import Input from '../FilterInput';

const FiltersCard = ({ filters, onChange }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const name = state.get('name');
  const type = filters[name].type;
  const filtersOptions = getFilterType(type);

  const handleChange = ({ target: { name, value } }) => {
    dispatch({
      type: 'ON_CHANGE',
      name,
      value,
    });
  };

  const addFilter = () => {
    onChange({ target: { value: state.toJS() } });

    dispatch({
      type: 'RESET_FORM',
    });
  };

  return (
    <Wrapper>
      <InputWrapper>
        <Select
          onChange={e => {
            // Change the attribute
            handleChange(e);
            // Change the default filter so it reset to the common one which is '='
            handleChange({ target: { name: 'filter', value: '=' } });
          }}
          name="name"
          options={Object.keys(filters)}
          value={name}
        />
      </InputWrapper>
      <InputWrapper>
        <Select
          onChange={handleChange}
          name="filter"
          options={filtersOptions.map(({ id, value }) => (
            <FormattedMessage id={id} key={id}>
              {msg => <option value={value}>{msg}</option>}
            </FormattedMessage>
          ))}
          value={state.get('filter')}
        />
      </InputWrapper>
      <InputWrapper>
        <Input
          type={type}
          onChange={handleChange}
          name="value"
          options={['image', 'video', 'files']}
          value={state.get('value')}
        />
      </InputWrapper>
      <Button icon onClick={addFilter}>
        <FormattedMessage id={getTrad('filter.add')} />
      </Button>
    </Wrapper>
  );
};

FiltersCard.defaultProps = {
  filters: {},
  onChange: () => {},
};

FiltersCard.propTypes = {
  filters: PropTypes.shape({
    type: PropTypes.string.isRequired,
  }),
  onChange: PropTypes.func,
};

export default FiltersCard;