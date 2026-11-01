
import useAuthStore from '../../lib/store/authStore.js';

export default function DashboardWelcome() {
  const user = useAuthStore((state) => state.user);

  const name =
    user?.name ||
    user?.username ||
    'there';

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
        Welcome back, {name}!
      </h2>

      <p className="mt-2 text-sm text-gray-500">
        Here is an overview of your personal finances.
      </p>
    </section>
  );
}
