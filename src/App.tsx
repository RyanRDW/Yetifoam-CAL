/**
 * Main Application Component
 * Entry point for the Yetifam Calculator application
 */

import { RouterProvider } from 'react-router-dom';
import Providers from './app/Providers';
import { router } from './app/router';

function App() {
  return (
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  );
}

export default App;
