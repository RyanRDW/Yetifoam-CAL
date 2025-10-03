import AppShell from './layout/AppShell';
import { LayoutProvider } from './state/LayoutContext';

function App() {
  return (
    <LayoutProvider>
      <div style={{ height: '100vh', width: '100vw', background: '#fff' }}>
        <AppShell />
      </div>
    </LayoutProvider>
  );
}

export default App;
