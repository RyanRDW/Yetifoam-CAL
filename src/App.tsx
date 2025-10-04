import AppShell from './layout/AppShell';
import { LayoutProvider } from './state/LayoutContext';

function App() {
  return (
    <LayoutProvider>
      <div className="h-screen w-screen bg-slate-100">
        <AppShell />
      </div>
    </LayoutProvider>
  );
}

export default App;
