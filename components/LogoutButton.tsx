"use client";

export function LogoutButton() {
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!confirm("Are you sure you want to logout?")) {
      event.preventDefault();
    }
  }

  return (
    <form action="/logout" method="post" onSubmit={handleSubmit}>
      <button
        type="submit"
        className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 shadow-sm transition hover:border-rose-300 hover:text-rose-900"
      >
        Logout
      </button>
    </form>
  );
}
