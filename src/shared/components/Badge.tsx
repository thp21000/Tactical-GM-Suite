import clsx from "clsx";
import type { ReactNode } from "react";

type BadgeProps = {
  children: ReactNode;
  tone?: "default" | "success" | "warning" | "danger";
};

export function Badge({ children, tone = "default" }: BadgeProps) {
  return <span className={clsx("badge", `badge--${tone}`)}>{children}</span>;
}
