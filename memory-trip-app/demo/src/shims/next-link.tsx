// Stands in for "next/link" in the demo build (see vite.config.ts), so the real UI
// components can be reused unchanged. Links point at the hash route.
import type { ComponentProps } from "react";

type Props = Omit<ComponentProps<"a">, "href"> & { href: string };

export default function Link({ href, children, ...rest }: Props) {
  return (
    <a href={`#${href}`} {...rest}>
      {children}
    </a>
  );
}
