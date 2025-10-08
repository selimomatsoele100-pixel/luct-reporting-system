import React from 'react';

const DashboardCard = ({ title, value, color }) => {
  return (
    <div className="stat-card">
      <div className="stat-number" style={{ color }}>{value}</div>
      <div className="stat-label">{title}</div>
    </div>
  );
};

export default DashboardCard;