import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';

const Input = forwardRef(({
  type = 'text',
  label,
  error,
  helper,
  fullWidth = false,
  size = 'medium',
  disabled = false,
  required = false,
  className = '',
  ...props
}, ref) => {
  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-4 py-3 text-lg'
  };

  const inputClasses = `
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
      <input
        ref={ref}
        type={type}
        className={inputClasses}
        disabled={disabled}
        required={required}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={
          error ? `${props.id}-error` : helper ? `${props.id}-helper` : undefined
        }
        {...props}
      />
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

Input.displayName = 'Input';

Input.propTypes = {
  type: PropTypes.string,
  label: PropTypes.string,
  error: PropTypes.string,
  helper: PropTypes.string,
  fullWidth: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  className: PropTypes.string,
  id: PropTypes.string
};

export default Input;
