// Rule 7 made visible: whenever the backend response carries mode "MOCK", a
// prominent badge says so, so nobody — a judge included — mistakes a fixture
// for a live model call.
export function MockBadge({ mode }: { mode: string }) {
  const isMock = mode !== "live";
  return (
    <span
      role="status"
      className={
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide " +
        (isMock
          ? "bg-amber-400 text-amber-950 ring-2 ring-amber-300"
          : "bg-emerald-500 text-emerald-950 ring-2 ring-emerald-300")
      }
    >
      <span
        aria-hidden
        className={"h-2 w-2 rounded-full " + (isMock ? "bg-amber-900" : "bg-emerald-900")}
      />
      {isMock ? "MOCK — fixture, not a live model call" : "LIVE model response"}
    </span>
  );
}
