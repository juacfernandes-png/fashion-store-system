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
import Units from "./pages/Units";
import Transfers from "./pages/Transfers";
import Returns from "./pages/Returns";
import UnitStock from "./pages/UnitStock";
import CashFlow from "./pages/CashFlow";
import Payables from "./pages/Payables";
import Receivables from "./pages/Receivables";
import Pricing from "./pages/Pricing";
import Reconciliation from "./pages/Reconciliation";
import DRE from "./pages/DRE";
import FinancialReports from "./pages/FinancialReports";
import AuditLogs from "./pages/AuditLogs";

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
      <Route path={"/units"} component={Units} />
      <Route path={"/transfers"} component={Transfers} />
      <Route path={"/returns"} component={Returns} />
      <Route path={"/unit-stock"} component={UnitStock} />
      <Route path={"/cash-flow"} component={CashFlow} />
      <Route path={"/payables"} component={Payables} />
      <Route path={"/receivables"} component={Receivables} />
      <Route path={"/pricing"} component={Pricing} />
      <Route path={"/reconciliation"} component={Reconciliation} />
      <Route path={"/dre"} component={DRE} />
      <Route path={"/financial-reports"} component={FinancialReports} />
      <Route path={"/audit-logs"} component={AuditLogs} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
