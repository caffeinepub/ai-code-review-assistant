import { Layout } from "@/components/Layout";
import { useTheme } from "@/hooks/useTheme";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
} from "@tanstack/react-router";

// Root layout wrapper — applies theme on mount
function RootComponent() {
  useTheme();
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

const rootRoute = createRootRoute({
  component: RootComponent,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: lazyRouteComponent(() =>
    import("@/pages/ReviewPage").then((m) => ({ default: m.ReviewPage })),
  ),
});

const presentationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/presentation",
  component: lazyRouteComponent(() =>
    import("@/pages/PresentationPage").then((m) => ({
      default: m.PresentationPage,
    })),
  ),
});

const routeTree = rootRoute.addChildren([indexRoute, presentationRoute]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
