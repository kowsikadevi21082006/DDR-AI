'use client';

import React, { useState } from 'react';
import {
  Upload,
  FileText,
  Thermometer,
  Activity,
  AlertTriangle,
  CheckCircle,
  Info,
  Loader2,
  Download
} from 'lucide-react';

export default function Home() {
  const [inspectionFile, setInspectionFile] = useState<File | null>(null);
  const [thermalFile, setThermalFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'inspection' | 'thermal') => {
    if (e.target.files && e.target.files[0]) {
      if (type === 'inspection') setInspectionFile(e.target.files[0]);
      if (type === 'thermal') setThermalFile(e.target.files[0]);
    }
  };

  const generateReport = async () => {
    if (!inspectionFile || !thermalFile) {
      setError("Please upload both reports before generating.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setReport(null);

    const formData = new FormData();
    formData.append('inspection', inspectionFile);
    formData.append('thermal', thermalFile);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    try {
      const response = await fetch(`${apiUrl}/generate-ddr/`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate report');
      }

      const data = await response.json();
      setReport(data.report);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadReport = () => {
    if (!report) return;
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'DDR_Report.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main>
      <header style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <Activity size={40} color="var(--primary)" />
          <h1 style={{ fontSize: '2.5rem' }}>DDR AI <span style={{ color: 'var(--primary)' }}>Builder</span></h1>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Convert site inspection and thermal data into professional diagnostic reports.</p>
      </header>

      <section className="glass-card">
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Upload Site Data</h2>

        <div className="upload-grid">
          <label className={`upload-box ${inspectionFile ? 'has-file' : ''}`}>
            <input
              type="file"
              style={{ display: 'none' }}
              onChange={(e) => handleFileChange(e, 'inspection')}
              accept=".txt,.pdf,.doc,.docx"
            />
            {inspectionFile ? (
              <>
                <FileText size={48} color="var(--accent)" />
                <div>
                  <p style={{ fontWeight: 600 }}>{inspectionFile.name}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Inspection Report Loaded</p>
                </div>
              </>
            ) : (
              <>
                <Upload size={48} color="var(--primary)" />
                <div>
                  <p style={{ fontWeight: 600 }}>Inspection Report</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Click to upload site observations</p>
                </div>
              </>
            )}
          </label>

          <label className={`upload-box ${thermalFile ? 'has-file' : ''}`}>
            <input
              type="file"
              style={{ display: 'none' }}
              onChange={(e) => handleFileChange(e, 'thermal')}
              accept=".txt,.pdf,.doc,.docx"
            />
            {thermalFile ? (
              <>
                <Thermometer size={48} color="var(--accent)" />
                <div>
                  <p style={{ fontWeight: 600 }}>{thermalFile.name}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Thermal Data Loaded</p>
                </div>
              </>
            ) : (
              <>
                <Upload size={48} color="var(--primary)" />
                <div>
                  <p style={{ fontWeight: 600 }}>Thermal Report</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Click to upload thermal findings</p>
                </div>
              </>
            )}
          </label>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--error)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={20} />
            <p>{error}</p>
          </div>
        )}

        <button
          className="btn"
          onClick={generateReport}
          disabled={isGenerating || !inspectionFile || !thermalFile}
        >
          {isGenerating ? (
            <>
              <Loader2 className="animate-spin" />
              Analyzing Technical Data...
            </>
          ) : (
            <>
              <Activity size={20} />
              Generate Main DDR
            </>
          )}
        </button>

        {isGenerating && (
          <div className="loading-bar">
            <div className="loading-bar-fill"></div>
          </div>
        )}
      </section>

      {report && (
        <section className="report-section glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem' }}>Generated Detailed Diagnostic Report</h2>
            <button className="btn" style={{ width: 'auto', padding: '0.5rem 1rem' }} onClick={downloadReport}>
              <Download size={18} />
              Export .txt
            </button>
          </div>

          <div className="report-grid">
            {report.split('\n\n').map((chunk, index) => {
              if (!chunk.trim()) return null;

              const lines = chunk.split('\n');
              const title = lines[0];
              const content = lines.slice(1).join('\n');

              if (title.match(/^[1-7]\./)) {
                return (
                  <div key={index} className="report-item">
                    <h3>{title}</h3>
                    <div className="report-content">{content.trim()}</div>
                  </div>
                );
              }

              return (
                <div key={index} className="report-content" style={{ marginBottom: '1.5rem' }}>
                  {chunk}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <footer style={{ marginTop: '4rem', textAlign: 'center', color: 'var(--text-muted)', paddingBottom: '2rem' }}>
        <p>© 2026 DDR AI Builder. All rights reserved.</p>
      </footer>

      <style jsx global>{`
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  );
}
