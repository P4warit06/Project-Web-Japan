import { LinkButton } from "./button";

/** A line that has not started yet: hollow ring, dashed segment. Invites one action. */
export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: { href: string; label: string };
}) {
  return (
    <section className="flex flex-col items-start gap-1 rounded-[var(--radius-sheet)] border border-dashed border-rule px-5 py-8 sm:items-center sm:text-center">
      <svg viewBox="0 0 24 56" width="24" height="56" aria-hidden="true" focusable="false" className="mb-2 text-soft">
        <circle cx="12" cy="9" r="6.5" fill="none" stroke="currentColor" strokeWidth="3.5" />
        <path d="M12 20v8M12 33v4M12 42v3" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      </svg>
      <h2 className="voice text-xl font-semibold">{title}</h2>
      <p className="max-w-[28rem] text-soft">{body}</p>
      {action && (
        <LinkButton href={action.href} className="mt-3">
          {action.label}
        </LinkButton>
      )}
    </section>
  );
}
