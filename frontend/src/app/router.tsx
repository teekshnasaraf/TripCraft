import { lazy, Suspense } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import HomePage from "../features/home/pages/HomePage";

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
    element: <HomePage />,
  },
  ...developmentRoutes,
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
