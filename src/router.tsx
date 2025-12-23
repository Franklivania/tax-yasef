import {
  createBrowserRouter,
  RouterProvider,
  type RouteObject,
} from "react-router-dom";
import { Suspense, lazy } from "react";
import LoadingScreen from "./pages/_loading";
import AdminPage from "./pages/admin/page";

// Lazy load all route components for code splitting
const App = lazy(() => import("./App"));
const ChatDisplay = lazy(() => import("./pages/chat"));
const NotFound = lazy(() => import("./pages/_not-found"));

const routes: RouteObject[] = [
  {
    path: "/",
    element: (
      <Suspense fallback={<LoadingScreen />}>
        <App />
      </Suspense>
    ),
  },
  {
    path: "/chat",
    element: (
      <Suspense fallback={<LoadingScreen />}>
        <ChatDisplay />
      </Suspense>
    ),
  },
  {
    path: "/loading",
    element: <LoadingScreen />,
  },
  {
    path: "/admin",
    element: (
      <Suspense fallback={<LoadingScreen />}>
        <AdminPage />
      </Suspense>
    ),
  },
  {
    path: "*",
    element: (
      <Suspense fallback={<LoadingScreen />}>
        <NotFound />
      </Suspense>
    ),
  },
];

const router = createBrowserRouter(routes, {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  },
});

export function Router() {
  return <RouterProvider router={router} />;
}
