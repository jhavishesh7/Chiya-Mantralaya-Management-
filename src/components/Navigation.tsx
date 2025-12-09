import { LogOut, Users, Coffee, LayoutGrid, ShoppingCart, Receipt, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type Props = {
  activeTab: string;
  onTabChange: (tab: string) => void;
};

export function Navigation({ activeTab, onTabChange }: Props) {
  const { signOut, profile } = useAuth();

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

  const handleSignOut = () => {
    signOut();
  };

  return (
    <>
      {/* Top Header Bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="bg-orange-500 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
                <Coffee className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-xl font-bold text-gray-800 truncate">Cafe</h1>
                <p className="text-xs text-gray-600 truncate">{profile?.name}</p>
              </div>
            </div>

            {/* Mobile Sign Out Button */}
            <button
              onClick={handleSignOut}
              className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              aria-label="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>

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

      {/* Mobile Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 md:hidden">
        <nav className="flex items-center justify-around h-16 px-1">
          {availableTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors min-w-0 ${
                  isActive ? 'text-orange-500' : 'text-gray-900'
                }`}
                aria-label={tab.label}
              >
                <Icon 
                  className="w-6 h-6"
                  strokeWidth={isActive ? 2.5 : 1.5}
                />
                <span className={`text-[10px] leading-tight ${isActive ? 'text-orange-500 font-semibold' : 'text-gray-900'}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}
