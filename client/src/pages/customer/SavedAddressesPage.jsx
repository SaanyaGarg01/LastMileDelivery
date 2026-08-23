import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { MapPin, Plus, Trash2, Check, Star, RefreshCw, Building, Home, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SavedAddressesPage() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [label, setLabel] = useState('Home');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('Mumbai');
  const [state, setState] = useState('Maharashtra');
  const [pincode, setPincode] = useState('');
  const [landmark, setLandmark] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const res = await api.get('/customer/addresses');
      if (res.data.success) {
        setAddresses(res.data.addresses || []);
      }
    } catch {
      toast.error('Failed to load addresses');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!addressLine.trim() || !pincode.trim() || !contactName.trim() || !contactPhone.trim()) {
      toast.error('Please fill all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/customer/addresses', {
        label,
        addressLine,
        city,
        state,
        pincode,
        landmark,
        contactName,
        contactPhone,
        isDefault,
      });

      if (res.data.success) {
        toast.success('Address saved successfully');
        setShowAddModal(false);
        // Reset form
        setAddressLine('');
        setPincode('');
        setLandmark('');
        setContactName('');
        setContactPhone('');
        fetchAddresses();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save address');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    try {
      const res = await api.delete(`/customer/addresses/${id}`);
      if (res.data.success) {
        toast.success('Address deleted');
        fetchAddresses();
      }
    } catch {
      toast.error('Failed to delete address');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <MapPin className="w-5 h-5 text-sky-600" /> SAVED ADDRESSES
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage your home, office, and frequent delivery address book.</p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> ADD NEW ADDRESS
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin text-sky-600 mx-auto mb-2" />
          Loading saved addresses...
        </div>
      ) : addresses.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 space-y-3">
          <MapPin className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-extrabold text-slate-700 text-sm">No Saved Addresses</h3>
          <p className="text-xs text-slate-400">Add your frequently used pickup and drop addresses for 1-click order creation.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {addresses.map((a) => (
            <div key={a.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {a.label === 'Home' ? <Home className="w-4 h-4 text-sky-600" /> : a.label === 'Work' ? <Briefcase className="w-4 h-4 text-purple-600" /> : <Building className="w-4 h-4 text-emerald-600" />}
                  <span className="font-extrabold text-slate-900 text-sm">{a.label}</span>
                  {a.isDefault && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">DEFAULT</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteAddress(a.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-slate-600 space-y-1">
                <p className="font-bold text-slate-900">{a.addressLine}</p>
                <p>{a.city}, {a.state} — <span className="font-mono font-bold text-sky-700">{a.pincode}</span></p>
                {a.landmark && <p className="text-slate-400 italic">Landmark: {a.landmark}</p>}
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-500">
                <span>Contact: <strong>{a.contactName}</strong></span>
                <span className="font-mono">📱 {a.contactPhone}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Address Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-sky-600 to-indigo-600 text-white flex items-center justify-between">
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Add New Address
              </h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-white/80 hover:text-white font-bold text-lg">×</button>
            </div>

            <form onSubmit={handleSaveAddress} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Address Label</label>
                <select
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold"
                >
                  <option value="Home">Home</option>
                  <option value="Work">Work</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Street Address *</label>
                <input
                  type="text"
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  placeholder="House/Flat No., Building, Street"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">City *</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pincode *</label>
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="6 digits"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Name *</label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Recipient Name"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Phone *</label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="Mobile Number"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-bold"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 pt-2 cursor-pointer font-bold text-slate-700">
                <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} className="rounded text-sky-600" />
                <span>Set as default address</span>
              </label>

              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold flex items-center justify-center gap-1.5">
                  {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {submitting ? 'Saving...' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
