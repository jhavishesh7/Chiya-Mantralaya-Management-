import { useEffect, useState } from 'react';
import { supabase, CafeTable } from '../../lib/supabase';
import { LayoutGrid, Plus, Trash2, X } from 'lucide-react';
import { useToast } from '../../components/Toast';

export function TableManagement() {
  const [tables, setTables] = useState<CafeTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [tableNumber, setTableNumber] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const { data, error } = await supabase
        .from('cafe_tables')
        .select('*')
        .order('table_number', { ascending: true });

      if (error) throw error;
      setTables(data || []);
    } catch (error) {
      showToast('Failed to load tables', 'error');
      console.error('Error fetching tables:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();

    const number = parseInt(tableNumber);
    if (isNaN(number) || number < 1) {
      showToast('Please enter a valid table number', 'error');
      return;
    }

    try {
      const { error } = await supabase.from('cafe_tables').insert({
        table_number: number,
        status: 'empty',
      });

      if (error) {
        if (error.code === '23505') {
          showToast('Table number already exists', 'error');
        } else {
          throw error;
        }
        return;
      }

      showToast('Table added successfully', 'success');
      setShowModal(false);
      setTableNumber('');
      fetchTables();
    } catch (error) {
      showToast('Failed to add table', 'error');
      console.error('Error adding table:', error);
    }
  };

  const handleDeleteTable = async (id: string) => {
    if (!confirm('Are you sure you want to delete this table?')) return;

    try {
      const { error } = await supabase.from('cafe_tables').delete().eq('id', id);

      if (error) throw error;
      showToast('Table deleted successfully', 'success');
      fetchTables();
    } catch (error) {
      showToast('Failed to delete table', 'error');
      console.error('Error deleting table:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <LayoutGrid className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Table Management</h2>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-orange-500 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors text-sm sm:text-base w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          Add Table
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
        {tables.map((table) => (
          <div
            key={table.id}
            className={`relative bg-white rounded-lg shadow p-4 sm:p-6 transition-all ${
              table.status === 'occupied'
                ? 'border-2 border-red-400 bg-red-50'
                : 'border-2 border-green-400 bg-green-50'
            }`}
          >
            <button
              onClick={() => handleDeleteTable(table.id)}
              className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 p-1 text-gray-400 hover:text-red-600 hover:bg-white rounded transition-colors"
              title="Delete table"
            >
              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>

            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">
                {table.table_number}
              </div>
              <div
                className={`text-xs font-semibold uppercase ${
                  table.status === 'occupied' ? 'text-red-600' : 'text-green-600'
                }`}
              >
                {table.status}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-4 sm:p-6 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 gap-3">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 truncate">Add Table</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 flex-shrink-0 p-1"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <form onSubmit={handleAddTable} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Table Number
                </label>
                <input
                  type="number"
                  min="1"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter table number"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Add Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
