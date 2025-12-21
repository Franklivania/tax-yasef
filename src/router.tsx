import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import ChatDisplay from "./pages/chat";
import NotFound from "./pages/_not-found";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/chat",
    element: <ChatDisplay />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

export function Router() {
  return <RouterProvider router={router} />;
}
