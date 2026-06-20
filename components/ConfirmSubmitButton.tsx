"use client";

import type { ReactNode } from "react";

type ConfirmSubmitButtonProps = {
  confirmMessage: string;
  children: ReactNode;
  className?: string;
};

export function ConfirmSubmitButton({
  confirmMessage,
  children,
  className = "",
}: ConfirmSubmitButtonProps) {
  return (
    <button
      type="submit"
      onClick={(event) => {
        if (!confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
      className={className}
    >
      {children}
    </button>
  );
}
