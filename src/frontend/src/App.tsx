import { RouterProvider } from "@tanstack/react-router";
import ErrorBoundary from "./components/ErrorBoundary";
import { Toaster } from "./components/ui/sonner";
import { FarmProvider } from "./context/FarmContext";
import { router } from "./router";

export default function App() {
  return (
    <ErrorBoundary>
      <FarmProvider>
        <RouterProvider router={router} />
        <Toaster />
      </FarmProvider>
    </ErrorBoundary>
  );
}
