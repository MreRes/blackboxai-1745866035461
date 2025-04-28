import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';

const Select = forwardRef(({
  label,
  options,
  error,
  helper,
  fullWidth = false,
  size = 'medium',
  disabled = false,
  required = false,
  placeholder,
  className = '',
  ...props
}, ref) => {
  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-4 py-3 text-lg'
  };

  const selectClasses = `
    block
    border
    rounded-md
    shadow-sm
    focus:outline-none
    focus:ring-2
    focus:ring-indigo-500
    focus:border-indigo-500
    disabled:bg-gray-100
    disabled:cursor-not-allowed
    appearance-none
    bg-white
    pr-10
    ${sizeClasses[size]}
    ${error ? 'border-red-300' : 'border-gray-300'}
    ${fullWidth ? 'w-full' : 'w-auto'}
    ${className}
  `.trim();

  return (
    <div className={`${fullWidth ? 'w-full' : 'inline-block'}`}>
      {label && (
        <label
          htmlFor={props.id}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          className={selectClasses}
          disabled={disabled}
          required={required}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error ? `${props.id}-error` : helper ? `${props.id}-helper` : undefined
          }
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
          <svg
            className="h-4 w-4"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
      {helper && !error && (
        <p
          id={`${props.id}-helper`}
          className="mt-1 text-sm text-gray-500"
        >
          {helper}
        </p>
      )}
      {error && (
        <p
          id={`${props.id}-error`}
          className="mt-1 text-sm text-red-600"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

Select.propTypes = {
  label: PropTypes.string,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
      disabled: PropTypes.bool
    })
  ).isRequired,
  error: PropTypes.string,
  helper: PropTypes.string,
  fullWidth: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  id: PropTypes.string
};

export default Select;

// Example usage:
/*
import Select from './Select';

const options = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3', disabled: true }
];

// Basic select
<Select
  id="basic-select"
  label="Select Option"
  options={options}
  placeholder="Choose an option"
/>

// With helper text
<Select
  id="select-with-helper"
  label="Category"
  options={options}
  helper="Select a category from the list"
/>

// With error
<Select
  id="select-with-error"
  label="Priority"
  options={options}
  error="Please select a priority"
/>

// Different sizes
<Select size="small" options={options} />
<Select size="medium" options={options} />
<Select size="large" options={options} />

// Full width
<Select fullWidth options={options} />

// Disabled
<Select disabled options={options} />

// Required
<Select
  required
  label="Required Field"
  options={options}
/>

// With custom class
<Select
  className="custom-select"
  options={options}
/>
*/
