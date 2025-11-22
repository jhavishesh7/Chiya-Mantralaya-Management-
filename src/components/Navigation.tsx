import { useState } from 'react';
import { LogOut, Users, Coffee, LayoutGrid, ShoppingCart, Receipt, TrendingUp, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type Props = {
  activeTab: string;
  onTabChange: (tab: string) => void;
};

export function Navigation({ activeTab, onTabChange }: Props) {
  const { signOut, profile } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isAdmin = profile?.role === 'admin';

  const tabs = [
    { id: 'orders', label: 'Orders', icon: ShoppingCart, roles: ['admin', 'employee'] },
    { id: 'employees', label: 'Employees', icon: Users, roles: ['admin'] },
    { id: 'menu', label: 'Menu', icon: Coffee, roles: ['admin'] },
    { id: 'tables', label: 'Tables', icon: LayoutGrid, roles: ['admin'] },
    { id: 'expenses', label: 'Expenses', icon: Receipt, roles: ['admin'] },
    { id: 'revenue', label: 'Revenue', icon: TrendingUp, roles: ['admin'] },
  ];

  const availableTabs = tabs.filter((tab) =>
    profile?.role ? tab.roles.includes(profile.role) : false
  );

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
    setIsMobileMenuOpen(false);
  };

  const handleSignOut = () => {
    signOut();
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {/* Hamburger Menu Button - Mobile Only */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6" />
              </button>

              <div className="bg-orange-500 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
                <Coffee className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-xl font-bold text-gray-800 truncate">Chiya Mantralaya</h1>
                <p className="text-xs text-gray-600 truncate">{profile?.name}</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-2">
              {availableTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-orange-500 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Desktop Sign Out */}
            <button
              onClick={handleSignOut}
              className="hidden md:flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Side Menu Overlay */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Side Menu */}
          <div
            className={`fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
              isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            {/* Menu Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="bg-orange-500 p-2 rounded-lg">
                  <Coffee className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-800">Chiya Mantralaya</h2>
                  <p className="text-xs text-gray-600">{profile?.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close menu"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Menu Items */}
            <nav className="flex flex-col p-4">
              {availableTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                      activeTab === tab.id
                        ? 'bg-orange-500 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}

              {/* Sign Out Button */}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 px-4 py-3 mt-4 rounded-lg transition-colors text-left text-gray-700 hover:bg-red-50 hover:text-red-600 border-t border-gray-200 pt-4"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Sign Out</span>
              </button>
            </nav>
          </div>
        </>
      )}
    </>
  );
}
