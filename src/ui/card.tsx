import React from 'react';
import { cn } from './cn';

export type CardProps = React.HTMLAttributes<HTMLDivElement>;

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('ui-card', className)} {...props} />
  )
);

Card.displayName = 'Card';
