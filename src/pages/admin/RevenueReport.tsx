import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { TrendingUp, Download, Calendar, RefreshCw } from 'lucide-react';
import { useToast } from '../../components/Toast';

type DailySummary = {
  date: string;
  total_revenue: number;
  cash_revenue: number;
  online_revenue: number;
  total_expenses: number;
  net_profit: number;
  order_count: number;
};

export function RevenueReport() {
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const { showToast } = useToast();

  useEffect(() => {
    fetchSummary();
  }, [selectedDate]);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_daily_summary', {
        p_date: selectedDate,
      });

      if (error) throw error;
      setSummary(data);
    } catch (error) {
      showToast('Failed to load revenue report', 'error');
      console.error('Error fetching summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!summary) return;

    const headers = ['Metric', 'Value'];
    const rows = [
      ['Date', summary.date],
      ['Total Revenue', `₹${summary.total_revenue.toFixed(2)}`],
      ['Cash Revenue', `₹${summary.cash_revenue.toFixed(2)}`],
      ['Online Revenue', `₹${summary.online_revenue.toFixed(2)}`],
      ['Total Expenses', `₹${summary.total_expenses.toFixed(2)}`],
      ['Net Profit', `₹${summary.net_profit.toFixed(2)}`],
      ['Order Count', summary.order_count.toString()],
    ];

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue-report-${summary.date}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showToast('Report exported successfully', 'success');
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
          <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Revenue Report</h2>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 bg-orange-500 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors text-sm sm:text-base w-full sm:w-auto justify-center"
        >
          <Download className="w-4 h-4 sm:w-5 sm:h-5" />
          Export CSV
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            <label className="text-sm font-medium text-gray-700">Select Date:</label>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="flex-1 sm:flex-initial px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <button
              onClick={() => {
                const today = new Date().toISOString().split('T')[0];
                setSelectedDate(today);
              }}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
              title="Reset to Today"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>
      </div>

      {summary && (
        <div className="grid gap-4 sm:gap-6">
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow p-6 border-2 border-green-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-800">Total Revenue</h3>
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-4xl font-bold text-green-700">
                ₹{summary.total_revenue.toFixed(2)}
              </p>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg shadow p-6 border-2 border-red-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-800">Total Expenses</h3>
                <TrendingUp className="w-6 h-6 text-red-600" />
              </div>
              <p className="text-4xl font-bold text-red-700">
                ₹{summary.total_expenses.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow p-4 sm:p-6 border-2 border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800">Cash</h3>
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-700">
                ₹{summary.cash_revenue.toFixed(2)}
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow p-4 sm:p-6 border-2 border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800">Online</h3>
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-purple-700">
                ₹{summary.online_revenue.toFixed(2)}
              </p>
            </div>
          </div>

          <div
            className={`rounded-lg shadow p-6 border-2 ${
              summary.net_profit >= 0
                ? 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'
                : 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-800">Net Profit</h3>
              <TrendingUp
                className={`w-6 h-6 ${summary.net_profit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}
              />
            </div>
            <p
              className={`text-5xl font-bold ${
                summary.net_profit >= 0 ? 'text-blue-700' : 'text-orange-700'
              }`}
            >
              ₹{summary.net_profit.toFixed(2)}
            </p>
            <p className="mt-2 text-sm text-gray-600">
              Revenue - Expenses = Profit
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Additional Metrics</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Orders Completed</p>
                <p className="text-2xl font-bold text-gray-800">{summary.order_count}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Avg Order Value</p>
                <p className="text-2xl font-bold text-gray-800">
                  ₹
                  {summary.order_count > 0
                    ? (summary.total_revenue / summary.order_count).toFixed(2)
                    : '0.00'}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Profit Margin</p>
                <p className="text-2xl font-bold text-gray-800">
                  {summary.total_revenue > 0
                    ? ((summary.net_profit / summary.total_revenue) * 100).toFixed(1)
                    : '0.0'}
                  %
                </p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> All financial data is calculated server-side with atomic transactions
              to ensure accuracy. Revenue is based on confirmed payments only.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
