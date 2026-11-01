import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import apiClient from '../lib/api/apiClient';
import useAuthStore from '../lib/store/authStore';
import FinanceChart from '../components/dashboard/FinanceChart';

const formatNumber = (value) =>
  new Intl.NumberFormat().format(value);

const formatCurrency = (value) =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);

const isValidNumber = (value) =>
  typeof value === 'number' &&
  Number.isFinite(value) &&
  value >= 0;

function StatCard({ title, value, description }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">
        {title}
      </p>

      <h2 className="mt-3 text-2xl font-bold text-gray-900">
        {value}
      </h2>

      <p className="mt-2 text-xs text-gray-500">
        {description}
      </p>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  const clearAuth = useAuthStore(
    (state) => state.clearAuth
  );

  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOverview = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await apiClient.get('/admin/overview');

      const data = response.data?.data ?? response.data;

      if (!data || typeof data !== 'object') {
        throw new Error(
          'Invalid dashboard response from server.'
        );
      }

      setOverview(data);
    } catch (err) {
      if (err.status === 401) {
        localStorage.removeItem('token');
        clearAuth();
        navigate('/login', { replace: true });
        return;
      }

      if (err.status === 403) {
        setError(
          'Access denied. Your account does not have admin permissions.'
        );
        return;
      }

      setError(
        err.message || 'Unable to load admin statistics.'
      );
    } finally {
      setLoading(false);
    }
  }, [clearAuth, navigate]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <p
          role="status"
          aria-live="polite"
          className="text-gray-500"
        >
          Loading admin dashboard...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5">
        <p className="font-medium text-red-700">
          Failed to load dashboard
        </p>

        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>

        <button
          type="button"
          onClick={fetchOverview}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  const totalUsers = overview?.totalUsers;
  const totalTransactions = overview?.totalTransactions;
  const totalIncome = overview?.totalIncome;
  const totalExpenses = overview?.totalExpenses;

  const topCategories = Array.isArray(overview?.topCategories)
    ? overview.topCategories
    : [];

  const categoryChartData = topCategories
    .filter(
      (item) =>
        item &&
        item._id != null &&
        isValidNumber(item.totalSpent)
    )
    .map((item) => ({
      category: String(item._id),
      amount: item.totalSpent,
    }));

  const financialChartData =
    isValidNumber(totalIncome) &&
    isValidNumber(totalExpenses)
      ? [
          {
            month: 'Overall',
            income: totalIncome,
            expenses: totalExpenses,
          },
        ]
      : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          Admin Dashboard
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Overview of platform activity and financial statistics.
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Users"
          value={
            isValidNumber(totalUsers)
              ? formatNumber(totalUsers)
              : 'Unavailable'
          }
          description="Registered platform users"
        />

        <StatCard
          title="Total Transactions"
          value={
            isValidNumber(totalTransactions)
              ? formatNumber(totalTransactions)
              : 'Unavailable'
          }
          description="All recorded transactions"
        />

        <StatCard
          title="Total Income"
          value={
            isValidNumber(totalIncome)
              ? formatCurrency(totalIncome)
              : 'Unavailable'
          }
          description="Overall recorded income"
        />

        <StatCard
          title="Total Expenses"
          value={
            isValidNumber(totalExpenses)
              ? formatCurrency(totalExpenses)
              : 'Unavailable'
          }
          description="Overall recorded expenses"
        />
      </div>

      {/* Financial Chart */}
      <div>
        {financialChartData.length > 0 ? (
          <FinanceChart
            type="monthly"
            data={financialChartData}
            title="Overall Income vs Expenses"
            currency="USD"
          />
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="font-semibold text-gray-900">
              Overall Financial Overview
            </h2>

            <p className="mt-4 text-sm text-gray-500">
              Financial chart unavailable because reliable
              income and expense totals are missing.
            </p>
          </div>
        )}
      </div>

      {/* Top Spending Categories */}
      <div>
        <h2 className="mb-4 text-xl font-bold text-gray-900">
          Top Spending Categories
        </h2>

        {categoryChartData.length > 0 ? (
          <FinanceChart
            type="category"
            data={categoryChartData}
            title="Top 5 Spending Categories"
            currency="USD"
          />
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
            <p className="text-sm text-gray-500">
              No spending category data available.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
