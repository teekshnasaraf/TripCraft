import { lazy, Suspense } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import DashboardPage from "../features/dashboard/pages/DashboardPage";
import RegisterPage from "../features/auth/pages/RegisterPage";
import { RequireAuth } from "../features/auth/components/RequireAuth";
import SignInPage from "../features/auth/pages/SignInPage";
import HomePage from "../features/home/pages/HomePage";
import NotFoundPage from "../features/home/pages/NotFoundPage";
import TripPlannerPage from "../features/trips/pages/TripPlannerPage";

const developmentRoutes = import.meta.env.DEV
  ? (() => {
      const DesignSystemPreview = lazy(
        () => import("../components/dev/DesignSystemPreview"),
      );
      const DashboardPreview = lazy(
        () => import("../features/dashboard/pages/DashboardPage"),
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
        {
          path: "/dev/dashboard-preview",
          element: (
            <Suspense
              fallback={
                <main
                  className="flex min-h-screen items-center justify-center bg-main-background"
                  role="status"
                >
                  Loading dashboard preview…
                </main>
              }
            >
              <DashboardPreview
                preview
                dashboardHref="/dev/dashboard-preview"
              />
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
  {
    path: "/sign-in",
    element: <SignInPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/dashboard",
    element: (
      <RequireAuth>
        <DashboardPage />
      </RequireAuth>
    ),
  },
  {
    path: "/plan-trip",
    element: <TripPlannerPage />,
  },
  ...developmentRoutes,
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
