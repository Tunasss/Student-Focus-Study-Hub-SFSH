// Empty-shell page for features delivered in later WBS items.
export function PlaceholderPage({ title, description }) {
  return (
    <section>
      <h1 className="text-2xl font-semibold">{title}</h1>
      <div className="mt-6 rounded-xl border border-dashed border-border bg-surface p-8 text-center text-muted">
        {description}
      </div>
    </section>
  );
}
