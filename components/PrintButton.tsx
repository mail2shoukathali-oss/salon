"use client";

type PrintButtonProps = {
  className?: string;
};

export function PrintButton({ className = "" }: PrintButtonProps) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={className}
    >
      Print
    </button>
  );
}
