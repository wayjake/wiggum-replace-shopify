// 📍 Addresses - Where your soap dreams arrive
// "That's where I saw the leprechaun. He tells me to burn things." - Ralph on delivery locations

import { createFileRoute, Link } from '@tanstack/react-router';
import { MapPin, Plus, ChevronRight, Trash2, Star, Edit, Home, Building } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../utils';

export const Route = createFileRoute('/account/addresses')({
  head: () => ({
    meta: [
      { title: "Addresses | My Account | Karen's Beautiful Soap" },
      { name: 'description', content: 'Manage your shipping and billing addresses.' },
    ],
  }),
  component: AddressesPage,
});

// ═══════════════════════════════════════════════════════════
// SAMPLE DATA
// ═══════════════════════════════════════════════════════════

const ADDRESSES = [
  {
    id: '1',
    label: 'Home',
    name: 'Sarah Mitchell',
    street: '123 Main Street',
    city: 'Portland',
    state: 'OR',
    zip: '97201',
    country: 'United States',
    phone: '(503) 555-0123',
    isDefault: true,
    type: 'home',
  },
  {
    id: '2',
    label: 'Office',
    name: 'Sarah Mitchell',
    street: '456 Business Ave, Suite 200',
    city: 'Portland',
    state: 'OR',
    zip: '97204',
    country: 'United States',
    phone: '(503) 555-0456',
    isDefault: false,
    type: 'work',
  },
];

function AddressesPage() {
  const [addresses, setAddresses] = useState(ADDRESSES);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [editingAddress, setEditingAddress] = useState<typeof ADDRESSES[0] | null>(null);

  const setDefaultAddress = (id: string) => {
    setAddresses(addresses.map(a => ({ ...a, isDefault: a.id === id })));
  };

  const deleteAddress = (id: string) => {
    setAddresses(addresses.filter(a => a.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      {/* Header */}
      <header className="bg-white border-b border-[#F5EBE0]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#2D5A4A] rounded-full flex items-center justify-center">
                <span className="text-xl">🧼</span>
              </div>
              <span className="text-xl font-bold text-[#1A1A1A] font-display">Karen's Beautiful Soap</span>
            </Link>
            <nav className="flex items-center gap-6">
              <Link to="/shop" className="text-gray-600 hover:text-[#2D5A4A]">Shop</Link>
              <Link to="/account" className="text-[#2D5A4A] font-medium">My Account</Link>
              <Link to="/cart" className="text-gray-600 hover:text-[#2D5A4A]">Cart</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/account" className="hover:text-[#2D5A4A]">My Account</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-[#1A1A1A]">Addresses</span>
        </nav>

        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A] font-display">Addresses</h1>
            <p className="text-gray-600">Manage your shipping and billing addresses</p>
          </div>
          <button
            onClick={() => setShowAddAddress(true)}
            className="flex items-center gap-2 bg-[#2D5A4A] text-white px-4 py-2 rounded-lg hover:bg-[#1A1A1A] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Address
          </button>
        </div>

        {/* Addresses List */}
        <div className="space-y-4">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={cn(
                'bg-white rounded-xl border-2 p-6 transition-all',
                address.isDefault ? 'border-[#2D5A4A]' : 'border-[#F5EBE0]'
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    address.type === 'home' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                  )}>
                    {address.type === 'home' ? <Home className="w-5 h-5" /> : <Building className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-[#1A1A1A]">{address.label}</p>
                      {address.isDefault && (
                        <span className="flex items-center gap-1 text-xs bg-[#2D5A4A] text-white px-2 py-0.5 rounded-full">
                          <Star className="w-3 h-3" />
                          Default
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 space-y-0.5">
                      <p>{address.name}</p>
                      <p>{address.street}</p>
                      <p>{address.city}, {address.state} {address.zip}</p>
                      <p>{address.country}</p>
                      {address.phone && <p className="mt-2">{address.phone}</p>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingAddress(address)}
                    className="p-2 text-gray-400 hover:text-[#2D5A4A] transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteAddress(address.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {!address.isDefault && (
                <button
                  onClick={() => setDefaultAddress(address.id)}
                  className="mt-4 text-sm text-[#2D5A4A] hover:underline"
                >
                  Set as default
                </button>
              )}
            </div>
          ))}
        </div>

        {addresses.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-[#F5EBE0]">
            <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2 font-display">No addresses saved</h3>
            <p className="text-gray-500 mb-6">Add an address for faster checkout</p>
            <button
              onClick={() => setShowAddAddress(true)}
              className="inline-flex items-center gap-2 bg-[#2D5A4A] text-white px-6 py-3 rounded-lg hover:bg-[#1A1A1A] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Your First Address
            </button>
          </div>
        )}

        {/* Add/Edit Address Modal */}
        {(showAddAddress || editingAddress) && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-[#1A1A1A] mb-6 font-display">
                {editingAddress ? 'Edit Address' : 'Add Address'}
              </h2>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <button className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-all',
                    'border-[#2D5A4A] bg-[#2D5A4A]/5'
                  )}>
                    <Home className="w-4 h-4" />
                    Home
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 border-[#F5EBE0] text-gray-600 hover:border-[#D4A574]">
                    <Building className="w-4 h-4" />
                    Work
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    defaultValue={editingAddress?.name || ''}
                    placeholder="Sarah Mitchell"
                    className="w-full px-4 py-3 rounded-lg border border-[#F5EBE0] focus:outline-none focus:border-[#2D5A4A]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                  <input
                    type="text"
                    defaultValue={editingAddress?.street || ''}
                    placeholder="123 Main Street"
                    className="w-full px-4 py-3 rounded-lg border border-[#F5EBE0] focus:outline-none focus:border-[#2D5A4A]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <input
                      type="text"
                      defaultValue={editingAddress?.city || ''}
                      placeholder="Portland"
                      className="w-full px-4 py-3 rounded-lg border border-[#F5EBE0] focus:outline-none focus:border-[#2D5A4A]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                    <input
                      type="text"
                      defaultValue={editingAddress?.state || ''}
                      placeholder="OR"
                      className="w-full px-4 py-3 rounded-lg border border-[#F5EBE0] focus:outline-none focus:border-[#2D5A4A]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
                    <input
                      type="text"
                      defaultValue={editingAddress?.zip || ''}
                      placeholder="97201"
                      className="w-full px-4 py-3 rounded-lg border border-[#F5EBE0] focus:outline-none focus:border-[#2D5A4A]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      defaultValue={editingAddress?.phone || ''}
                      placeholder="(503) 555-0123"
                      className="w-full px-4 py-3 rounded-lg border border-[#F5EBE0] focus:outline-none focus:border-[#2D5A4A]"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    defaultChecked={editingAddress?.isDefault}
                    className="rounded border-gray-300 text-[#2D5A4A]"
                  />
                  <span className="text-sm text-gray-600">Set as default address</span>
                </label>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => { setShowAddAddress(false); setEditingAddress(null); }}
                  className="flex-1 py-3 rounded-lg border border-[#F5EBE0] text-gray-600 hover:bg-[#F5EBE0] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { setShowAddAddress(false); setEditingAddress(null); }}
                  className="flex-1 py-3 rounded-lg bg-[#2D5A4A] text-white hover:bg-[#1A1A1A] transition-colors"
                >
                  {editingAddress ? 'Save Changes' : 'Add Address'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
