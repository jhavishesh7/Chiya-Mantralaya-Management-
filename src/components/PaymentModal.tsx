import { useState } from 'react';
import { supabase, Order } from '../lib/supabase';
import { X, CreditCard, Banknote, QrCode } from 'lucide-react';
import { useToast } from './Toast';

type Props = {
  order: Order;
  onClose: () => void;
  onSuccess: () => void;
};

export function PaymentModal({ order, onClose, onSuccess }: Props) {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online' | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handlePayment = async (method: 'cash' | 'online') => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('confirm_payment', {
        p_order_id: order.id,
        p_method: method,
      });

      if (error) throw error;

      if (data?.success) {
        showToast(`Payment of ₹${order.total_price.toFixed(2)} confirmed`, 'success');
        onSuccess();
      }
    } catch (error) {
      showToast('Failed to process payment', 'error');
      console.error('Error processing payment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCashPayment = () => {
    if (confirm(`Confirm cash payment of ₹${order.total_price.toFixed(2)}?`)) {
      handlePayment('cash');
    }
  };

  const handleOnlinePayment = () => {
    setPaymentMethod('online');
    setShowQR(true);
  };

  const confirmOnlinePayment = () => {
    if (confirm('Confirm that you have received the online payment?')) {
      handlePayment('online');
    }
  };

  if (showQR) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800">Scan QR Code</h3>
            <button
              onClick={() => {
                setShowQR(false);
                setPaymentMethod(null);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="bg-gray-100 rounded-lg p-8 mb-6">
            <div className="bg-white rounded-lg p-6 flex items-center justify-center">
              <QrCode className="w-48 h-48 text-gray-400" />
            </div>
            <p className="text-center text-sm text-gray-600 mt-4">
              Customer should scan this QR code to pay ₹{order.total_price.toFixed(2)}
            </p>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-orange-800 text-center">
              After receiving payment confirmation, click the button below to complete the transaction
            </p>
          </div>

          <button
            onClick={confirmOnlinePayment}
            disabled={loading}
            className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Confirm Payment Received'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800">Process Payment</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Order Total:</span>
            <span className="text-2xl font-bold text-gray-800">
              ₹{order.total_price.toFixed(2)}
            </span>
          </div>
          <div className="text-sm text-gray-600">
            Table: {order.table_id ? 'Assigned' : 'N/A'}
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <p className="text-sm font-medium text-gray-700">Select Payment Method:</p>

          <button
            onClick={handleCashPayment}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 p-4 bg-green-50 border-2 border-green-300 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Banknote className="w-6 h-6 text-green-600" />
            <div className="text-left">
              <div className="font-semibold text-gray-800">Cash Payment</div>
              <div className="text-sm text-gray-600">Receive cash directly</div>
            </div>
          </button>

          <button
            onClick={handleOnlinePayment}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CreditCard className="w-6 h-6 text-blue-600" />
            <div className="text-left">
              <div className="font-semibold text-gray-800">Online Payment</div>
              <div className="text-sm text-gray-600">UPI / Card / Net Banking</div>
            </div>
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
