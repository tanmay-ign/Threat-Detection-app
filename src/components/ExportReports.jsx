import { useState } from 'react';
import { getDetectionHistory, getDetectionStats } from '../api';

const ExportReports = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState('csv');

  const exportToCSV = async () => {
    setIsExporting(true);
    try {
      const data = await getDetectionHistory({ limit: 10000, hours: 720 });
      const detections = data.detections || [];
      
      const headers = [
        'Timestamp',
        'Object Type',
        'Category',
        'Threat Level',
        'Camera ID',
        'Confidence',
        'Location',
        'Unique ID'
      ];
      
      const rows = detections.map(d => [
        new Date(d.timestamp).toLocaleString(),
        d.object_type || '',
        d.category || '',
        d.threat_level || '',
        d.camera_id || d.metadata?.camera_id || '',
        d.confidence || d.metadata?.confidence || '',
        d.location || d.metadata?.location || '',
        d.unique_object_id || ''
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `threat-detection-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export report');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToJSON = async () => {
    setIsExporting(true);
    try {
      const [detections, stats] = await Promise.all([
        getDetectionHistory({ limit: 10000, hours: 720 }),
        getDetectionStats()
      ]);
      
      const report = {
        generated_at: new Date().toISOString(),
        summary: stats,
        detections: detections.detections || []
      };
      
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `threat-detection-report-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export report');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      const [detections, stats] = await Promise.all([
        getDetectionHistory({ limit: 100, hours: 24 }),
        getDetectionStats()
      ]);
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Threat Detection Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #1e40af; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #1e40af; color: white; }
            .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }
            .stat-card { border: 2px solid #ddd; padding: 15px; border-radius: 8px; }
            .stat-value { font-size: 32px; font-weight: bold; color: #1e40af; }
            .critical { color: #dc2626; }
            .high { color: #ea580c; }
            .medium { color: #ca8a04; }
            .safe { color: #16a34a; }
          </style>
        </head>
        <body>
          <h1>🛡️ Threat Detection System Report</h1>
          <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
          
          <h2>Summary Statistics</h2>
          <div class="stats">
            <div class="stat-card">
              <div>Total Detections</div>
              <div class="stat-value">${stats.total || 0}</div>
            </div>
            <div class="stat-card">
              <div>Persons</div>
              <div class="stat-value">${stats.persons || 0}</div>
            </div>
            <div class="stat-card">
              <div>Weapons</div>
              <div class="stat-value critical">${stats.weapons || 0}</div>
            </div>
            <div class="stat-card">
              <div>Bags</div>
              <div class="stat-value">${stats.bags || 0}</div>
            </div>
          </div>
          
          <h2>Recent Detections (Last 24 Hours)</h2>
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Type</th>
                <th>Category</th>
                <th>Threat Level</th>
                <th>Camera</th>
                <th>Confidence</th>
              </tr>
            </thead>
            <tbody>
              ${(detections.detections || []).map(d => `
                <tr>
                  <td>${new Date(d.timestamp).toLocaleString()}</td>
                  <td>${d.object_type || ''}</td>
                  <td>${d.category || ''}</td>
                  <td class="${(d.threat_level || '').toLowerCase()}">${d.threat_level || ''}</td>
                  <td>${d.camera_id || d.metadata?.camera_id || ''}</td>
                  <td>${d.confidence ? (d.confidence * 100).toFixed(1) + '%' : ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;
      
      const printWindow = window.open('', '_blank');
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();
      
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export report');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExport = () => {
    if (exportType === 'csv') exportToCSV();
    else if (exportType === 'json') exportToJSON();
    else if (exportType === 'pdf') exportToPDF();
  };

  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
        <span>📥</span>
        Export Reports
      </h3>
      
      <div className="space-y-3">
        <div>
          <label className="block text-gray-400 text-xs mb-2">Select Format</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'csv', label: 'CSV', icon: '📊', desc: 'Excel compatible' },
              { value: 'json', label: 'JSON', icon: '📄', desc: 'Raw data' },
              { value: 'pdf', label: 'PDF', icon: '📑', desc: 'Printable report' }
            ].map(format => (
              <button
                key={format.value}
                onClick={() => setExportType(format.value)}
                className={`p-2 rounded-lg border-2 transition-all duration-300 ${
                  exportType === format.value
                    ? 'border-blue-500 bg-blue-900/30'
                    : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                }`}
              >
                <div className="text-2xl mb-1">{format.icon}</div>
                <div className="text-white font-semibold text-xs">{format.label}</div>
                <div className="text-gray-400 text-[10px]">{format.desc}</div>
              </button>
            ))}
          </div>
        </div>
        
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
        >
          {isExporting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Exporting...
            </>
          ) : (
            <>
              <span>⬇️</span>
              Export Report
            </>
          )}
        </button>
        
        <div className="bg-gray-800 rounded-lg p-3">
          <p className="text-gray-400 text-xs leading-relaxed">
            <strong className="text-white">Note:</strong> Reports include all detections from the last 30 days.
            CSV and JSON formats include complete data, while PDF shows last 24 hours for readability.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExportReports;
