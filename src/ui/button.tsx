import React from 'react';
import { cn } from './cn';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const styles = {
  base: 'ui-button',
  variants: {
    primary: 'ui-button--primary',
    secondary: 'ui-button--secondary',
    outline: 'ui-button--outline',
    ghost: 'ui-button--ghost'
  },
  sizes: {
    sm: 'ui-button--sm',
    md: 'ui-button--md',
    lg: 'ui-button--lg'
  }
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(styles.base, styles.variants[variant], styles.sizes[size], className)}
      {...props}
    />
  )
);

Button.displayName = 'Button';
