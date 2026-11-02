import { createBrowserRouter, RouterProvider } from "react-router-dom";

function StarterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-100">
      <section className="max-w-xl text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-sky-400">
          Travel planning, thoughtfully connected
        </p>
        <h1 className="text-5xl font-bold tracking-tight">TripCraft</h1>
        <p className="mt-5 text-lg leading-8 text-slate-300">
          Your foundation for planning trips, comparing travel options, and
          making the most of your budget.
        </p>
        <p className="mt-8 text-sm text-slate-400">
          The TripCraft starter application is ready.
        </p>
      </section>
    </main>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <StarterPage />,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
