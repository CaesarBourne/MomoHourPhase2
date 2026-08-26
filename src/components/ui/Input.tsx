import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes } from 'react';

interface FieldWrapperProps {
  label?: string;
  hint?: string;
  error?: string;
  htmlFor?: string;
  children: React.ReactNode;
}

export function Field({ label, hint, error, htmlFor, children }: FieldWrapperProps) {
  return (
    <label htmlFor={htmlFor} className="block">
      {label && (
        <span className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
          {label}
        </span>
      )}
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-red-600 dark:text-red-400">{error}</span>}
    </label>
  );
}

const baseFieldClasses =
  'block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:cursor-not-allowed disabled:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:disabled:bg-slate-900';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...rest }, ref) => (
    <input ref={ref} className={`${baseFieldClasses} ${className}`} {...rest} />
  )
);
Input.displayName = 'Input';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className = '', children, ...rest }, ref) => (
    <select ref={ref} className={`${baseFieldClasses} ${className}`} {...rest}>
      {children}
    </select>
  )
);
Select.displayName = 'Select';
