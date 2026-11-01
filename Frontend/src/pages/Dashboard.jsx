
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, RefreshCw } from 'lucide-react';

import apiClient from '../lib/api/apiClient.js';
import DashboardWelcome from '../components/dashboard/DashboardWelcome.jsx';
import DashboardHeader from '../components/dashboard/DashboardHeader.jsx';
import CardStatus from '../components/dashboard/CardStatus.jsx';
import FinanceChart from '../components/dashboard/FinanceChart.jsx';

const PAGE_SIZE = 100;
const RECENT_LIMIT = 5;

function getMonthKey(date) {
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, '0')}`;
}

function getLastSixMonths() {
  const months = [];
  const now = new Date();

  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(
      now.getFullYear(),
      now.getMonth() - offset,
      1
    );

    months.push({
      key: getMonthKey(date),
      label: date.toLocaleDateString(undefined, {
        month: 'short',
        year: '2-digit',
      }),
    });
  }

  return months;
}

function formatAmount(value) {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value) {
  if (!value) return 'Date unavailable';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Date unavailable';
  }

  return date.toLocaleDateString();
}

async function fetchAllTransactions() {
  const firstResponse = await apiClient.get('/transactions', {
    params: { page: 1, limit: PAGE_SIZE },
  });

  const firstPage = firstResponse.data;

  if (!Array.isArray(firstPage?.data)) {
    throw new Error('Unexpected transactions API response.');
  }

  const transactions = [...firstPage.data];
  const totalPages = Number(firstPage?.pagination?.totalPages);

  // totalPages = 0 waa sax marka aysan jirin wax transactions ah.
  if (
    !Number.isInteger(totalPages) ||
    totalPages < 0
  ) {
    throw new Error('Invalid transaction pagination data.');
  }

  for (let page = 2; page <= totalPages; page += 1) {
    const response = await apiClient.get('/transactions', {
      params: { page, limit: PAGE_SIZE },
    });

    if (!Array.isArray(response.data?.data)) {
      throw new Error('Unexpected transactions API response.');
    }

    transactions.push(...response.data.data);
  }

  return transactions;
}

async function fetchMonthlySummary(month) {
  const response = await apiClient.get(
    '/transactions/monthly-summary',
    { params: { month } }
  );

  if (!Array.isArray(response.data?.summary)) {
    throw new Error('Unexpected monthly summary response.');
  }

  return response.data;
}

function summarizeMonth(summary) {
  const totals = { income: 0, expenses: 0 };

  for (const item of summary.summary) {
    const type = item?._id?.type;
    const amount = Number(item?.totalAmount);

    if (!Number.isFinite(amount) || amount < 0) {
      throw new Error('Invalid amount in monthly summary.');
    }

    if (type === 'income') {
      totals.income += amount;
    } else if (type === 'expense') {
      totals.expenses += amount;
    } else {
      throw new Error('Unexpected transaction type in summary.');
    }
  }

  return totals;
}

function validateTransaction(transaction) {
  return (
    transaction &&
    typeof transaction === 'object' &&
    typeof transaction._id === 'string' &&
    ['income', 'expense'].includes(transaction.type) &&
    typeof transaction.title === 'string' &&
    Number.isFinite(Number(transaction.amount)) &&
    Number(transaction.amount) > 0 &&
    transaction.date &&
    !Number.isNaN(new Date(transaction.date).getTime())
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const months = getLastSixMonths();

      const [transactions, summaries] = await Promise.all([
        fetchAllTransactions(),
        Promise.all(
          months.map(({ key }) => fetchMonthlySummary(key))
        ),
      ]);

      if (!transactions.every(validateTransaction)) {
        throw new Error('Invalid transaction data received.');
      }

      const totalIncome = transactions.reduce(
        (sum, transaction) =>
          transaction.type === 'income'
            ? sum + Number(transaction.amount)
            : sum,
        0
      );

      const totalExpenses = transactions.reduce(
        (sum, transaction) =>
          transaction.type === 'expense'
            ? sum + Number(transaction.amount)
            : sum,
        0
      );

      const monthlyData = months.map((month, index) => ({
        month: month.label,
        ...summarizeMonth(summaries[index]),
      }));

      const currentSummary = summaries[summaries.length - 1];
      const categoryTotals = new Map();

      for (const item of currentSummary.summary) {
        if (item?._id?.type !== 'expense') continue;

        const category = item._id.category;
        const amount = Number(item.totalAmount);

        if (
          typeof category !== 'string' ||
          !category.trim() ||
          !Number.isFinite(amount) ||
          amount < 0
        ) {
          throw new Error('Invalid category summary data.');
        }

        categoryTotals.set(
          category,
          (categoryTotals.get(category) || 0) + amount
        );
      }

      const categoryData = Array.from(
        categoryTotals,
        ([category, amount]) => ({ category, amount })
      );

      const recentTransactions = [...transactions]
        .sort(
          (a, b) =>
            new Date(b.date).getTime() -
            new Date(a.date).getTime()
        )
        .slice(0, RECENT_LIMIT);

      setData({
        totalBalance: totalIncome - totalExpenses,
        totalIncome,
        totalExpenses,
        monthlyData,
        categoryData,
        recentTransactions,
      });
    } catch (err) {
      setError(
        err?.message ||
          'Unable to load dashboard data. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (loading && !data) {
    return (
      <main
        className="space-y-6 p-4 sm:p-6 lg:p-8"
        aria-live="polite"
      >
        <p className="text-sm text-gray-500">
          Loading dashboard...
        </p>
      </main>
    );
  }

  if (error && !data) {
    return (
      <main className="space-y-4 p-4 sm:p-6 lg:p-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Dashboard
        </h1>

        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>

        <button
          type="button"
          onClick={loadDashboard}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            size={16}
            aria-hidden="true"
            className={loading ? 'animate-spin' : ''}
          />
          Try again
        </button>
      </main>
    );
  }

  if (!data) return null;

  return (
    <main className="min-w-0 space-y-6 p-4 sm:p-6 lg:p-8">
      <DashboardHeader
        title="Dashboard"
        actions={
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={loadDashboard}
              disabled={loading}
              aria-label="Refresh dashboard"
              className="inline-flex items-center justify-center rounded-lg border border-gray-200 p-2.5 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              <RefreshCw
                size={18}
                aria-hidden="true"
                className={loading ? 'animate-spin' : ''}
              />
            </button>

            <Link
              to="/transactions"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-700"
            >
              <Plus size={18} aria-hidden="true" />
              Add Transaction
            </Link>
          </div>
        }
      />

      {error && (
        <p role="alert" className="text-sm text-red-600">
          Dashboard refresh failed: {error}
        </p>
      )}

      <DashboardWelcome />

      <section
        aria-label="Financial summary"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        <CardStatus
          title="Total Balance"
          amount={formatAmount(data.totalBalance)}
          type="balance"
        />

        <CardStatus
          title="Total Income"
          amount={formatAmount(data.totalIncome)}
          type="income"
        />

        <CardStatus
          title="Total Expenses"
          amount={formatAmount(data.totalExpenses)}
          type="expenses"
        />
      </section>

      <section
        aria-label="Financial charts"
        className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-2"
      >
        <FinanceChart
          title="Monthly Income vs Expenses"
          type="monthly"
          data={data.monthlyData}
        />

        <FinanceChart
          title="Spending by Category (Current Month)"
          type="category"
          data={data.categoryData}
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Transactions
          </h2>

          <Link
            to="/transactions"
            className="text-sm font-medium text-gray-700 hover:underline"
          >
            View all
          </Link>
        </div>

        {data.recentTransactions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-gray-500">
              No transactions yet.
            </p>

            <Link
              to="/transactions"
              className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-gray-900 hover:underline"
            >
              <Plus size={16} aria-hidden="true" />
              Add your first transaction
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th scope="col" className="px-5 py-3 font-medium">
                    Transaction
                  </th>
                  <th scope="col" className="px-5 py-3 font-medium">
                    Category
                  </th>
                  <th scope="col" className="px-5 py-3 font-medium">
                    Date
                  </th>
                  <th
                    scope="col"
                    className="px-5 py-3 text-right font-medium"
                  >
                    Amount
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {data.recentTransactions.map((transaction) => (
                  <tr key={transaction._id}>
                    <td className="px-5 py-4 font-medium text-gray-900">
                      {transaction.title}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {transaction.category || 'Uncategorized'}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {formatDate(transaction.date)}
                    </td>

                    <td
                      className={`whitespace-nowrap px-5 py-4 text-right font-semibold ${
                        transaction.type === 'income'
                          ? 'text-green-700'
                          : 'text-red-600'
                      }`}
                    >
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatAmount(Number(transaction.amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
