
export default function DashboardHeader({
  title = 'Dashboard',
  actions = null,
}) {
  return (
    <header className="flex w-full flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          {title}
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage your finances in one place.
        </p>
      </div>

      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          {actions}
        </div>
      )}
    </header>
  );
}
