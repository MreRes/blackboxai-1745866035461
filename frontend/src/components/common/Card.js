import React from 'react';
import PropTypes from 'prop-types';

const Card = ({
  title,
  subtitle,
  children,
  footer,
  actions,
  noPadding = false,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = '',
  onClick,
  hoverable = false
}) => {
  const baseClasses = 'bg-white rounded-lg shadow';
  const hoverClasses = hoverable ? 'transition-transform duration-200 hover:scale-[1.02] cursor-pointer' : '';
  const combinedClasses = `${baseClasses} ${hoverClasses} ${className}`;

  return (
    <div
      className={combinedClasses}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Header */}
      {(title || subtitle || actions) && (
        <div className={`px-6 py-4 border-b ${headerClassName}`}>
          <div className="flex justify-between items-start">
            <div>
              {title && (
                typeof title === 'string' ? (
                  <h3 className="text-lg font-semibold text-gray-800">
                    {title}
                  </h3>
                ) : title
              )}
              {subtitle && (
                typeof subtitle === 'string' ? (
                  <p className="mt-1 text-sm text-gray-600">
                    {subtitle}
                  </p>
                ) : subtitle
              )}
            </div>
            {actions && (
              <div className="flex items-center space-x-4">
                {actions}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Body */}
      <div className={`${noPadding ? '' : 'p-6'} ${bodyClassName}`}>
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <div className={`px-6 py-4 border-t bg-gray-50 rounded-b-lg ${footerClassName}`}>
          {footer}
        </div>
      )}
    </div>
  );
};

Card.propTypes = {
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  subtitle: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  children: PropTypes.node.isRequired,
  footer: PropTypes.node,
  actions: PropTypes.node,
  noPadding: PropTypes.bool,
  className: PropTypes.string,
  headerClassName: PropTypes.string,
  bodyClassName: PropTypes.string,
  footerClassName: PropTypes.string,
  onClick: PropTypes.func,
  hoverable: PropTypes.bool
};

// Card.Header component for custom headers
Card.Header = ({ children, className = '' }) => (
  <div className={`px-6 py-4 border-b ${className}`}>
    {children}
  </div>
);

Card.Header.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

// Card.Body component for custom bodies
Card.Body = ({ children, className = '', noPadding = false }) => (
  <div className={`${noPadding ? '' : 'p-6'} ${className}`}>
    {children}
  </div>
);

Card.Body.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  noPadding: PropTypes.bool
};

// Card.Footer component for custom footers
Card.Footer = ({ children, className = '' }) => (
  <div className={`px-6 py-4 border-t bg-gray-50 rounded-b-lg ${className}`}>
    {children}
  </div>
);

Card.Footer.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

export default Card;

// Example usage:
/*
import Card from './Card';

// Basic usage
<Card
  title="Card Title"
  subtitle="Card subtitle"
  footer={<div>Footer content</div>}
>
  <p>Card content goes here...</p>
</Card>

// With actions
<Card
  title="Card with Actions"
  actions={
    <button className="text-indigo-600 hover:text-indigo-800">
      Action
    </button>
  }
>
  <p>Content with actions...</p>
</Card>

// Hoverable card
<Card
  hoverable
  onClick={() => console.log('Card clicked')}
  title="Clickable Card"
>
  <p>Click me!</p>
</Card>

// Custom layout using sub-components
<Card>
  <Card.Header>
    <div className="flex justify-between items-center">
      <h3>Custom Header</h3>
      <button>Action</button>
    </div>
  </Card.Header>
  <Card.Body>
    <p>Custom body content...</p>
  </Card.Body>
  <Card.Footer>
    <div className="flex justify-end">
      <button>Footer Button</button>
    </div>
  </Card.Footer>
</Card>

// Card with custom styles
<Card
  className="border-2 border-indigo-500"
  headerClassName="bg-indigo-50"
  bodyClassName="bg-gray-50"
  footerClassName="bg-indigo-50"
  title="Styled Card"
>
  <p>Content with custom styles...</p>
</Card>
*/
