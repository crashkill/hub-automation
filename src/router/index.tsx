import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Dashboard, Automations, Settings } from '../pages';
import Home from '../pages/Home';
import { Layout } from '../components/layout';

// Error Boundary Component
const ErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Oops! Algo deu errado</h1>
        <p className="text-gray-600 mb-6">Ocorreu um erro inesperado. Tente recarregar a página.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Recarregar Página
        </button>
      </div>
    </div>
  );
};

// Not Found Component
const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Página não encontrada</h2>
        <p className="text-gray-600 mb-6">A página que você está procurando não existe.</p>
        <a
          href="/"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Voltar ao Início
        </a>
      </div>
    </div>
  );
};

// Loading Component
const Loading: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Carregando...</p>
      </div>
    </div>
  );
};

// Router Configuration
export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <ErrorBoundary><NotFound /></ErrorBoundary>,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />
      },
      {
        path: 'home',
        element: <Home />
      },
      {
        path: 'dashboard',
        element: <Dashboard />
      },
      {
        path: 'automations',
        element: <Automations />
      },
      {
        path: 'automations/:id',
        element: <div>Detalhes da Automação (Em desenvolvimento)</div>
      },
      {
        path: 'settings',
        element: <Settings />
      },
      {
        path: 'settings/:tab',
        element: <Settings />
      }
    ]
  },
  {
    path: '/login',
    element: (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Login</h1>
          <p className="text-gray-600">Página de login em desenvolvimento</p>
        </div>
      </div>
    )
  },
  {
    path: '*',
    element: <NotFound />
  }
]);

export default router;