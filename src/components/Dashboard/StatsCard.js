import React from 'react';

const StatsCard = ({ title, value, icon, color }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
        <div className={`${color} w-12 h-12 rounded-full flex items-center justify-center`}>
          <i className={`fas ${icon} text-white text-xl`}></i>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;