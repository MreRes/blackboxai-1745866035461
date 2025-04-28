import React from 'react';
import PropTypes from 'prop-types';
import LoadingSpinner from './LoadingSpinner';

const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  onClick,
  className = '',
  ...props
}) => {
  // Base classes
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200';

  // Size classes
  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg'
  };

  // Variant classes
  const variantClasses = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    warning: 'bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500',
    info: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    light: 'bg-gray-100 text-gray-800 hover:bg-gray-200 focus:ring-gray-500',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-indigo-500',
    link: 'text-indigo-600 hover:text-indigo-800 underline focus:ring-indigo-500'
  };

  // Disabled classes
  const disabledClasses = 'opacity-50 cursor-not-allowed';

  // Width classes
  const widthClasses = fullWidth ? 'w-full' : '';

  // Combine all classes
  const combinedClasses = `
    ${baseClasses}
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${disabled || loading ? disabledClasses : ''}
    ${widthClasses}
    ${className}
  `.trim();

  // Icon element
  const iconElement = icon && (
    <span className={`${iconPosition === 'right' ? 'ml-2' : 'mr-2'}`}>
      {icon}
    </span>
  );

  return (
    <button
      type={type}
      className={combinedClasses}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <>
          <LoadingSpinner size="small" />
          <span className="ml-2">Loading...</span>
        </>
      ) : (
        <>
          {iconPosition === 'left' && iconElement}
          {children}
          {iconPosition === 'right' && iconElement}
        </>
      )}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  variant: PropTypes.oneOf([
    'primary',
    'secondary',
    'success',
    'danger',
    'warning',
    'info',
    'light',
    'outline',
    'link'
  ]),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  fullWidth: PropTypes.bool,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  icon: PropTypes.node,
  iconPosition: PropTypes.oneOf(['left', 'right']),
  onClick: PropTypes.func,
  className: PropTypes.string
};

// Button Group Component
Button.Group = ({ children, className = '' }) => {
  return (
    <div className={`inline-flex rounded-md shadow-sm ${className}`}>
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;

        return React.cloneElement(child, {
          className: `
            ${child.props.className || ''}
            ${index === 0 ? 'rounded-r-none' : ''}
            ${index === React.Children.count(children) - 1 ? 'rounded-l-none' : ''}
            ${index !== 0 && index !== React.Children.count(children) - 1 ? 'rounded-none' : ''}
            ${index !== 0 ? '-ml-px' : ''}
          `
        });
      })}
    </div>
  );
};

Button.Group.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

export default Button;

// Example usage:
/*
import Button from './Button';

// Basic buttons
<Button>Default Button</Button>
<Button variant="secondary">Secondary Button</Button>
<Button variant="danger">Danger Button</Button>

// Sizes
<Button size="small">Small Button</Button>
<Button size="large">Large Button</Button>

// With icons
<Button
  icon={<i className="fas fa-save" />}
  variant="success"
>
  Save
</Button>

<Button
  icon={<i className="fas fa-arrow-right" />}
  iconPosition="right"
>
  Next
</Button>

// Loading state
<Button loading>Loading Button</Button>

// Full width
<Button fullWidth>Full Width Button</Button>

// Button group
<Button.Group>
  <Button>Left</Button>
  <Button>Middle</Button>
  <Button>Right</Button>
</Button.Group>

// Link style
<Button variant="link">Link Button</Button>

// Outline style
<Button variant="outline">Outline Button</Button>

// Disabled state
<Button disabled>Disabled Button</Button>

// With custom className
<Button className="custom-class">Custom Button</Button>

// Form submit button
<Button type="submit">Submit Form</Button>
*/
