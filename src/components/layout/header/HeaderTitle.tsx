
interface HeaderTitleProps {
  title?: string;
  subtitle?: string;
}

export function HeaderTitle({ title, subtitle }: HeaderTitleProps) {
  if (!title) return null;

  return (
    <div className="flex flex-col">
      <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      {subtitle && (
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}
