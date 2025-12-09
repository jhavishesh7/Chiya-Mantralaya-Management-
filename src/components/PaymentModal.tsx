import { useState } from 'react';
import { supabase, Order } from '../lib/supabase';
import { X, CreditCard, Banknote, QrCode, Split } from 'lucide-react';
import { useToast } from './Toast';

type Props = {
  order: Order;
  onClose: () => void;
  onSuccess: () => void;
};

export function PaymentModal({ order, onClose, onSuccess }: Props) {
  const [showQR, setShowQR] = useState(false);
  const [showSplitForm, setShowSplitForm] = useState(false);
  const [showCashConfirmation, setShowCashConfirmation] = useState(false);
  const [showSplitOnlineQR, setShowSplitOnlineQR] = useState(false);
  const [cashAmount, setCashAmount] = useState('');
  const [onlineAmount, setOnlineAmount] = useState('');
  const [splitCashAmount, setSplitCashAmount] = useState(0);
  const [splitOnlineAmount, setSplitOnlineAmount] = useState(0);
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
    setShowQR(true);
  };

  const confirmOnlinePayment = () => {
    if (confirm('Confirm that you have received the online payment?')) {
      handlePayment('online');
    }
  };

  const handleSplitFormSubmit = () => {
    const cash = parseFloat(cashAmount) || 0;
    const online = parseFloat(onlineAmount) || 0;
    const total = cash + online;

    if (cash < 0 || online < 0) {
      showToast('Payment amounts cannot be negative', 'error');
      return;
    }

    if (total <= 0) {
      showToast('Total payment amount must be greater than zero', 'error');
      return;
    }

    if (Math.abs(total - order.total_price) > 0.01) {
      showToast(
        `Total payment (₹${total.toFixed(2)}) must match order total (₹${order.total_price.toFixed(2)})`,
        'error'
      );
      return;
    }

    // Store amounts and show cash confirmation
    setSplitCashAmount(cash);
    setSplitOnlineAmount(online);
    setShowSplitForm(false);
    setShowCashConfirmation(true);
  };

  const handleCashConfirmation = () => {
    if (confirm(`Confirm that you have received cash payment of ₹${splitCashAmount.toFixed(2)}?`)) {
      setShowCashConfirmation(false);
      // If there's an online amount, show QR modal, otherwise process payment
      if (splitOnlineAmount > 0) {
        setShowSplitOnlineQR(true);
      } else {
        // Only cash payment, process directly
        processSplitPayment();
      }
    }
  };

  const processSplitPayment = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('confirm_split_payment', {
        p_order_id: order.id,
        p_cash_amount: splitCashAmount,
        p_online_amount: splitOnlineAmount,
      });

      if (error) throw error;

      if (data?.success) {
        showToast(
          `Split payment confirmed: ₹${splitCashAmount.toFixed(2)} cash + ₹${splitOnlineAmount.toFixed(2)} online`,
          'success'
        );
        onSuccess();
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to process split payment', 'error');
      console.error('Error processing split payment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSplitOnlineConfirmation = () => {
    if (confirm('Confirm that you have received the online payment?')) {
      setShowSplitOnlineQR(false);
      processSplitPayment();
    }
  };

  if (showSplitForm) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-4 sm:p-6 max-h-[95vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800">Split Payment</h3>
            <button
              onClick={() => {
                setShowSplitForm(false);
                setCashAmount('');
                setOnlineAmount('');
                setSplitCashAmount(0);
                setSplitOnlineAmount(0);
              }}
              className="text-gray-500 hover:text-gray-700 p-1"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm sm:text-base text-gray-600">Order Total:</span>
              <span className="text-xl sm:text-2xl font-bold text-gray-800">
                ₹{order.total_price.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="space-y-4 mb-4 sm:mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cash Amount (₹)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={cashAmount}
                onChange={(e) => {
                  setCashAmount(e.target.value);
                  const cash = parseFloat(e.target.value) || 0;
                  const remaining = Math.max(0, order.total_price - cash);
                  setOnlineAmount(remaining > 0 ? remaining.toFixed(2) : '');
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Online Amount (₹)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={onlineAmount}
                onChange={(e) => {
                  setOnlineAmount(e.target.value);
                  const online = parseFloat(e.target.value) || 0;
                  const remaining = Math.max(0, order.total_price - online);
                  setCashAmount(remaining > 0 ? remaining.toFixed(2) : '');
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Total:</span>
                <span className="text-lg font-bold text-orange-600">
                  ₹{((parseFloat(cashAmount) || 0) + (parseFloat(onlineAmount) || 0)).toFixed(2)}
                </span>
              </div>
              {(parseFloat(cashAmount) || 0) + (parseFloat(onlineAmount) || 0) !== order.total_price && (
                <p className="text-xs text-red-600 mt-1">
                  Total must equal ₹{order.total_price.toFixed(2)}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowSplitForm(false);
                setCashAmount('');
                setOnlineAmount('');
                setSplitCashAmount(0);
                setSplitOnlineAmount(0);
              }}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSplitFormSubmit}
              disabled={
                (parseFloat(cashAmount) || 0) + (parseFloat(onlineAmount) || 0) !== order.total_price ||
                (parseFloat(cashAmount) || 0) < 0 ||
                (parseFloat(onlineAmount) || 0) < 0
              }
              className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showCashConfirmation) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-4 sm:p-6 max-h-[95vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800">Confirm Cash Payment</h3>
            <button
              onClick={() => {
                setShowCashConfirmation(false);
                setShowSplitForm(true);
              }}
              className="text-gray-500 hover:text-gray-700 p-1"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="text-center">
              <p className="text-sm sm:text-base text-gray-600 mb-2">Cash Amount Received:</p>
              <p className="text-3xl sm:text-4xl font-bold text-green-600">
                ₹{splitCashAmount.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-orange-800 text-center">
              Have you received the cash payment of ₹{splitCashAmount.toFixed(2)}?
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowCashConfirmation(false);
                setShowSplitForm(true);
              }}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Back
            </button>
            <button
              onClick={handleCashConfirmation}
              className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
            >
              Yes, Cash Received
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showSplitOnlineQR) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-4 sm:p-6 max-h-[95vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800">Scan QR Code</h3>
            <button
              onClick={() => {
                setShowSplitOnlineQR(false);
                setShowCashConfirmation(true);
              }}
              className="text-gray-500 hover:text-gray-700 p-1"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4">
            <div className="text-center mb-3">
              <p className="text-sm text-gray-600">Cash Payment: ₹{splitCashAmount.toFixed(2)} ✓</p>
              <p className="text-sm text-gray-600">Online Payment: ₹{splitOnlineAmount.toFixed(2)}</p>
            </div>
          </div>

          <div className="bg-gray-100 rounded-lg p-4 sm:p-8 mb-4 sm:mb-6">
            <div className="bg-white rounded-lg p-4 sm:p-6 flex items-center justify-center">
              <QrCode className="w-32 h-32 sm:w-48 sm:h-48 text-gray-400" />
            </div>
            <p className="text-center text-xs sm:text-sm text-gray-600 mt-3 sm:mt-4">
              Customer should scan this QR code to pay ₹{splitOnlineAmount.toFixed(2)}
            </p>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-orange-800 text-center">
              After receiving online payment confirmation, click the button below to complete the split payment
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowSplitOnlineQR(false);
                setShowCashConfirmation(true);
              }}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Back
            </button>
            <button
              onClick={handleSplitOnlineConfirmation}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Confirm Payment Received'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showQR) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-4 sm:p-6 max-h-[95vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800">Scan QR Code</h3>
            <button
              onClick={() => {
                setShowQR(false);
              }}
              className="text-gray-500 hover:text-gray-700 p-1"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          <div className="bg-gray-100 rounded-lg p-4 sm:p-8 mb-4 sm:mb-6">
            <div className="bg-white rounded-lg p-4 sm:p-6 flex items-center justify-center">
              <QrCode className="w-32 h-32 sm:w-48 sm:h-48 text-gray-400" />
            </div>
            <p className="text-center text-xs sm:text-sm text-gray-600 mt-3 sm:mt-4">
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-4 sm:p-6 max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-gray-800">Process Payment</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1">
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm sm:text-base text-gray-600">Order Total:</span>
            <span className="text-xl sm:text-2xl font-bold text-gray-800">
              ₹{order.total_price.toFixed(2)}
            </span>
          </div>
          <div className="text-xs sm:text-sm text-gray-600">
            Table: {order.table_id ? 'Assigned' : 'N/A'}
          </div>
        </div>

        <div className="space-y-3 mb-4 sm:mb-6">
          <p className="text-xs sm:text-sm font-medium text-gray-700">Select Payment Method:</p>

          <button
            onClick={handleCashPayment}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 sm:gap-3 p-3 sm:p-4 bg-green-50 border-2 border-green-300 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Banknote className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            <div className="text-left">
              <div className="font-semibold text-sm sm:text-base text-gray-800">Cash Payment</div>
              <div className="text-xs sm:text-sm text-gray-600">Receive cash directly</div>
            </div>
          </button>

          <button
            onClick={handleOnlinePayment}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 sm:gap-3 p-3 sm:p-4 bg-blue-50 border-2 border-blue-300 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            <div className="text-left">
              <div className="font-semibold text-sm sm:text-base text-gray-800">Online Payment</div>
              <div className="text-xs sm:text-sm text-gray-600">UPI / Card / Net Banking</div>
            </div>
          </button>

          <button
            onClick={() => setShowSplitForm(true)}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 sm:gap-3 p-3 sm:p-4 bg-purple-50 border-2 border-purple-300 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Split className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            <div className="text-left">
              <div className="font-semibold text-sm sm:text-base text-gray-800">Split Payment</div>
              <div className="text-xs sm:text-sm text-gray-600">Cash + Online combination</div>
            </div>
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full px-4 py-2 sm:py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm sm:text-base"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
