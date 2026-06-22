import type { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";
export function Button({ children, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) { return <button className={clsx("button", className)} {...props}>{children}</button>; }
