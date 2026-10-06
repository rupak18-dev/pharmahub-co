export function PageHeader({ title, description, actions, children, className = "" }) {
  return (
    <div className={`border-b border-border pb-2.5 sm:pb-4 space-y-2 sm:space-y-2.5 ${className}`}>
      <div className="flex items-center justify-between gap-2 sm:gap-3">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-2xl font-bold sm:font-semibold tracking-tight text-foreground truncate">{title}</h1>
          {description && <p className="mt-0.5 text-xs text-muted-foreground hidden sm:block">{description}</p>}
        </div>
        {actions && <div className="flex items-center justify-end gap-1.5 sm:gap-2 shrink-0">{actions}</div>}
      </div>
      {description && <p className="mt-0.5 text-[11px] text-muted-foreground sm:hidden">{description}</p>}
      {children}
    </div>
  );
}
