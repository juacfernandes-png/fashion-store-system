import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import Suppliers from "./pages/Suppliers";
import Stock from "./pages/Stock";
import Customers from "./pages/Customers";
import Sales from "./pages/Sales";
import Purchases from "./pages/Purchases";
import Financial from "./pages/Financial";
import Reports from "./pages/Reports";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/products"} component={Products} />
      <Route path={"/categories"} component={Categories} />
      <Route path={"/suppliers"} component={Suppliers} />
      <Route path={"/stock"} component={Stock} />
      <Route path={"/customers"} component={Customers} />
      <Route path={"/sales"} component={Sales} />
      <Route path={"/purchases"} component={Purchases} />
      <Route path={"/financial"} component={Financial} />
      <Route path={"/reports"} component={Reports} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
