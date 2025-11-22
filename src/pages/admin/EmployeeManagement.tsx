import { useEffect, useState } from 'react';
import { supabase, Profile } from '../../lib/supabase';
import { Users, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '../../components/Toast';

export function EmployeeManagement() {
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'employee')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      showToast('Failed to load employees', 'error');
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyToggle = async (userId: string, currentStatus: boolean) => {
    setActionLoading(userId);
    try {
      const { data, error } = await supabase.rpc('verify_employee', {
        user_id: userId,
        verified_status: !currentStatus,
      });

      if (error) throw error;

      if (data?.success) {
        showToast(
          `Employee ${!currentStatus ? 'verified' : 'unverified'} successfully`,
          'success'
        );
        await fetchEmployees();
      }
    } catch (error) {
      showToast('Failed to update verification status', 'error');
      console.error('Error toggling verification:', error);
    } finally {
      setActionLoading(null);
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
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <Users className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500" />
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Employee Management</h2>
      </div>

      {employees.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 sm:p-8 text-center">
          <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-sm sm:text-base text-gray-600">No employees registered yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden sm:table-cell">
                    Registered
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
            <tbody className="divide-y divide-gray-200">
              {employees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <div className="font-medium text-sm sm:text-base text-gray-800">{employee.name || 'N/A'}</div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <div className="text-gray-600 text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">
                      {employee.id.substring(0, 8)}...
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    {employee.verified ? (
                      <span className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        <XCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 hidden sm:table-cell">
                    {new Date(employee.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                    <button
                      onClick={() => handleVerifyToggle(employee.id, employee.verified)}
                      disabled={actionLoading === employee.id}
                      className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                        employee.verified
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {actionLoading === employee.id
                        ? 'Processing...'
                        : employee.verified
                        ? 'Revoke'
                        : 'Verify'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
