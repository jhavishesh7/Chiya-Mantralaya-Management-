import { useState, useEffect } from 'react';
import { supabase, Order, CafeTable, MenuItem, OrderItem } from '../lib/supabase';
import { X, Plus, Minus, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';

type Props = {
  order: Order | null;
  tables: CafeTable[];
  menuItems: MenuItem[];
  onClose: () => void;
  onSuccess: () => void;
};

export function OrderModal({ order, tables, menuItems, onClose, onSuccess }: Props) {
  const [selectedTable, setSelectedTable] = useState<string>(order?.table_id || '');
  const [orderItems, setOrderItems] = useState<OrderItem[]>(order?.items || []);
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();
  const { showToast } = useToast();

  const availableTables = tables.filter((t) => t.status === 'empty' || t.id === order?.table_id);

  const addMenuItem = (menuItem: MenuItem) => {
    const existing = orderItems.find((item) => item.item_id === menuItem.id);
    if (existing) {
      setOrderItems(
        orderItems.map((item) =>
          item.item_id === menuItem.id ? { ...item, qty: item.qty + 1 } : item
        )
      );
    } else {
      setOrderItems([
        ...orderItems,
        {
          item_id: menuItem.id,
          name: menuItem.name,
          qty: 1,
          price: menuItem.price,
        },
      ]);
    }
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setOrderItems(
      orderItems
        .map((item) =>
          item.item_id === itemId ? { ...item, qty: Math.max(0, item.qty + delta) } : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  const removeItem = (itemId: string) => {
    setOrderItems(orderItems.filter((item) => item.item_id !== itemId));
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + item.qty * item.price, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTable) {
      showToast('Please select a table', 'error');
      return;
    }

    if (orderItems.length === 0) {
      showToast('Please add at least one item', 'error');
      return;
    }

    setLoading(true);

    try {
      const totalPrice = calculateTotal();

      if (order) {
        const { data, error } = await supabase.rpc('edit_order', {
          p_order_id: order.id,
          p_items: orderItems,
          p_total_price: totalPrice,
          p_table_id: selectedTable,
        });

        if (error) throw error;
        if (data?.success) {
          showToast('Order updated successfully', 'success');
          onSuccess();
        }
      } else {
        const { error: insertError } = await supabase.from('orders').insert({
          table_id: selectedTable,
          employee_id: profile?.id,
          items: orderItems,
          status: 'taken',
          total_price: totalPrice,
        });

        if (insertError) throw insertError;

        const { error: tableError } = await supabase
          .from('cafe_tables')
          .update({ status: 'occupied' })
          .eq('id', selectedTable);

        if (tableError) throw tableError;

        showToast('Order created successfully', 'success');
        onSuccess();
      }
    } catch (error) {
      showToast('Failed to save order', 'error');
      console.error('Error saving order:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupedMenuItems = menuItems.reduce((acc, item) => {
    const category = item.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-4xl w-full my-8">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-2xl font-bold text-gray-800">
            {order ? 'Edit Order' : 'New Order'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Table
              </label>
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Choose a table...</option>
                {availableTables.map((table) => (
                  <option key={table.id} value={table.id}>
                    Table {table.table_number} ({table.status})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Add Items</h4>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {Object.entries(groupedMenuItems).map(([category, items]) => (
                    <div key={category}>
                      <h5 className="text-sm font-semibold text-gray-600 mb-2">{category}</h5>
                      <div className="space-y-2">
                        {items.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => addMenuItem(item)}
                            className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-orange-50 rounded-lg transition-colors text-left"
                          >
                            <span className="text-sm font-medium text-gray-800">{item.name}</span>
                            <span className="text-sm text-gray-600">₹{item.price.toFixed(2)}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Order Items</h4>
                {orderItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No items added yet
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                    {orderItems.map((item) => (
                      <div
                        key={item.item_id}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">{item.name}</div>
                          <div className="text-sm text-gray-600">
                            ₹{item.price.toFixed(2)} each
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.item_id, -1)}
                            className="p-1 bg-white rounded hover:bg-gray-100"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-semibold">{item.qty}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.item_id, 1)}
                            className="p-1 bg-white rounded hover:bg-gray-100"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeItem(item.item_id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded ml-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {orderItems.length > 0 && (
                  <div className="mt-4 p-4 bg-orange-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-800">Total:</span>
                      <span className="text-2xl font-bold text-orange-600">
                        ₹{calculateTotal().toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 p-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || orderItems.length === 0}
              className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : order ? 'Update Order' : 'Create Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
