import React, { useState, useEffect } from 'react';
import { inventoryAPI } from '../src/api/services';
import { toast } from 'react-toastify';

function InventoryTable() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState([]);
  const [alerts, setAlerts] = useState(null);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await inventoryAPI.getInventory();
      if (response.data.success) {
        setSummary(response.data.summary || []);
        setAlerts(response.data.alerts);
        
        // Flatten inventory items for table display
        const items = [];
        Object.values(response.data.detailed || {}).forEach(group => {
          group.items.forEach(item => {
            items.push(item);
          });
        });
        setInventory(items);
      }
    } catch (error) {
      toast.error('Failed to load inventory');
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (id) => {
    // Implement edit functionality
    console.log('Edit item:', id);
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this entry?')) {
      try {
        await inventoryAPI.deleteInventory(id);
        toast.success('Item deleted successfully');
        fetchInventory(); // Refresh
      } catch (error) {
        toast.error('Failed to delete item');
      }
    }
  };

  const handleAddStock = () => {
    // Implement add stock modal/form
    alert('Add stock functionality - to be implemented');
  };

  const handleExport = () => {
    // Implement export functionality
    const csvContent = [
      ['Blood Group', 'Component Type', 'Units Available', 'Expiry Date', 'Status'].join(','),
      ...inventory.map(item => 
        [item.bloodGroup, item.componentType, item.availableUnits, 
         new Date(item.expiryDate).toLocaleDateString(), item.status].join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      {/* Alerts Section */}
      {alerts && (alerts.expiringSoon?.length > 0 || alerts.lowStock?.length > 0) && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Inventory Alerts</h3>
              <div className="mt-2 text-sm text-yellow-700">
                {alerts.expiringSoon?.length > 0 && (
                  <p>⚠️ {alerts.expiringSoon.length} items expiring soon</p>
                )}
                {alerts.lowStock?.length > 0 && (
                  <p>🔴 {alerts.lowStock.length} blood groups low in stock</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {summary.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {summary.map(item => (
            <div key={item.bloodGroup} className="bg-white p-3 rounded-lg shadow border">
              <div className="text-sm text-gray-500">{item.bloodGroup}</div>
              <div className="text-xl font-bold">{item.availableUnits} units</div>
              {item.availableUnits <= 5 && (
                <span className="text-xs text-red-600">Low stock</span>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-red-700">Blood Inventory</h2>
        <div className="space-x-3">
          <button
            onClick={handleAddStock}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            + Add Stock
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Export Data
          </button>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="min-w-full text-sm text-left border">
          <thead className="bg-red-100">
            <tr>
              <th className="px-4 py-2">Blood Group</th>
              <th className="px-4 py-2">Component</th>
              <th className="px-4 py-2">Units Available</th>
              <th className="px-4 py-2">Reserved</th>
              <th className="px-4 py-2">Expiry Date</th>
              <th className="px-4 py-2">Days Left</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {inventory.length > 0 ? (
              inventory.map((item) => (
                <tr key={item._id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2 font-bold">{item.bloodGroup}</td>
                  <td className="px-4 py-2">{item.componentType}</td>
                  <td className="px-4 py-2">{item.availableUnits}</td>
                  <td className="px-4 py-2">{item.reservedUnits || 0}</td>
                  <td className="px-4 py-2">{new Date(item.expiryDate).toLocaleDateString()}</td>
                  <td className="px-4 py-2">
                    <span className={`${item.daysToExpiry < 7 ? 'text-red-600 font-bold' : ''}`}>
                      {item.daysToExpiry} days
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      item.status === 'Available' ? 'bg-green-100 text-green-700' :
                      item.status === 'Reserved' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 space-x-2">
                    <button
                      onClick={() => handleEdit(item._id)}
                      className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                      disabled={item.reservedUnits > 0}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="text-center py-8 text-gray-500">
                  No inventory records found. Click "Add Stock" to add your first item.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default InventoryTable;