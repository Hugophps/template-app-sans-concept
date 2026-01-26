import React from 'react';
import { cn } from './cn';

export type SelectOption = {
  value: string;
  label: string;
};

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, options, id, ...props }, ref) => {
    const selectId = id ?? props.name;

    return (
      <label className="ui-field">
        {label ? <span className="ui-field__label">{label}</span> : null}
        <select ref={ref} id={selectId} className={cn('ui-select', className)} {...props}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    );
  }
);

Select.displayName = 'Select';
