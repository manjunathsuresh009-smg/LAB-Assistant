import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "../../lib/format";

interface FieldShellProps {
  id: string;
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

function FieldShell({ id, label, error, hint, required, children, className }: FieldShellProps) {
  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label htmlFor={id} className="label">
          {label}
          {required && <span className="ml-0.5 text-gold">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs font-medium text-danger">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, className, containerClassName, id, required, ...props },
  ref
) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  return (
    <FieldShell
      id={fieldId}
      label={label}
      error={error}
      hint={hint}
      required={required}
      className={containerClassName}
    >
      <input
        ref={ref}
        id={fieldId}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        className={cn("field", error && "border-danger/60 focus:border-danger", className)}
        {...props}
      />
    </FieldShell>
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, className, containerClassName, id, required, ...props },
  ref
) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  return (
    <FieldShell
      id={fieldId}
      label={label}
      error={error}
      hint={hint}
      required={required}
      className={containerClassName}
    >
      <textarea
        ref={ref}
        id={fieldId}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        className={cn("field min-h-[110px] resize-y", error && "border-danger/60", className)}
        {...props}
      />
    </FieldShell>
  );
});

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, className, containerClassName, id, required, children, ...props },
  ref
) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  return (
    <FieldShell
      id={fieldId}
      label={label}
      error={error}
      hint={hint}
      required={required}
      className={containerClassName}
    >
      <select
        ref={ref}
        id={fieldId}
        required={required}
        aria-invalid={Boolean(error)}
        className={cn("field appearance-none", error && "border-danger/60", className)}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  );
});
