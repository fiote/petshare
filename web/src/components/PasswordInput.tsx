import { useId, useState } from 'react';
import type { InputHTMLAttributes } from 'react';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  showLabel: string;
  hideLabel: string;
};

export function PasswordInput({ showLabel, hideLabel, id, ...inputProps }: Props) {
  const [visible, setVisible] = useState(false);
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className="password-input">
      <input id={inputId} type={visible ? 'text' : 'password'} {...inputProps} />
      <button
        type="button"
        className="password-input__toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? hideLabel : showLabel}
        aria-pressed={visible}
        tabIndex={-1}
      >
        {visible ? (
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 3l18 18M10.58 10.58a2 2 0 0 0 2.83 2.83M9.36 5.32A9.77 9.77 0 0 1 12 5c5 0 9 4.5 9.99 7-.32.82-.85 1.75-1.56 2.67M6.6 6.6C4.4 8.02 2.7 10.06 2.01 12c.99 2.5 4.99 7 9.99 7 1.29 0 2.5-.29 3.6-.79"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.01 12C3 9.5 7 5 12 5s9 4.5 9.99 7c-.99 2.5-4.99 7-9.99 7s-9-4.5-9.99-7Z"
            />
            <circle cx="12" cy="12" r="2.8" fill="none" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        )}
      </button>
    </div>
  );
}
