import { X, CheckCircle, CreditCard } from 'lucide-react';
import { Order, CafeTable } from '../lib/supabase';

type OrderWithDetails = Order & {
  cafe_tables?: CafeTable | null;
  profiles?: { name: string | null } | null;
};

type Props = {
  order: OrderWithDetails;
  onClose: () => void;
  onStatusUpdate?: (orderId: string, newStatus: Order['status']) => void;
  onPaymentClick?: (order: Order) => void;
  canUpdateStatus?: boolean;
  isAdmin?: boolean;
};

export function OrderDetailModal({ 
  order, 
  onClose, 
  onStatusUpdate, 
  onPaymentClick,
  canUpdateStatus = false,
  isAdmin = false 
}: Props) {
  const statusColors = {
    taken: 'bg-blue-100 text-blue-800',
    prepared: 'bg-yellow-100 text-yellow-800',
    delivered: 'bg-green-100 text-green-800',
    paid: 'bg-gray-100 text-gray-800',
  };

  const handleStatusUpdate = (newStatus: Order['status']) => {
    if (onStatusUpdate) {
      onStatusUpdate(order.id, newStatus);
    }
  };

  const handlePaymentClick = () => {
    if (onPaymentClick) {
      onPaymentClick(order);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h3 className="text-lg sm:text-2xl font-bold text-gray-800">Order Details</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1">
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Table</p>
              <p className="text-lg font-semibold text-gray-800">
                Table {order.cafe_tables?.table_number || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Status</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status]}`}>
                {order.status.toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Employee</p>
              <p className="text-lg font-semibold text-gray-800">
                {order.profiles?.name || 'Unknown'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Amount</p>
              <p className="text-lg font-semibold text-gray-800">
                ₹{order.total_price.toFixed(2)}
              </p>
            </div>
            {order.payment_method && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Payment Method</p>
                <p className="text-lg font-semibold text-gray-800 capitalize">
                  {order.payment_method}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600 mb-1">Created At</p>
              <p className="text-lg font-semibold text-gray-800">
                {new Date(order.created_at).toLocaleString()}
              </p>
            </div>
            {order.updated_at && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Last Updated</p>
                <p className="text-lg font-semibold text-gray-800">
                  {new Date(order.updated_at).toLocaleString()}
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Order Items</h4>
            <div className="space-y-3">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">{item.name}</p>
                    <p className="text-sm text-gray-600">
                      {item.qty}x ₹{item.price.toFixed(2)} each
                    </p>
                  </div>
                  <p className="text-lg font-semibold text-gray-800">
                    ₹{(item.qty * item.price).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-xl font-semibold text-gray-800">Total:</span>
                <span className="text-2xl font-bold text-orange-600">
                  ₹{order.total_price.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 border-t border-gray-200 space-y-3">
          {canUpdateStatus && (
            <div className="flex flex-col sm:flex-row gap-2">
              {order.status === 'taken' && (
                <button
                  onClick={() => handleStatusUpdate('prepared')}
                  className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors font-medium text-sm sm:text-base"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark as Prepared
                </button>
              )}

              {order.status === 'prepared' && (
                <button
                  onClick={() => handleStatusUpdate('delivered')}
                  className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-medium text-sm sm:text-base"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark as Delivered
                </button>
              )}

              {isAdmin && order.status === 'delivered' && (
                <button
                  onClick={handlePaymentClick}
                  className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium text-sm sm:text-base"
                >
                  <CreditCard className="w-4 h-4" />
                  Make Payment
                </button>
              )}
            </div>
          )}
          <button
            onClick={onClose}
            className="w-full px-4 py-2 sm:py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium text-sm sm:text-base"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

