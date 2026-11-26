import { BackLink } from "./back-link";

export function PageHeader({
  title,
  back,
  actions,
  children,
}: {
  title: string;
  back?: { href: string; label: string };
  actions?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <header className="mb-6">
      {back && <BackLink href={back.href} label={back.label} />}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <h1 className="voice min-w-0 text-[1.75rem] leading-[1.35] font-semibold [overflow-wrap:anywhere]">
          {title}
        </h1>
        {actions}
      </div>
      {children}
    </header>
  );
}
