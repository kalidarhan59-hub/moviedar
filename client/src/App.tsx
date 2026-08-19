/** MovieDar design note — app shell intentionally stays dark to preserve the cinema-first experience. */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
          <TooltipProvider>
            <Toaster richColors theme="dark" position="bottom-right" />
            <Home />
          </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
