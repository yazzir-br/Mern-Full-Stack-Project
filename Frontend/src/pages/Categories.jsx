
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';

import apiClient from '../lib/api/apiClient.js';
import CategoryCard from '../components/categories/CategoryCard.jsx';

const SERVER_PAGE_SIZE = 100;

const CATEGORY_LABELS = [
  'Food',
  'Transport',
  'Bills',
  'Health',
  'Shopping',
  'Entertainment',
  'Work',
  'Other'
];

function normalizeCategory(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function formatAmount(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return '—';
  }

  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

function formatDate(value) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleDateString();
}

function TransactionDetails({ transactions }) {
  if (transactions.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
        <h3 className="font-semibold text-gray-900">
          No transactions in this category
        </h3>

        <p className="mt-2 text-sm text-gray-500">
          There are currently no transactions belonging to this category.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th scope="col" className="px-5 py-3 font-medium">
                Title
              </th>

              <th scope="col" className="px-5 py-3 font-medium">
                Type
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
            {transactions.map((transaction, index) => {
              const isIncome = transaction.type === 'income';

              return (
                <tr
                  key={
                    transaction._id ??
                    `${transaction.title}-${transaction.date}-${index}`
                  }
                >
                  <td className="px-5 py-4 font-medium text-gray-900">
                    {transaction.title || 'Untitled transaction'}
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
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Categories() {
  const [transactions, setTransactions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const firstResponse = await apiClient.get('/transactions', {
        params: {
          page: 1,
          limit: SERVER_PAGE_SIZE
        }
      });

      const firstData = firstResponse.data?.data;
      const totalPages = Number(
        firstResponse.data?.pagination?.totalPages ?? 0
      );

      if (!Array.isArray(firstData)) {
        throw new Error(
          'Invalid transactions response from server.'
        );
      }


      if (!Number.isInteger(totalPages) || totalPages < 0) {
        throw new Error(
          'Invalid pagination information from server.'
        );
      }

      const allTransactions = [...firstData];


      for (let page = 2; page <= totalPages; page += 1) {
        const response = await apiClient.get('/transactions', {
          params: {
            page,
            limit: SERVER_PAGE_SIZE
          }
        });

        const pageData = response.data?.data;

        if (!Array.isArray(pageData)) {
          throw new Error(
            `Invalid transactions response on page ${page}.`
          );
        }

        allTransactions.push(...pageData);
      }

      setTransactions(allTransactions);
    } catch (err) {
      setError(
        err?.message ||
          'Unable to load transactions. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const actualCategories = useMemo(() => {
    return new Set(
      transactions
        .map((transaction) => normalizeCategory(transaction.category))
        .filter(Boolean)
    );
  }, [transactions]);

  const selectedTransactions = useMemo(() => {
    if (!selectedCategory) {
      return [];
    }

    const selectedValue = normalizeCategory(selectedCategory);

    return transactions
      .filter(
        (transaction) =>
          normalizeCategory(transaction.category) === selectedValue
      )
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();

        const safeA = Number.isFinite(dateA) ? dateA : 0;
        const safeB = Number.isFinite(dateB) ? dateB : 0;

        return safeB - safeA;
      });
  }, [transactions, selectedCategory]);

  return (
    <main className="min-w-0 space-y-6 p-4 sm:p-6 lg:p-8">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">
          Categories
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Browse your categories and view their transactions.
        </p>
      </header>

      {loading && (
        <div
          role="status"
          className="rounded-xl border border-gray-200 bg-white p-8 text-center"
        >
          <p className="text-sm text-gray-500">
            Loading your transactions...
          </p>
        </div>
      )}

      {!loading && error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4"
        >
          <p className="text-sm text-red-700">{error}</p>

          <button
            type="button"
            onClick={loadTransactions}
            disabled={loading}
            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
          >
            <RefreshCw size={16} aria-hidden="true" />
            Retry
          </button>
        </div>
      )}

      {!loading && !error && !selectedCategory && (
        <section aria-label="Available categories">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              All Categories
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Select a category to view its transactions.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORY_LABELS.map((category) => (
              <CategoryCard
                key={category}
                category={category}
                onClick={setSelectedCategory}
              />
            ))}
          </div>

          {transactions.length === 0 && (
            <div className="mt-5 rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="font-medium text-gray-900">
                No transactions yet
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Your categories are ready. Once you create transactions,
                their details will appear here.
              </p>
            </div>
          )}

          {transactions.length > 0 &&
            !CATEGORY_LABELS.some((category) =>
              actualCategories.has(normalizeCategory(category))
            ) && (
              <p className="mt-5 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
                Your existing transactions do not use these eight
                category names. Check that the category names saved in
                your transactions match the categories displayed here.
              </p>
            )}
        </section>
      )}

      {!loading && !error && selectedCategory && (
        <section className="space-y-5">
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back to Categories
          </button>

          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {selectedCategory}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Transactions in this category
            </p>
          </div>

          <TransactionDetails transactions={selectedTransactions} />
        </section>
      )}
    </main>
  );
}
