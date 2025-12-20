import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import ChatDisplay from "./pages/chat";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/chat",
    element: <ChatDisplay />,
  },
]);

export function Router() {
  return <RouterProvider router={router} />;
}
