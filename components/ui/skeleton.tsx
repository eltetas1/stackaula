import * as React from "react";

type Props = React.HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className = "", ...props }: Props) {
  return (
    <div
      className={`animate-pulse rounded-md bg-gray-200 dark:bg-gray-700 ${className}`}
      {...props}
    />
  );
}
