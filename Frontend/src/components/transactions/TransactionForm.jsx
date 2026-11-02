import { useEffect, useState } from 'react';
import { Save, X } from 'lucide-react';

const CATEGORY_LABELS = [
  'Food',
  'Transport',
  'Bills',
  'Health',
  'Shopping',
  'Entertainment',
  'Work',
  'Other',
];

function getToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getInitialFormData(initialValues) {
  return {
    title: initialValues?.title ?? '',
    amount:
      initialValues?.amount != null
        ? String(initialValues.amount)
        : '',
    type: initialValues?.type ?? 'expense',
    category: initialValues?.category ?? '',
    date: initialValues?.date
      ? String(initialValues.date).slice(0, 10)
      : getToday(),
  };
}



function isValidLocalDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);

  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export default function TransactionForm({
  initialValues = null,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) {
  const [formData, setFormData] = useState(() =>
    getInitialFormData(initialValues)
  );

  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  const inputClass =
    'mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 disabled:bg-gray-100';

  const isEditing = Boolean(initialValues?._id);

  useEffect(() => {
    setFormData(getInitialFormData(initialValues));
    setErrors({});
    setSubmitError('');
  }, [initialValues]);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: '',
    }));

    setSubmitError('');
  }

  function validate() {
    const nextErrors = {};
    const amount = Number(formData.amount);

    if (!formData.title.trim()) {
      nextErrors.title = 'Title is required.';
    }

    if (
      !formData.amount.trim() ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      nextErrors.amount = 'Enter an amount greater than zero.';
    }

    if (!['income', 'expense'].includes(formData.type)) {
      nextErrors.type = 'Select Income or Expense.';
    }

    if (!CATEGORY_LABELS.includes(formData.category)) {
      nextErrors.category = 'Please select a valid category.';
    }

    if (!isValidLocalDate(formData.date)) {
      nextErrors.date = 'Select a valid date.';
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError('');

    if (isSubmitting || !validate()) {
      return;
    }

    if (typeof onSubmit !== 'function') {
      setSubmitError('Submit handler is not configured.');
      return;
    }

    try {
      await onSubmit({
        title: formData.title.trim(),
        amount: Number(formData.amount),
        type: formData.type,
        category: formData.category,
        date: formData.date,
      });
    } catch (error) {
      setSubmitError(
        error?.message || 'Unable to save the transaction.'
      );
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {submitError && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {submitError}
        </p>
      )}

      {/* Title */}
      <div>
        <label
          htmlFor="transaction-title"
          className="block text-sm font-medium text-gray-700"
        >
          Title
        </label>

        <input
          id="transaction-title"
          name="title"
          type="text"
          value={formData.title}
          onChange={handleChange}
          required
          disabled={isSubmitting}
          className={inputClass}
          placeholder="Enter transaction title"
          aria-invalid={Boolean(errors.title)}
        />

        {errors.title && (
          <p className="mt-1 text-sm text-red-600">
            {errors.title}
          </p>
        )}
      </div>

      {/* Amount */}
      <div>
        <label
          htmlFor="transaction-amount"
          className="block text-sm font-medium text-gray-700"
        >
          Amount
        </label>

        <input
          id="transaction-amount"
          name="amount"
          type="number"
          min="0.01"
          step="0.01"
          value={formData.amount}
          onChange={handleChange}
          required
          disabled={isSubmitting}
          className={inputClass}
          placeholder="Enter amount"
          aria-invalid={Boolean(errors.amount)}
        />

        {errors.amount && (
          <p className="mt-1 text-sm text-red-600">
            {errors.amount}
          </p>
        )}
      </div>

      {/* Transaction Type */}
      <div>
        <label
          htmlFor="transaction-type"
          className="block text-sm font-medium text-gray-700"
        >
          Transaction Type
        </label>

        <select
          id="transaction-type"
          name="type"
          value={formData.type}
          onChange={handleChange}
          required
          disabled={isSubmitting}
          className={inputClass}
          aria-invalid={Boolean(errors.type)}
        >
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>

        {errors.type && (
          <p className="mt-1 text-sm text-red-600">
            {errors.type}
          </p>
        )}
      </div>

      {/* Category */}
      <div>
        <label
          htmlFor="transaction-category"
          className="block text-sm font-medium text-gray-700"
        >
          Category
        </label>

        <select
          id="transaction-category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
          disabled={isSubmitting}
          className={inputClass}
          aria-invalid={Boolean(errors.category)}
        >
          <option value="">Select a category</option>

          {CATEGORY_LABELS.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        {errors.category && (
          <p className="mt-1 text-sm text-red-600">
            {errors.category}
          </p>
        )}
      </div>

      {/* Date */}
      <div>
        <label
          htmlFor="transaction-date"
          className="block text-sm font-medium text-gray-700"
        >
          Date
        </label>

        <input
          id="transaction-date"
          name="date"
          type="date"
          value={formData.date}
          onChange={handleChange}
          required
          disabled={isSubmitting}
          className={inputClass}
          aria-invalid={Boolean(errors.date)}
        />

        {errors.date && (
          <p className="mt-1 text-sm text-red-600">
            {errors.date}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={16} aria-hidden="true" />
            Cancel
          </button>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save size={16} aria-hidden="true" />

          {isSubmitting
            ? 'Saving...'
            : isEditing
              ? 'Update Transaction'
              : 'Create Transaction'}
        </button>
      </div>
    </form>
  );
}
