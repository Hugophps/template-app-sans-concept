import React from 'react';
import { cn } from './cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, error, id, ...props }, ref) => {
    const inputId = id ?? props.name;

    return (
      <label className="ui-field">
        {label ? <span className="ui-field__label">{label}</span> : null}
        <input
          ref={ref}
          id={inputId}
          className={cn('ui-input', error ? 'ui-input--error' : undefined, className)}
          {...props}
        />
        {error ? (
          <span className="ui-field__error">{error}</span>
        ) : hint ? (
          <span className="ui-field__hint">{hint}</span>
        ) : null}
      </label>
    );
  }
);

Input.displayName = 'Input';
