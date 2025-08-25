import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { cn } from '../../utils/cn';

interface LayoutProps {
  title?: string;
  showSearch?: boolean;
  showSidebar?: boolean;
  showFooter?: boolean;
  compactFooter?: boolean;
  className?: string;
}

export const Layout: React.FC<LayoutProps> = ({
  title,
  showSearch = true,
  showSidebar = true,
  showFooter = true,
  compactFooter = false,
  className
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Get active menu item from current route
  const getActiveMenuItem = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return 'dashboard';
    if (path.startsWith('/automations')) return 'automations';
    if (path.startsWith('/settings')) return 'settings';
    return 'dashboard';
  };

  const handleMenuToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleMenuItemClick = (itemId: string) => {
    // Close mobile sidebar when item is clicked
    if (sidebarOpen) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors">
      {/* Header */}
      <Header
        title={title}
        showSearch={showSearch}
        onMenuToggle={handleMenuToggle}
      />

      <div className="flex flex-1 relative">
        {/* Sidebar Overlay for Mobile */}
        {showSidebar && sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        {showSidebar && (
          <Sidebar
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={handleSidebarToggle}
            activeItem={getActiveMenuItem()}
            onItemClick={handleMenuItemClick}
            className={cn(
              'fixed lg:relative z-50 h-full',
              'lg:translate-x-0 transition-transform duration-300',
              sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            )}
          />
        )}

        {/* Main Content Area */}
        <main className={cn(
          'flex-1 flex flex-col min-h-0',
          className
        )}>
          {/* Content */}
          <div className="flex-1 overflow-auto">
            <div className="p-6 bg-gray-50 dark:bg-gray-900 transition-colors">
              <Outlet />
            </div>
          </div>

          {/* Footer */}
          {showFooter && (
            <Footer
              compact={compactFooter}
              showLinks={!compactFooter}
            />
          )}
        </main>
      </div>
    </div>
  );
};

// Layout variants for different page types
export const DashboardLayout: React.FC<Omit<LayoutProps, 'compactFooter' | 'showFooter'>> = (props) => (
  <Layout {...props} compactFooter showFooter />
);

export const FullPageLayout: React.FC<Omit<LayoutProps, 'showSidebar' | 'showFooter'>> = (props) => (
  <Layout {...props} showSidebar={false} showFooter={false} />
);

export const AuthLayout: React.FC<Omit<LayoutProps, 'showSidebar' | 'showSearch' | 'showFooter'>> = (props) => (
  <Layout {...props} showSidebar={false} showSearch={false} showFooter={false} />
);

export default Layout;