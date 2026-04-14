import React from 'react';
import './SimpleBarChart.css';

export default function SimpleBarChart({ data, height = 120 }) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="simple-bar-chart" style={{ height }}>
      {data.map((item, i) => (
        <div key={i} className="chart-bar-wrap">
          <span className="chart-value">{item.value}</span>
          <div
            className="chart-bar"
            style={{ height: `${(item.value / maxVal) * 100}%`, backgroundColor: item.color || 'var(--primary)' }}
            title={`${item.label}: ${item.value}`}
          />
          <span className="chart-label">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
