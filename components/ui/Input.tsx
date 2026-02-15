import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Input({ className, ...props }: InputProps) {
  const classes = ['input', className].filter(Boolean).join(' ');

  return <input className={classes} {...props} />;
}
