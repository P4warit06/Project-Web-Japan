import Link from "next/link";

type Variant = "primary" | "secondary" | "danger" | "ghost" | "quiet-danger";

export function buttonClass(variant: Variant = "primary", extra = ""): string {
  return `btn btn-${variant} ${extra}`.trim();
}

export function LinkButton({
  href,
  variant = "primary",
  className = "",
  children,
}: {
  href: string;
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={buttonClass(variant, className)}>
      {children}
    </Link>
  );
}
