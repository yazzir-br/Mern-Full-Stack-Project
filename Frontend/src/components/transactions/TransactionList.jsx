
import { Pencil, Trash2 } from 'lucide-react';

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

export default function TransactionList({
  transactions = [],
  onEdit,
  onDelete,
  isLoading = false,
}) {
  if (isLoading) {
    return (
      <p className="p-6 text-center text-sm text-gray-500">
        Loading transactions...
      </p>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
        <p className="font-medium text-gray-900">
          No transactions found
        </p>
        <p className="mt-1 text-sm text-gray-500">
          Add a transaction to see it here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-5 py-3 font-medium">Title</th>
              <th className="px-5 py-3 font-medium">Category</th>
              <th className="px-5 py-3 font-medium">Type</th>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 text-right font-medium">
                Amount
              </th>
              <th className="px-5 py-3 text-right font-medium">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {transactions.map((transaction) => {
              const isIncome = transaction.type === 'income';

              return (
                <tr key={transaction._id}>
                  <td className="px-5 py-4 font-medium text-gray-900">
                    {transaction.title}
                  </td>

                  <td className="px-5 py-4 text-gray-600">
                    {transaction.category || '—'}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        isIncome
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {isIncome ? 'Income' : 'Expense'}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                    {formatDate(transaction.date)}
                  </td>

                  <td
                    className={`whitespace-nowrap px-5 py-4 text-right font-semibold ${
                      isIncome ? 'text-green-700' : 'text-red-600'
                    }`}
                  >
                    {isIncome ? '+' : '-'}
                    {formatAmount(transaction.amount)}
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit?.(transaction)}
                        disabled={!onEdit}
                        aria-label={`Edit ${transaction.title}`}
                        className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                      >
                        <Pencil size={16} aria-hidden="true" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete?.(transaction)}
                        disabled={!onDelete}
                        aria-label={`Delete ${transaction.title}`}
                        className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-40"
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
