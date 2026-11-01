
import { CalendarDays, Tag } from 'lucide-react';

function formatAmount(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) return '—';

  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(value) {
  if (!value) return '—';

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString();
}

export default function TransactionCard({ transaction }) {
  if (!transaction) return null;

  const isIncome = transaction.type === 'income';

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-gray-900">
            {transaction.title || 'Untitled transaction'}
          </h3>

          <span
            className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
              isIncome
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {isIncome ? 'Income' : 'Expense'}
          </span>
        </div>

        <p
          className={`whitespace-nowrap text-right font-bold ${
            isIncome ? 'text-green-700' : 'text-red-600'
          }`}
        >
          {isIncome ? '+' : '-'}
          {formatAmount(transaction.amount)}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-gray-100 pt-3 text-sm text-gray-500">
        <span className="inline-flex items-center gap-1.5">
          <Tag size={15} aria-hidden="true" />
          {transaction.category || '—'}
        </span>

        <span className="inline-flex items-center gap-1.5">
          <CalendarDays size={15} aria-hidden="true" />
          {formatDate(transaction.date)}
        </span>
      </div>
    </article>
  );
}
