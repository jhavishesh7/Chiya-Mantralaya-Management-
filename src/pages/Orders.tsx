import { useEffect, useState } from 'react';
import { supabase, Order, CafeTable, MenuItem } from '../lib/supabase';
import { ShoppingCart, Plus, Edit2, CheckCircle, CreditCard, Info, RotateCcw, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { OrderModal } from '../components/OrderModal';
import { PaymentModal } from '../components/PaymentModal';
import { OrderDetailModal } from '../components/OrderDetailModal';

export type OrderWithDetails = Order & {
  cafe_tables?: CafeTable | null;
  profiles?: { name: string | null } | null;
};

export function Orders() {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [allOrders, setAllOrders] = useState<OrderWithDetails[]>([]);
  const [tables, setTables] = useState<CafeTable[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [paymentOrder, setPaymentOrder] = useState<Order | null>(null);
  const [detailOrder, setDetailOrder] = useState<OrderWithDetails | null>(null);
  const [showTodayOnly, setShowTodayOnly] = useState(false);
  const { profile } = useAuth();
  const { showToast } = useToast();

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    fetchData();
    subscribeToOrders();
  }, []);

  const fetchData = async () => {
    try {
      const [ordersRes, tablesRes, menuRes] = await Promise.all([
        supabase
          .from('orders')
          .select('*, cafe_tables(*), profiles(name)')
          .order('created_at', { ascending: false }),
        supabase.from('cafe_tables').select('*').order('table_number'),
        supabase.from('menu_items').select('*').eq('active', true),
      ]);

      if (ordersRes.error) throw ordersRes.error;
      if (tablesRes.error) throw tablesRes.error;
      if (menuRes.error) throw menuRes.error;

      const ordersData = ordersRes.data || [];
      setAllOrders(ordersData);
      filterOrders(ordersData, showTodayOnly);
      setTables(tablesRes.data || []);
      setMenuItems(menuRes.data || []);
    } catch (error) {
      showToast('Failed to load data', 'error');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = (ordersData: OrderWithDetails[], todayOnly: boolean) => {
    if (todayOnly) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const filtered = ordersData.filter((order) => {
        const orderDate = new Date(order.created_at);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === today.getTime();
      });
      setOrders(filtered);
    } else {
      setOrders(ordersData);
    }
  };

  const handleResetDay = () => {
    setShowTodayOnly(true);
    filterOrders(allOrders, true);
    showToast('Showing today\'s orders only', 'success');
  };

  const handleShowAll = () => {
    setShowTodayOnly(false);
    filterOrders(allOrders, false);
    showToast('Showing all orders', 'success');
  };

  useEffect(() => {
    filterOrders(allOrders, showTodayOnly);
  }, [showTodayOnly, allOrders]);

  const subscribeToOrders = () => {
    const channel = supabase
      .channel('orders_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;
      showToast('Order status updated', 'success');
      
      // Fetch updated order data
      const { data: updatedOrderData, error: fetchError } = await supabase
        .from('orders')
        .select('*, cafe_tables(*), profiles(name)')
        .eq('id', orderId)
        .single();

      if (!fetchError && updatedOrderData) {
        // Update detailOrder if modal is open
        if (detailOrder && detailOrder.id === orderId) {
          setDetailOrder(updatedOrderData);
        }
      }
      
      fetchData();
    } catch (error) {
      showToast('Failed to update order status', 'error');
      console.error('Error updating order:', error);
    }
  };

  const canEditOrder = (order: Order) => {
    if (order.status === 'paid') return false;
    if (isAdmin) return true;
    return order.employee_id === profile?.id && order.status !== 'delivered';
  };

  const openEditModal = (order: Order) => {
    if (!canEditOrder(order)) {
      showToast('You cannot edit this order', 'error');
      return;
    }
    setEditingOrder(order);
    setShowOrderModal(true);
  };

  const openPaymentModal = (order: Order) => {
    if (order.status !== 'delivered') {
      showToast('Order must be delivered before payment', 'error');
      return;
    }
    setPaymentOrder(order);
    setShowPaymentModal(true);
  };

  const openDetailModal = (order: OrderWithDetails) => {
    setDetailOrder(order);
    setShowDetailModal(true);
  };

  const statusColors = {
    taken: 'bg-blue-100 text-blue-800',
    prepared: 'bg-yellow-100 text-yellow-800',
    delivered: 'bg-green-100 text-green-800',
    paid: 'bg-gray-100 text-gray-800',
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
          <ShoppingCart className="w-8 h-8 text-orange-500" />
          <h2 className="text-2xl font-bold text-gray-800">Orders</h2>
          {showTodayOnly && (
            <span className="text-sm text-gray-600 bg-orange-100 px-3 py-1 rounded-full">
              Today Only
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setLoading(true);
              fetchData();
            }}
            className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            title="Refresh Orders"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh
          </button>
          {showTodayOnly ? (
            <button
              onClick={handleShowAll}
              className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Show All
            </button>
          ) : (
            <button
              onClick={handleResetDay}
              className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
              Reset Day
            </button>
          )}
          <button
            onClick={() => {
              setEditingOrder(null);
              setShowOrderModal(true);
            }}
            className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Order
          </button>
        </div>
      </div>

      <div className="grid gap-3">
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">No orders found</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-gray-800">
                      Table {order.cafe_tables?.table_number || 'N/A'}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                      {order.status.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">•</span>
                  <span className="text-sm text-gray-600">{order.items.length} items</span>
                  <span className="text-sm text-gray-500">•</span>
                  <span className="text-sm text-gray-600">{order.profiles?.name || 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-800">₹{order.total_price.toFixed(2)}</div>
                    {order.payment_method && (
                      <p className="text-xs text-gray-600 capitalize">{order.payment_method}</p>
                    )}
                  </div>
                  <button
                    onClick={() => openDetailModal(order)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <Info className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap mt-3 pt-3 border-t border-gray-200">
                {canEditOrder(order) && (
                  <button
                    onClick={() => openEditModal(order)}
                    className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors"
                  >
                    <Edit2 className="w-3 h-3" />
                    Edit
                  </button>
                )}

                {order.status === 'taken' && (
                  <button
                    onClick={() => handleStatusUpdate(order.id, 'prepared')}
                    className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs hover:bg-yellow-200 transition-colors"
                  >
                    <CheckCircle className="w-3 h-3" />
                    Prepared
                  </button>
                )}

                {order.status === 'prepared' && (
                  <button
                    onClick={() => handleStatusUpdate(order.id, 'delivered')}
                    className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 transition-colors"
                  >
                    <CheckCircle className="w-3 h-3" />
                    Delivered
                  </button>
                )}

                {isAdmin && order.status === 'delivered' && (
                  <button
                    onClick={() => openPaymentModal(order)}
                    className="flex items-center gap-1 px-2 py-1 bg-orange-500 text-white rounded text-xs hover:bg-orange-600 transition-colors"
                  >
                    <CreditCard className="w-3 h-3" />
                    Payment
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showOrderModal && (
        <OrderModal
          order={editingOrder}
          tables={tables}
          menuItems={menuItems}
          onClose={() => {
            setShowOrderModal(false);
            setEditingOrder(null);
          }}
          onSuccess={() => {
            setShowOrderModal(false);
            setEditingOrder(null);
            fetchData();
          }}
        />
      )}

      {showPaymentModal && paymentOrder && (
        <PaymentModal
          order={paymentOrder}
          onClose={() => {
            setShowPaymentModal(false);
            setPaymentOrder(null);
          }}
          onSuccess={() => {
            setShowPaymentModal(false);
            setPaymentOrder(null);
            fetchData();
          }}
        />
      )}

      {showDetailModal && detailOrder && (
        <OrderDetailModal
          order={detailOrder}
          onClose={() => {
            setShowDetailModal(false);
            setDetailOrder(null);
          }}
          onStatusUpdate={handleStatusUpdate}
          onPaymentClick={openPaymentModal}
          canUpdateStatus={detailOrder.status !== 'paid'}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}
