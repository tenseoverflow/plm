import clsx from "classnames";
import type React from "react";

type Props = React.HTMLAttributes<HTMLDivElement> & { subtle?: boolean };

export default function Card({ subtle = false, className, ...props }: Props) {
  return (
    <div
      className={clsx(
        "rounded-xl border bg-white dark:bg-neutral-950",
        subtle
          ? "border-neutral-200 dark:border-neutral-800"
          : "border-neutral-300 dark:border-neutral-700",
        className,
      )}
      {...props}
    />
  );
}
