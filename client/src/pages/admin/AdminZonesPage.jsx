import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import {
  MapPin, Plus, Trash2, X, Search, Edit3, ToggleLeft, ToggleRight,
  Network, Package, AlertTriangle, CheckCircle2, Grid3x3, List,
  ChevronDown, ChevronUp, Download, Upload, RefreshCw, Info,
  ArrowRightLeft, Hash, Layers
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Zone Status Badge ────────────────────────────────────────────────────────
function ZoneStatusBadge({ isActive }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
      isActive ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}

// ─── Zone Type Badge ──────────────────────────────────────────────────────────
function ZoneTypeBadge({ count }) {
  const color = count === 0 ? 'text-rose-600 bg-rose-50 border-rose-200'
    : count < 3 ? 'text-amber-600 bg-amber-50 border-amber-200'
    : 'text-emerald-700 bg-emerald-50 border-emerald-200';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${color}`}>
      <Hash className="w-3 h-3" /> {count} area{count !== 1 ? 's' : ''}
    </span>
  );
}

// ─── Confirm Delete Modal ─────────────────────────────────────────────────────
function ConfirmDeleteModal({ zone, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-100 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-rose-600" />
        </div>
        <div>
          <h3 className="text-base font-extrabold text-slate-900">Delete Zone?</h3>
          <p className="text-xs text-slate-500 mt-1">
            This will permanently remove <span className="font-bold text-slate-800">{zone.name}</span> and all{' '}
            <span className="font-bold text-rose-600">{zone.areas?.length || 0} pincode mapping(s)</span> associated with it.
          </p>
        </div>
        {zone.areas?.length > 0 && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 text-left">
            ⚠️ Orders referencing this zone will not be deleted, but zone lookups may fail for future orders.
          </div>
        )}
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-500">
            Yes, Delete Zone
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Zone Card (Grid View) ────────────────────────────────────────────────────
function ZoneCard({ zone, onAddArea, onDeleteArea, onToggleActive, onEdit, onDeleteZone, expanded, onToggleExpand }) {
  return (
    <div className={`rounded-2xl bg-white border shadow-sm transition-all duration-200 overflow-hidden ${
      zone.isActive ? 'border-slate-200' : 'border-slate-200 opacity-60'
    }`}>
      {/* Card Header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              zone.isActive ? 'bg-sky-100' : 'bg-slate-100'
            }`}>
              <MapPin className={`w-5 h-5 ${zone.isActive ? 'text-sky-600' : 'text-slate-400'}`} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">{zone.name}</h3>
              <code className="text-[10px] font-mono font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100">
                {zone.code}
              </code>
            </div>
          </div>
          <ZoneStatusBadge isActive={zone.isActive} />
        </div>

        {zone.description && (
          <p className="text-xs text-slate-500 mb-3 leading-relaxed">{zone.description}</p>
        )}

        {/* Stats Row */}
        <div className="flex items-center gap-2 mb-3">
          <ZoneTypeBadge count={zone.areas?.length || 0} />
          <span className="text-[10px] text-slate-400">
            Created {new Date(zone.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => onAddArea(zone)}
            className="px-2.5 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-[11px] border border-sky-200 flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Add Area
          </button>
          <button
            onClick={() => onEdit(zone)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] flex items-center gap-1"
          >
            <Edit3 className="w-3 h-3" /> Edit
          </button>
          <button
            onClick={() => onToggleActive(zone)}
            className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] flex items-center gap-1 ${
              zone.isActive
                ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
            }`}
          >
            {zone.isActive ? <ToggleLeft className="w-3 h-3" /> : <ToggleRight className="w-3 h-3" />}
            {zone.isActive ? 'Deactivate' : 'Activate'}
          </button>
          <button
            onClick={() => onDeleteZone(zone)}
            className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-[11px] flex items-center gap-1 border border-rose-200"
          >
            <Trash2 className="w-3 h-3" /> Delete
          </button>
        </div>
      </div>

      {/* Pincode Area Accordion */}
      <div className="border-t border-slate-100">
        <button
          onClick={onToggleExpand}
          className="w-full flex items-center justify-between px-5 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50"
        >
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            Pincode Mappings ({zone.areas?.length || 0})
          </span>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {expanded && (
          <div className="px-5 pb-4 space-y-1.5 max-h-52 overflow-y-auto">
            {zone.areas?.length === 0 ? (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-xs text-slate-400">
                <Info className="w-4 h-4" /> No pincodes mapped to this zone yet.
              </div>
            ) : (
              zone.areas.map((area) => (
                <div key={area.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs group">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-sky-500" />
                    <span className="font-semibold text-slate-800">{area.areaName}</span>
                    <span className="font-mono font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded text-[10px] border border-sky-100">
                      {area.pincode}
                    </span>
                  </div>
                  <button
                    onClick={() => onDeleteArea(area.id, area.areaName)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-rose-500 p-1 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Zone Stats Summary Bar ───────────────────────────────────────────────────
function ZoneSummaryBar({ zones }) {
  const totalAreas = zones.reduce((sum, z) => sum + (z.areas?.length || 0), 0);
  const activeZones = zones.filter((z) => z.isActive).length;
  const emptyZones = zones.filter((z) => !z.areas?.length).length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {[
        { label: 'Total Zones', value: zones.length, icon: Network, color: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200' },
        { label: 'Active Zones', value: activeZones, icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
        { label: 'Total Pincodes', value: totalAreas, icon: Hash, color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
        { label: 'Unconfigured', value: emptyZones, icon: AlertTriangle, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
      ].map(({ label, value, icon: Icon, color, bg, border }) => (
        <div key={label} className={`flex items-center gap-3 p-4 rounded-2xl ${bg} border ${border}`}>
          <div className={`w-9 h-9 rounded-xl bg-white flex items-center justify-center border ${border}`}>
            <Icon className={`w-4.5 h-4.5 ${color}`} style={{ width: 18, height: 18 }} />
          </div>
          <div>
            <p className={`text-xl font-extrabold ${color}`}>{value}</p>
            <p className="text-[10px] font-semibold text-slate-500">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Pincode Lookup Tool ──────────────────────────────────────────────────────
function PincodeLookupPanel({ zones }) {
  const [query, setQuery] = useState('');

  const allAreas = useMemo(() =>
    zones.flatMap((z) =>
      (z.areas || []).map((a) => ({ ...a, zoneName: z.name, zoneCode: z.code, zoneActive: z.isActive }))
    ), [zones]
  );

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.trim().toLowerCase();
    return allAreas.filter(
      (a) => a.pincode.includes(q) || a.areaName.toLowerCase().includes(q) || a.zoneName.toLowerCase().includes(q)
    );
  }, [query, allAreas]);

  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Search className="w-4 h-4 text-sky-600" />
        <h3 className="text-sm font-extrabold text-slate-900">Pincode Lookup</h3>
        <span className="text-[10px] text-slate-400 font-medium">Search by pincode, area, or zone name</span>
      </div>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. 110001 or South Delhi or Cyber City..."
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 pr-9 focus:outline-none focus:ring-2 focus:ring-sky-300"
        />
        {query && (
          <button onClick={() => setQuery('')} className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {query.trim() && (
        <div className="space-y-1.5">
          {results.length === 0 ? (
            <p className="text-xs text-slate-400 italic p-2">No matching pincode or area found</p>
          ) : (
            results.map((a) => (
              <div key={a.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-sky-500" />
                  <span className="font-semibold text-slate-800">{a.areaName}</span>
                  <span className="font-mono font-bold text-sky-700">{a.pincode}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-600">{a.zoneName}</span>
                  <code className="text-[10px] font-mono bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded border border-sky-100">{a.zoneCode}</code>
                  <ZoneStatusBadge isActive={a.zoneActive} />
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Zone vs Zone Routing Table ───────────────────────────────────────────────
function ZoneRoutingMatrix({ zones }) {
  const activeZones = zones.filter((z) => z.isActive);
  if (activeZones.length === 0) return null;

  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <ArrowRightLeft className="w-4 h-4 text-purple-600" />
        <h3 className="text-sm font-extrabold text-slate-900">Zone Routing Matrix</h3>
        <span className="text-[10px] text-slate-400">INTRA = same zone · INTER = cross-zone</span>
      </div>
      <div className="overflow-x-auto">
        <table className="text-[10px] font-mono border-collapse">
          <thead>
            <tr>
              <th className="p-2 border border-slate-200 bg-slate-50 text-slate-600 text-left font-bold">FROM ↓ / TO →</th>
              {activeZones.map((z) => (
                <th key={z.id} className="p-2 border border-slate-200 bg-slate-50 text-slate-700 font-extrabold">{z.code}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {activeZones.map((from) => (
              <tr key={from.id}>
                <td className="p-2 border border-slate-200 bg-slate-50 font-extrabold text-slate-700">{from.code}</td>
                {activeZones.map((to) => (
                  <td key={to.id} className={`p-2 border border-slate-200 text-center font-bold ${
                    from.id === to.id
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-indigo-50 text-indigo-700'
                  }`}>
                    {from.id === to.id ? 'INTRA' : 'INTER'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminZonesPage() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // grid | list
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all | active | inactive | empty
  const [expandedZones, setExpandedZones] = useState({});

  // New Zone Modal
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');

  // New Area Modal
  const [showAreaModal, setShowAreaModal] = useState(false);
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [areaName, setAreaName] = useState('');
  const [pincode, setPincode] = useState('');
  const [bulkPincodes, setBulkPincodes] = useState('');
  const [bulkMode, setBulkMode] = useState(false);

  // Delete Confirm
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => { fetchZones(); }, []);

  const fetchZones = async () => {
    try {
      const res = await api.get('/admin/zones');
      if (res.data.success) setZones(res.data.zones);
    } catch {
      toast.error('Failed to load zones');
    } finally {
      setLoading(false);
    }
  };

  // ── Filtering & Search ──────────────────────────────────────────────────────
  const filteredZones = useMemo(() => {
    let list = zones;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (z) =>
          z.name.toLowerCase().includes(q) ||
          z.code.toLowerCase().includes(q) ||
          (z.description || '').toLowerCase().includes(q) ||
          (z.areas || []).some((a) => a.pincode.includes(q) || a.areaName.toLowerCase().includes(q))
      );
    }
    if (filterStatus === 'active') list = list.filter((z) => z.isActive);
    if (filterStatus === 'inactive') list = list.filter((z) => !z.isActive);
    if (filterStatus === 'empty') list = list.filter((z) => !z.areas?.length);
    return list;
  }, [zones, searchQuery, filterStatus]);

  // ── Create / Edit Zone ──────────────────────────────────────────────────────
  const openCreateZone = () => {
    setEditingZone(null);
    setName(''); setCode(''); setDescription('');
    setShowZoneModal(true);
  };

  const openEditZone = (zone) => {
    setEditingZone(zone);
    setName(zone.name);
    setCode(zone.code);
    setDescription(zone.description || '');
    setShowZoneModal(true);
  };

  const handleSubmitZone = async (e) => {
    e.preventDefault();
    try {
      if (editingZone) {
        const res = await api.patch(`/admin/zones/${editingZone.id}`, { name, code, description });
        if (res.data.success) toast.success('Zone updated successfully');
      } else {
        const res = await api.post('/admin/zones', { name, code, description });
        if (res.data.success) toast.success('Zone created successfully');
      }
      setShowZoneModal(false);
      fetchZones();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save zone');
    }
  };

  // ── Toggle Active ───────────────────────────────────────────────────────────
  const handleToggleActive = async (zone) => {
    try {
      await api.patch(`/admin/zones/${zone.id}`, { isActive: !zone.isActive });
      toast.success(`Zone ${zone.isActive ? 'deactivated' : 'activated'}`);
      fetchZones();
    } catch {
      toast.error('Failed to update zone status');
    }
  };

  // ── Create Area ─────────────────────────────────────────────────────────────
  const openAddArea = (zone) => {
    setSelectedZoneId(zone.id);
    setAreaName(''); setPincode(''); setBulkPincodes('');
    setBulkMode(false);
    setShowAreaModal(true);
  };

  const handleCreateArea = async (e) => {
    e.preventDefault();
    try {
      if (bulkMode) {
        // Parse bulk pincodes: "AreaName: 110001, 110002"
        const lines = bulkPincodes.split('\n').filter((l) => l.trim());
        let created = 0;
        for (const line of lines) {
          const parts = line.split(',');
          for (const part of parts) {
            const [area, pin] = part.includes(':') ? part.split(':') : [areaName, part];
            const cleanPin = pin?.trim();
            const cleanArea = area?.trim() || areaName;
            if (cleanPin && /^\d{6}$/.test(cleanPin)) {
              await api.post('/admin/zone-areas', { zoneId: selectedZoneId, areaName: cleanArea || 'Area', pincode: cleanPin });
              created++;
            }
          }
        }
        toast.success(`${created} pincode(s) mapped successfully`);
      } else {
        await api.post('/admin/zone-areas', { zoneId: selectedZoneId, areaName, pincode });
        toast.success('Pincode area mapped successfully');
      }
      setShowAreaModal(false);
      fetchZones();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to map area');
    }
  };

  // ── Delete Area ─────────────────────────────────────────────────────────────
  const handleDeleteArea = async (areaId, areaName) => {
    try {
      await api.delete(`/admin/zone-areas/${areaId}`);
      toast.success(`Removed "${areaName}" mapping`);
      fetchZones();
    } catch {
      toast.error('Failed to delete area');
    }
  };

  // ── Delete Zone ─────────────────────────────────────────────────────────────
  const handleDeleteZone = async () => {
    if (!deleteTarget) return;
    try {
      // Try to delete via API (will cascade areas)
      await api.delete(`/admin/zones/${deleteTarget.id}`);
      toast.success(`Zone "${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
      fetchZones();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete zone — it may be used by active orders');
      setDeleteTarget(null);
    }
  };

  const toggleExpand = (id) => setExpandedZones((prev) => ({ ...prev, [id]: !prev[id] }));

  // ── Export CSV ──────────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    const rows = [['Zone Name', 'Zone Code', 'Status', 'Area Name', 'Pincode', 'Created']];
    zones.forEach((z) => {
      if (!z.areas?.length) {
        rows.push([z.name, z.code, z.isActive ? 'Active' : 'Inactive', '', '', new Date(z.createdAt).toLocaleDateString()]);
      } else {
        z.areas.forEach((a) =>
          rows.push([z.name, z.code, z.isActive ? 'Active' : 'Inactive', a.areaName, a.pincode, new Date(z.createdAt).toLocaleDateString()])
        );
      }
    });
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'zone-config.csv'; a.click();
    toast.success('Zone configuration exported');
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-20 rounded-2xl bg-slate-100" />
        <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-slate-100" />)}</div>
        <div className="grid grid-cols-3 gap-4">{[...Array(3)].map((_, i) => <div key={i} className="h-52 rounded-2xl bg-slate-100" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Network className="w-5 h-5 text-sky-600" /> Zone Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure operational zones, map pincodes, and control zone routing for order assignment
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={handleExportCSV} className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button onClick={fetchZones} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowAreaModal(true) || setSelectedZoneId('')}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" /> Map Pincode
          </button>
          <button
            onClick={openCreateZone}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" /> New Zone
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <ZoneSummaryBar zones={zones} />

      {/* Pincode Lookup Tool */}
      <PincodeLookupPanel zones={zones} />

      {/* Filter & View Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search zones or pincodes..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-300"
          />
        </div>

        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 text-xs">
          {['all', 'active', 'inactive', 'empty'].map((f) => (
            <button
              key={f}
              onClick={() => setFilterStatus(f)}
              className={`px-3 py-1.5 rounded-lg font-bold capitalize transition-all ${
                filterStatus === f ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {f === 'empty' ? 'Unconfigured' : f}
            </button>
          ))}
        </div>

        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-sky-600' : 'text-slate-400'}`}
          >
            <Grid3x3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-sky-600' : 'text-slate-400'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>

        <span className="text-xs text-slate-400 font-medium">
          {filteredZones.length} of {zones.length} zones
        </span>
      </div>

      {/* Zones Grid / List */}
      {filteredZones.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-dashed border-slate-300">
          <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-400">No zones found</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting filters or create a new zone</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredZones.map((zone) => (
            <ZoneCard
              key={zone.id}
              zone={zone}
              onAddArea={openAddArea}
              onDeleteArea={handleDeleteArea}
              onToggleActive={handleToggleActive}
              onEdit={openEditZone}
              onDeleteZone={setDeleteTarget}
              expanded={!!expandedZones[zone.id]}
              onToggleExpand={() => toggleExpand(zone.id)}
            />
          ))}
        </div>
      ) : (
        /* List View */
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-extrabold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-4">Zone</th>
                <th className="p-4">Code</th>
                <th className="p-4">Status</th>
                <th className="p-4">Pincodes</th>
                <th className="p-4">Description</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredZones.map((zone) => (
                <React.Fragment key={zone.id}>
                  <tr className="hover:bg-slate-50/80">
                    <td className="p-4 font-bold text-slate-900">{zone.name}</td>
                    <td className="p-4">
                      <code className="text-[10px] font-mono font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-100">{zone.code}</code>
                    </td>
                    <td className="p-4"><ZoneStatusBadge isActive={zone.isActive} /></td>
                    <td className="p-4"><ZoneTypeBadge count={zone.areas?.length || 0} /></td>
                    <td className="p-4 text-slate-500 max-w-xs truncate">{zone.description || '—'}</td>
                    <td className="p-4 text-right space-x-1.5">
                      <button onClick={() => toggleExpand(zone.id)} className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px]">
                        {expandedZones[zone.id] ? 'Hide' : 'Areas'}
                      </button>
                      <button onClick={() => openAddArea(zone)} className="px-2 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold text-[11px] border border-sky-200">
                        + Area
                      </button>
                      <button onClick={() => openEditZone(zone)} className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px]">
                        Edit
                      </button>
                      <button onClick={() => handleToggleActive(zone)} className={`px-2 py-1 rounded-lg font-bold text-[11px] ${zone.isActive ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                        {zone.isActive ? 'Disable' : 'Enable'}
                      </button>
                      <button onClick={() => setDeleteTarget(zone)} className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-[11px]">
                        Del
                      </button>
                    </td>
                  </tr>
                  {expandedZones[zone.id] && (
                    <tr>
                      <td colSpan={6} className="px-6 pb-4 bg-slate-50">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3">
                          {zone.areas?.length === 0 ? (
                            <span className="col-span-4 text-xs text-slate-400 italic">No pincodes mapped</span>
                          ) : zone.areas.map((a) => (
                            <div key={a.id} className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-xs group">
                              <div>
                                <span className="font-semibold text-slate-800 block">{a.areaName}</span>
                                <span className="font-mono text-sky-700">{a.pincode}</span>
                              </div>
                              <button onClick={() => handleDeleteArea(a.id, a.areaName)} className="opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-600 ml-2">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Zone Routing Matrix */}
      <ZoneRoutingMatrix zones={zones} />

      {/* ── Create/Edit Zone Modal ────────────────────────────────────────────── */}
      {showZoneModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">{editingZone ? 'Edit Zone' : 'Create Operational Zone'}</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">{editingZone ? 'Update zone name, code, or description' : 'Define a new geographic delivery zone'}</p>
              </div>
              <button onClick={() => setShowZoneModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitZone} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Zone Name <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. South Delhi Hub"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-300"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Zone Code <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. DELHI_SOUTH"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono uppercase text-sky-700 tracking-wide focus:outline-none focus:ring-2 focus:ring-sky-300"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">Used internally for zone routing logic (INTRA/INTER detection)</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Coverage area details, operational notes..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 h-20 resize-none focus:outline-none focus:ring-2 focus:ring-sky-300"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowZoneModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-sky-600 text-white font-bold hover:bg-sky-500">
                  {editingZone ? 'Update Zone' : 'Create Zone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Map Area Modal ────────────────────────────────────────────────────── */}
      {showAreaModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Map Pincode to Zone</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Associate delivery area pincodes with an operational zone</p>
              </div>
              <button onClick={() => setShowAreaModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Bulk / Single Toggle */}
            <div className="flex gap-2 text-xs">
              <button
                type="button"
                onClick={() => setBulkMode(false)}
                className={`flex-1 py-2 rounded-xl font-bold border transition-all ${!bulkMode ? 'bg-sky-600 text-white border-sky-600' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
              >
                Single Entry
              </button>
              <button
                type="button"
                onClick={() => setBulkMode(true)}
                className={`flex-1 py-2 rounded-xl font-bold border transition-all ${bulkMode ? 'bg-sky-600 text-white border-sky-600' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
              >
                Bulk Import
              </button>
            </div>

            <form onSubmit={handleCreateArea} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Zone <span className="text-rose-500">*</span></label>
                <select
                  value={selectedZoneId}
                  onChange={(e) => setSelectedZoneId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-300"
                  required
                >
                  <option value="">Choose Target Zone</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>{z.name} ({z.code}) — {z.areas?.length || 0} areas</option>
                  ))}
                </select>
              </div>

              {!bulkMode ? (
                <>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Area / Locality Name <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      value={areaName}
                      onChange={(e) => setAreaName(e.target.value)}
                      placeholder="e.g. Cyber City Sector 24"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-300"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Pincode <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      placeholder="e.g. 122002"
                      maxLength={6}
                      pattern="\d{6}"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sky-700 font-mono font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-sky-300"
                      required
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Bulk Pincodes
                    <span className="ml-2 text-[10px] text-slate-400 font-normal">Format: AreaName: PINCODE or just pincodes separated by commas/newlines</span>
                  </label>
                  <textarea
                    value={bulkPincodes}
                    onChange={(e) => setBulkPincodes(e.target.value)}
                    placeholder={`Connaught Place: 110001\nKarol Bagh: 110005\n110006, 110007`}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 h-28 font-mono resize-none focus:outline-none focus:ring-2 focus:ring-sky-300"
                    required
                  />
                  <div className="mt-1">
                    <label className="block font-semibold text-slate-700 mb-1">Default Area Name (for lines without area)</label>
                    <input
                      type="text"
                      value={areaName}
                      onChange={(e) => setAreaName(e.target.value)}
                      placeholder="e.g. Central Delhi"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-300"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAreaModal(false)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-sky-600 text-white font-bold hover:bg-sky-500">
                  {bulkMode ? 'Import Pincodes' : 'Save Mapping'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ──────────────────────────────────────────────── */}
      {deleteTarget && (
        <ConfirmDeleteModal
          zone={deleteTarget}
          onConfirm={handleDeleteZone}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
