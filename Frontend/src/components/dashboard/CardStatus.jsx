
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';

const iconMap = {
  balance: Wallet,
  income: TrendingUp,
  expenses: TrendingDown,
};

export default function CardStatus({
  title,
  amount,
  type = 'balance',
}) {
  const Icon = iconMap[type] || Wallet;

  return (
    <section
      aria-label={title}
      className="w-full rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-sm font-medium text-gray-500">
            {title}
          </h2>

          <p className="mt-3 break-words text-2xl font-bold text-gray-900 sm:text-3xl">
            {amount}
          </p>
        </div>

        <div
          className="shrink-0 rounded-xl bg-gray-100 p-3 text-gray-700"
          aria-hidden="true"
        >
          <Icon size={24} strokeWidth={2} />
        </div>
      </div>
    </section>
  );
}
