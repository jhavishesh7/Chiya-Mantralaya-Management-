import { useEffect, useState } from 'react';
import { supabase, Expense } from '../../lib/supabase';
import { Receipt, Plus, X, Trash2 } from 'lucide-react';
import { useToast } from '../../components/Toast';

type ExpenseWithProfile = Expense & {
  profiles?: { name: string | null } | null;
};

export function ExpenseManagement() {
  const [expenses, setExpenses] = useState<ExpenseWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*, profiles(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      showToast('Failed to load expenses', 'error');
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }

    try {
      const { data, error } = await supabase.rpc('add_expense', {
        p_title: title,
        p_amount: amountNum,
      });

      if (error) throw error;

      if (data?.success) {
        showToast('Expense added successfully', 'success');
        setShowModal(false);
        setTitle('');
        setAmount('');
        fetchExpenses();
      }
    } catch (error) {
      showToast('Failed to add expense', 'error');
      console.error('Error adding expense:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id);

      if (error) throw error;
      showToast('Expense deleted successfully', 'success');
      fetchExpenses();
    } catch (error) {
      showToast('Failed to delete expense', 'error');
      console.error('Error deleting expense:', error);
    }
  };

  const getTodayTotal = () => {
    const today = new Date().toDateString();
    return expenses
      .filter((exp) => new Date(exp.created_at).toDateString() === today)
      .reduce((sum, exp) => sum + exp.amount, 0);
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Receipt className="w-8 h-8 text-orange-500" />
          <h2 className="text-2xl font-bold text-gray-800">Expense Management</h2>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Expense
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="text-center">
          <p className="text-gray-600 mb-2">Today's Expenses</p>
          <p className="text-3xl font-bold text-red-600">₹{getTodayTotal().toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Recorded By
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {expenses.map((expense) => (
              <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-800">{expense.title}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-semibold text-red-600">₹{expense.amount.toFixed(2)}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-gray-600">{expense.profiles?.name || 'Unknown'}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-gray-600">
                    {new Date(expense.created_at).toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleDelete(expense.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Add Expense</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expense Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="e.g., Milk purchase, Electricity bill"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="0.00"
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
                  Add Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
