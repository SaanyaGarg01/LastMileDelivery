import React, { useState } from 'react';
import api from '../../api/axios';
import { UploadCloud, CheckCircle2, AlertTriangle, FileSpreadsheet, ArrowRight, RefreshCw, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminBulkOrdersPage() {
  const [csvText, setCsvText] = useState('');
  const [validationResult, setValidationResult] = useState(null);
  const [validating, setValidating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState(null);

  const sampleCSV = `customerName,customerPhone,customerEmail,pickupAddress,pickupPincode,dropAddress,dropPincode,length,breadth,height,actualWeight,orderType,paymentType,deliverySlot
Aarav Sharma,9876543210,customer@deliverytracker.com,Connaught Place Block A,110001,Sector 18 Market Noida,201301,30,20,15,4.5,B2C,PREPAID,Morning (09:00 - 12:00)
Rohan Verma,9811122233,rohan@example.com,Lajpat Nagar Market,110024,Cyber City Gurugram,122002,40,30,25,8.0,B2B,COD,Afternoon (12:00 - 15:00)`;

  const parseCSVText = (text) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map((h) => h.trim());
    return lines.slice(1).filter((line) => line.trim()).map((line) => {
      const values = line.split(',').map((v) => v.trim());
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || '';
      });
      return row;
    });
  };

  const handleValidate = async () => {
    if (!csvText.trim()) {
      toast.error('Please paste or upload CSV data first');
      return;
    }
    setValidating(true);
    setValidationResult(null);
    setImportSummary(null);

    try {
      const parsedRows = parseCSVText(csvText);
      if (parsedRows.length === 0) {
        toast.error('No valid rows found in CSV text');
        setValidating(false);
        return;
      }

      const res = await api.post('/orders/bulk-validate', { rows: parsedRows });
      if (res.data.success) {
        setValidationResult(res.data);
        toast.success(`Validated ${res.data.totalRows} rows (${res.data.validCount} valid)`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Validation failed');
    } finally {
      setValidating(false);
    }
  };

  const handleImport = async () => {
    if (!validationResult || validationResult.validRows.length === 0) {
      toast.error('No valid rows to import');
      return;
    }
    setImporting(true);

    try {
      const res = await api.post('/orders/bulk-import', { validRows: validationResult.validRows });
      if (res.data.success) {
        setImportSummary(res.data);
        toast.success(`Successfully imported ${res.data.importedCount} shipments!`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-sky-600" /> Bulk Order Creation & CSV Import
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Validate pincode serviceability, volumetric dimensions, and rate calculation before importing bulk shipments.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCsvText(sampleCSV)}
          className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all flex items-center gap-1.5"
        >
          Load Sample CSV Data
        </button>
      </div>

      {/* CSV Input Area */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          Paste CSV Text Content or Data Rows
        </label>
        <textarea
          rows={6}
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          placeholder="customerName,customerPhone,customerEmail,pickupAddress,pickupPincode,dropAddress,dropPincode,length,breadth,height,actualWeight,orderType,paymentType,deliverySlot..."
          className="w-full p-3 rounded-xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-hidden bg-slate-50/50"
        />

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handleValidate}
            disabled={validating || !csvText.trim()}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-2"
          >
            {validating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />} Validate CSV Data
          </button>
        </div>
      </div>

      {/* Validation Results & Preview Table */}
      {validationResult && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase">TOTAL ROWS</span>
              <div className="text-2xl font-extrabold text-slate-900">{validationResult.totalRows}</div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-emerald-200 bg-emerald-50/40 shadow-xs space-y-1">
              <span className="text-xs font-bold text-emerald-700 uppercase">VALID ROWS READY</span>
              <div className="text-2xl font-extrabold text-emerald-600">{validationResult.validCount}</div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-rose-200 bg-rose-50/40 shadow-xs space-y-1">
              <span className="text-xs font-bold text-rose-700 uppercase">INVALID ROWS</span>
              <div className="text-2xl font-extrabold text-rose-600">{validationResult.invalidCount}</div>
            </div>
          </div>

          {/* Invalid Rows Table if any */}
          {validationResult.invalidRows.length > 0 && (
            <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 space-y-3">
              <h3 className="text-xs font-extrabold text-rose-900 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" /> Invalid Rows Requiring Attention
              </h3>
              <div className="divide-y divide-rose-200 text-xs">
                {validationResult.invalidRows.map((inv) => (
                  <div key={inv.rowNumber} className="py-2.5 flex flex-wrap items-center justify-between gap-3">
                    <span className="font-mono font-bold text-rose-900">Row {inv.rowNumber}</span>
                    <div className="text-rose-700 font-medium">{inv.errors.join(' • ')}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Valid Rows Preview Table */}
          {validationResult.validRows.length > 0 && (
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Preview Valid Orders ({validationResult.validCount})
                </h3>
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={importing}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
                >
                  {importing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />} Import {validationResult.validCount} Valid Orders
                </button>
              </div>

              <div className="divide-y divide-slate-100 overflow-x-auto text-xs">
                {validationResult.validRows.map((v) => (
                  <div key={v.rowNumber} className="py-3 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900">{v.data.customerName || 'Customer'}</div>
                      <div className="text-slate-500">
                        {v.data.pickupAddress} ({v.data.pickupPincode}) <span className="font-mono text-slate-400">➔</span> {v.data.dropAddress} ({v.data.dropPincode})
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono font-bold text-sky-700 block">{v.data.orderType || 'B2C'} • {v.data.paymentType || 'PREPAID'}</span>
                      <span className="text-[10px] text-slate-400">{v.data.actualWeight} kg • {v.data.deliverySlot || 'Standard'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Import Completion Summary */}
      {importSummary && (
        <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3">
          <div className="flex items-center gap-3 text-emerald-900">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <h3 className="font-extrabold text-sm">Bulk Import Successfully Completed!</h3>
              <p className="text-xs text-emerald-700">
                Created {importSummary.importedCount} new shipment records with rate calculations and auto-agent assignment evaluation.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
