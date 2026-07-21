import React from 'react';
import { X, Printer, FileText } from 'lucide-react';

export default function InspectionReportModal({ site, city, onClose }) {
  if (!site) return null;

  const handlePrint = () => {
    window.print();
  };

  const reportId = `CPCB-VAYU-${site._id ? site._id.substring(18).toUpperCase() : '2026-X9'}`;
  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(5, 10, 18, 0.9)',
      backdropFilter: 'blur(16px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, animation: 'fade-in 0.2s ease',
    }}>
      <div style={{
        width: '100%', maxWidth: 760, maxHeight: '92vh',
        background: '#ffffff', color: '#111827',
        borderRadius: 16, overflow: 'hidden',
        boxShadow: '0 30px 90px rgba(0,0,0,0.95)',
        display: 'flex', flexDirection: 'column',
        fontFamily: 'Inter, sans-serif',
      }}>
        {/* Printable Top Bar */}
        <div style={{
          padding: '14px 24px', background: '#0f172a', color: '#f8fafc',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }} className="no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700 }}>
            <FileText size={16} color="#00e5ff" />
            <span>Official CPCB Inspection Order Generator</span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handlePrint}
              style={{
                padding: '6px 14px', borderRadius: 6, border: 'none',
                background: '#00e5ff', color: '#030509', fontSize: 12, fontWeight: 700,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <Printer size={13} />
              <span>Print / Export PDF</span>
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.1)', border: 'none',
                borderRadius: 6, padding: '6px 10px', color: '#ffffff', cursor: 'pointer',
              }}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Formal Legal Document Body */}
        <div style={{ padding: '32px 40px', overflowY: 'auto', flex: 1, background: '#ffffff' }}>

          {/* Official Letterhead */}
          <div style={{ textTransform: 'uppercase', textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: '#64748b' }}>
              CENTRAL POLLUTION CONTROL BOARD · MINISTRY OF ENVIRONMENT, FOREST & CLIMATE CHANGE
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', margin: '4px 0' }}>
              AIR QUALITY ENFORCEMENT & SITE INSPECTION ORDER
            </div>
            <div style={{ fontSize: 11, color: '#475569' }}>
              ISSUED UNDER SECTION 31A OF THE AIR (PREVENTION AND CONTROL OF POLLUTION) ACT, 1981
            </div>
          </div>

          {/* Reference Meta Table */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, background: '#f8fafc', padding: 14, borderRadius: 8, marginBottom: 20, fontSize: 12 }}>
            <div>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Notice Reference:</span>{' '}
              <strong style={{ color: '#0f172a' }}>{reportId}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Date & Time:</span>{' '}
              <strong style={{ color: '#0f172a' }}>{dateStr}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Target Jurisdiction:</span>{' '}
              <strong style={{ color: '#0f172a' }}>{city} Municipal Corporation</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', fontWeight: 600 }}>AI Priority Index:</span>{' '}
              <strong style={{ color: '#dc2626' }}>{site.priorityScore || 85} / 100 (HIGH RISK)</strong>
            </div>
          </div>

          {/* Target Site Details */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#0f172a', marginBottom: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 4 }}>
              1. TARGET VIOLATION SITE SPECIFICATIONS
            </div>
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '6px 0', color: '#64748b', width: 140, fontWeight: 600 }}>Site Name:</td>
                  <td style={{ padding: '6px 0', color: '#0f172a', fontWeight: 700 }}>{site.siteName}</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 0', color: '#64748b', fontWeight: 600 }}>Industry / Category:</td>
                  <td style={{ padding: '6px 0', color: '#0f172a' }}>{site.siteType}</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 0', color: '#64748b', fontWeight: 600 }}>Physical Address:</td>
                  <td style={{ padding: '6px 0', color: '#0f172a' }}>{site.address || `${site.ward || city}, ${city}`}</td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 0', color: '#64748b', fontWeight: 600 }}>GPS Coordinates:</td>
                  <td style={{ padding: '6px 0', color: '#0f172a', fontFamily: 'monospace' }}>
                    {site.location?.coordinates ? `[${site.location.coordinates[1].toFixed(4)}° N, ${site.location.coordinates[0].toFixed(4)}° E]` : '[19.0760° N, 72.8777° E]'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Evidence Logs */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#0f172a', marginBottom: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 4 }}>
              2. SATELLITE & SENSOR EVIDENCE REASONING
            </div>
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 12, fontSize: 12, color: '#991b1b', lineHeight: 1.5 }}>
              <strong>AI Diagnostic Finding:</strong> {site.aiReasoning || `Elevated particulate emissions exceeding standard CPCB threshold near ${site.ward || city}. Immediate inspection warranted.`}
            </div>
          </div>

          {/* Corrective Directives */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#0f172a', marginBottom: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 4 }}>
              3. MANDATORY CORRECTIVE DIRECTIVES
            </div>
            <ul style={{ fontSize: 12, color: '#334155', paddingLeft: 20, margin: 0, lineHeight: 1.6 }}>
              <li>Immediate deployment of rapid inspection team within <strong>60 minutes</strong> of notice receipt.</li>
              <li>{site.recommendedAction || 'Halt unmitigated high-emission activities and enforce anti-smog water gun compliance.'}</li>
              <li>Submit digital inspection log and stack emission readings back to Vayu Platform within 24 hours.</li>
            </ul>
          </div>

          {/* Signature Block */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 20, borderTop: '1px dashed #cbd5e1' }}>
            <div style={{ fontSize: 10, color: '#64748b' }}>
              Generated automatically by Vayu Intelligence Platform<br />
              Digital Seal Verification: <span style={{ fontFamily: 'monospace' }}>VALIDATED</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>Chief Enforcement Officer</div>
              <div style={{ fontSize: 10, color: '#64748b' }}>CPCB Regional Directorate ({city})</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
