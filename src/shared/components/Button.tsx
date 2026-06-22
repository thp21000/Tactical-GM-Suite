import clsx from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export function Button({ children, className, ...props }: ButtonProps) {
  return (
    <button className={clsx("button", className)} type="button" {...props}>
      {children}
    </button>
  );
}
