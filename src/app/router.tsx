/**
 * Application routing configuration
 * Uses React Router for client-side navigation
 */

import { createBrowserRouter } from 'react-router-dom';
import AppShell from './AppShell';
import CalculatorPage from '../pages/CalculatorPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <CalculatorPage />,
      },
    ],
  },
]);
