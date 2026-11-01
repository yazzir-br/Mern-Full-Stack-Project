
import {
  Utensils,
  Car,
  Receipt,
  HeartPulse,
  ShoppingBag,
  Clapperboard,
  Briefcase,
  Shapes
} from 'lucide-react';

const categoryConfig = {
  Food: {
    label: 'Food',
    icon: Utensils
  },
  Transport: {
    label: 'Transport',
    icon: Car
  },
  Bills: {
    label: 'Bills',
    icon: Receipt
  },
  Health: {
    label: 'Health',
    icon: HeartPulse
  },
  Shopping: {
    label: 'Shopping',
    icon: ShoppingBag
  },
  Entertainment: {
    label: 'Entertainment',
    icon: Clapperboard
  },
  Work: {
    label: 'Work',
    icon: Briefcase
  },
  Other: {
    label: 'Other',
    icon: Shapes
  }
};

function CategoryCard({ category, onClick }) {
  const config = categoryConfig[category];

  if (!config) {
    return null;
  }

  const Icon = config.icon;

  return (
    <button
      type="button"
      onClick={() => onClick?.(category)}
      aria-label={`${config.label} category`}
      className="group w-full rounded-xl border border-gray-200
        bg-white p-5 text-left shadow-sm transition
        hover:-translate-y-0.5 hover:border-blue-400
        hover:shadow-md
        focus:outline-none focus:ring-2 focus:ring-blue-500
        focus:ring-offset-2"
    >
      <div className="flex items-center gap-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center
            justify-center rounded-xl bg-blue-50
            text-blue-600 transition group-hover:bg-blue-100"
        >
          <Icon size={24} aria-hidden="true" />
        </div>

        <div>
          <h3 className="font-semibold text-gray-800">
            {config.label}
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Transaction category
          </p>
        </div>
      </div>
    </button>
  );
}

export default CategoryCard;
