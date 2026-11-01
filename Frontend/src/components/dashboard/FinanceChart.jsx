
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

const CATEGORY_COLORS = [
  '#6366f1',
  '#14b8a6',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#0ea5e9',
];

export default function FinanceChart({
  type = 'monthly',
  data = [],
  title,
  currency = 'USD',
}) {
  const isMonthly = type === 'monthly';

  const validData = Array.isArray(data) ? data : [];

  const hasData = validData.length > 0;

  const formatCurrency = (value) =>
    new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(Number(value) || 0);

  const chartTitle =
    title ||
    (isMonthly
      ? 'Monthly Income vs Expenses'
      : 'Spending by Category');

  const requiredKeys = isMonthly
    ? ['month', 'income', 'expenses']
    : ['category', 'amount'];

  const chartData = validData.filter(
    (item) =>
      item &&
      requiredKeys.every(
        (key) =>
          item[key] !== undefined &&
          item[key] !== null &&
          (key === 'month' || key === 'category'
            ? String(item[key]).trim() !== ''
            : Number.isFinite(Number(item[key])) &&
              Number(item[key]) >= 0)
      )
  );

  return (
    <section
      aria-label={chartTitle}
      className="w-full min-w-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6"
    >
      <h2 className="mb-5 text-lg font-semibold text-gray-900">
        {chartTitle}
      </h2>

      {chartData.length === 0 ? (
        <div className="flex min-h-64 items-center justify-center text-center text-sm text-gray-500">
          No financial data available yet.
        </div>
      ) : (
        <div
          className="w-full min-w-0"
          style={{ height: 320 }}
        >
          <ResponsiveContainer width="100%" height="100%">
            {isMonthly ? (
              <BarChart
                data={chartData}
                margin={{
                  top: 8,
                  right: 8,
                  left: 8,
                  bottom: 8,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                />

                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  width={75}
                  tickFormatter={(value) =>
                    new Intl.NumberFormat(undefined, {
                      notation: 'compact',
                      maximumFractionDigits: 1,
                    }).format(value)
                  }
                />

                <Tooltip
                  formatter={(value, name) => [
                    formatCurrency(value),
                    name === 'income' ? 'Income' : 'Expenses',
                  ]}
                />

                <Legend />

                <Bar
                  dataKey="income"
                  name="Income"
                  fill="#16a34a"
                  radius={[4, 4, 0, 0]}
                />

                <Bar
                  dataKey="expenses"
                  name="Expenses"
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            ) : (
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius="75%"
                  innerRadius="45%"
                  paddingAngle={2}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {chartData.map((item, index) => (
                    <Cell
                      key={`${item.category}-${index}`}
                      fill={
                        CATEGORY_COLORS[
                          index % CATEGORY_COLORS.length
                        ]
                      }
                    />
                  ))}
                </Pie>

                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                />

                <Legend />
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
