import AppShell from './layout/AppShell';
import { CalculationController } from './results/CalculationController';
import { LayoutProvider } from './state/LayoutContext';

function App() {
  return (
    <LayoutProvider>
      <div className="h-screen w-screen bg-slate-100">
        <CalculationController />
        <AppShell />
      </div>
    </LayoutProvider>
  );
}

export default App;
