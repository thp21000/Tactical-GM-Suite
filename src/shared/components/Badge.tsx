import clsx from "clsx";
import type { ReactNode } from "react";
export function Badge({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "success" | "warning" | "danger" }) { return <span className={clsx("badge", `badge--${tone}`)}>{children}</span>; }
