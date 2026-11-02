import { lazy, Suspense } from "react";
import { Compass } from "lucide-react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

function StarterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-main-background px-page-gutter text-primary-text">
      <section className="max-w-xl text-center">
        <p className="mb-3 inline-flex items-center gap-2 text-small-label font-semibold uppercase tracking-wide text-secondary-teal">
          <Compass aria-hidden="true" className="size-4" />
          Travel planning, thoughtfully connected
        </p>
        <h1 className="text-display tracking-tight text-primary-dark">TripCraft</h1>
        <p className="mt-5 text-body leading-relaxed text-secondary-text">
          Your foundation for planning trips, comparing travel options, and
          making the most of your budget.
        </p>
        <p className="mt-8 text-small-label text-secondary-text">
          The TripCraft starter application is ready.
        </p>
      </section>
    </main>
  );
}

const developmentRoutes = import.meta.env.DEV
  ? (() => {
      const DesignSystemPreview = lazy(
        () => import("../components/dev/DesignSystemPreview"),
      );

      return [
        {
          path: "/dev/design-system",
          element: (
            <Suspense
              fallback={
                <main
                  className="flex min-h-screen items-center justify-center bg-main-background"
                  role="status"
                >
                  Loading design system preview…
                </main>
              }
            >
              <DesignSystemPreview />
            </Suspense>
          ),
        },
      ];
    })()
    : [];

export const router = createBrowserRouter([
  {
    path: "/",
    element: <StarterPage />,
  },
  ...developmentRoutes,
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
