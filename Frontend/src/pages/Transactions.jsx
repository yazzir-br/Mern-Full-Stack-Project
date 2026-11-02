
import { useCallback, useEffect, useMemo, useState } from 'react';

import apiClient from '../lib/api/apiClient.js';
import TransactionForm from '../components/transactions/TransactionForm.jsx';
import TransactionList from '../components/transactions/TransactionList.jsx';

const SERVER_PAGE_SIZE = 100;
const CLIENT_PAGE_SIZE = 10;

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);


  // search filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const firstResponse = await apiClient.get('/transactions', {
        params: { page: 1, limit: SERVER_PAGE_SIZE },
      });

      const firstData = firstResponse.data?.data;
      const totalPages = Number(
        firstResponse.data?.pagination?.totalPages ?? 1
      );

      if (!Array.isArray(firstData)) {
        throw new Error('Invalid transactions response from server.');
      }

      if (!Number.isInteger(totalPages) || totalPages < 1) {
        throw new Error('Invalid pagination information from server.');
      }

      const allTransactions = [...firstData];

      for (let page = 2; page <= totalPages; page += 1) {
        const response = await apiClient.get('/transactions', {
          params: {
            page,
            limit: SERVER_PAGE_SIZE,
          },
        });

        if (!Array.isArray(response.data?.data)) {
          throw new Error(
            `Invalid transactions response on backend page ${page}.`
          );
        }

        allTransactions.push(...response.data.data);
      }

      setTransactions(allTransactions);
      return true;
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Unable to load transactions. Please try again.'
      );
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const categories = useMemo(() => {
    return [
      ...new Set(
        transactions
          .map((transaction) => transaction.category)
          .filter(
            (category) =>
              typeof category === 'string' && category.trim() !== ''
          )
      ),
    ].sort((a, b) => a.localeCompare(b));
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return transactions.filter((transaction) => {
      const title = String(transaction.title ?? '').toLowerCase();
      const category = String(transaction.category ?? '').toLowerCase();
      const type = String(transaction.type ?? '').toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        title.includes(normalizedSearch) ||
        category.includes(normalizedSearch);

      const matchesType =
        typeFilter === 'all' || type === typeFilter;

      const matchesCategory =
        categoryFilter === 'all' ||
        transaction.category === categoryFilter;

      const transactionDate = transaction.date
        ? String(transaction.date).slice(0, 10)
        : '';

      const matchesDate =
        !dateFilter || transactionDate === dateFilter;

      return (
        matchesSearch &&
        matchesType &&
        matchesCategory &&
        matchesDate
      );
    });
  }, [
    transactions,
    search,
    typeFilter,
    categoryFilter,
    dateFilter,
  ]);

  const totalClientPages = Math.max(
    1,
    Math.ceil(filteredTransactions.length / CLIENT_PAGE_SIZE)
  );

  const safeCurrentPage = Math.min(currentPage, totalClientPages);

  const visibleTransactions = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * CLIENT_PAGE_SIZE;

    return filteredTransactions.slice(
      startIndex,
      startIndex + CLIENT_PAGE_SIZE
    );
  }, [filteredTransactions, safeCurrentPage]);

  function resetFilters() {
    setSearch('');
    setTypeFilter('all');
    setCategoryFilter('all');
    setDateFilter('');
    setCurrentPage(1);
  }

  function handleCreate() {
    setSelectedTransaction(null);
    setSuccess('');
    setError('');
    setShowForm(true);
  }

  function handleEdit(transaction) {
    if (!transaction?._id) {
      setError('Cannot edit this transaction: its ID is missing.');
      return;
    }

    setSelectedTransaction(transaction);
    setSuccess('');
    setError('');
    setShowForm(true);
  }

  async function handleSubmit(payload) {
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      if (selectedTransaction) {
        const id = selectedTransaction._id;

        if (!id || !/^[a-f\d]{24}$/i.test(id)) {
          throw new Error('Invalid transaction ID.');
        }

        await apiClient.put(
          `/transactions/${encodeURIComponent(id)}`,
          payload
        );

        setSuccess('Transaction updated successfully.');
      } else {
        await apiClient.post('/transactions', payload);
        setSuccess('Transaction created successfully.');
      }

      setShowForm(false);
      setSelectedTransaction(null);
      setCurrentPage(1);

      await loadTransactions();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Unable to save the transaction. Please try again.'
      );

      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(transaction) {
    if (deletingId !== null) return;

    const id = transaction?._id;

    if (!id || !/^[a-f\d]{24}$/i.test(id)) {
      setError('Cannot delete this transaction: invalid transaction ID.');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${transaction.title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(id);
    setError('');
    setSuccess('');

    try {
      await apiClient.delete(
        `/transactions/${encodeURIComponent(id)}`
      );

      setSuccess('Transaction deleted successfully.');

      if (selectedTransaction?._id === id) {
        setSelectedTransaction(null);
        setShowForm(false);
      }

      await loadTransactions();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Unable to delete the transaction. Please try again.'
      );
    } finally {
      setDeletingId(null);
    }
  }

  function handleCancel() {
    if (isSubmitting) return;

    setShowForm(false);
    setSelectedTransaction(null);
    setError('');
  }

  return (
    <main className="min-w-0 space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">
          Transactions
        </h1>

        {!showForm && (
          <button
            type="button"
            onClick={handleCreate}
            disabled={loading || deletingId !== null}
            className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add Transaction
          </button>
        )}
      </div>

      {success && (
        <p
          role="status"
          className="rounded-lg bg-green-50 p-3 text-sm text-green-700"
        >
          {success}
        </p>
      )}

      {error && (
        <div role="alert" className="space-y-3">
          <p className="text-sm text-red-600">{error}</p>

          {!loading && (
            <button
              type="button"
              onClick={loadTransactions}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Retry loading transactions
            </button>
          )}
        </div>
      )}

      {showForm && (
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-5 text-lg font-semibold text-gray-900">
            {selectedTransaction
              ? 'Edit Transaction'
              : 'Create Transaction'}
          </h2>

          <TransactionForm
            key={selectedTransaction?._id || 'new-transaction'}
            initialValues={selectedTransaction}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        </section>
      )}

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Find Transactions
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Search and filters are applied to the loaded dataset.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label
              htmlFor="transaction-search"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Search
            </label>
            <input
              id="transaction-search"
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search title or category"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
            />
          </div>

          <div>
            <label
              htmlFor="transaction-type"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Type
            </label>
            <select
              id="transaction-type"
              value={typeFilter}
              onChange={(event) => {
                setTypeFilter(event.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="all">All types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="transaction-category"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Category
            </label>
            <select
              id="transaction-category"
              value={categoryFilter}
              onChange={(event) => {
                setCategoryFilter(event.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="transaction-date"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Date
            </label>
            <input
              id="transaction-date"
              type="date"
              value={dateFilter}
              onChange={(event) => {
                setDateFilter(event.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-600" aria-live="polite">
            {loading
              ? 'Loading transactions...'
              : `${filteredTransactions.length} matching transaction(s)`}
          </p>

          <button
            type="button"
            onClick={resetFilters}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Clear filters
          </button>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Your Transactions
        </h2>

        <TransactionList
          transactions={visibleTransactions}
          isLoading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {!loading && filteredTransactions.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-600">
              Page {safeCurrentPage} of {totalClientPages}
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={safeCurrentPage <= 1}
                onClick={() =>
                  setCurrentPage((page) => Math.max(1, page - 1))
                }
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <button
                type="button"
                disabled={safeCurrentPage >= totalClientPages}
                onClick={() =>
                  setCurrentPage((page) =>
                    Math.min(totalClientPages, page + 1)
                  )
                }
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
