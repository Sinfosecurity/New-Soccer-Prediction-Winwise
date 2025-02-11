import React from 'react';
import { FiHome, FiCalendar, FiTrendingUp, FiActivity, FiUser } from 'react-icons/fi';

const Navigation: React.FC = () => {
  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: FiHome },
    { name: 'Matches', path: '/matches', icon: FiCalendar },
    { name: 'Predictions', path: '/predictions', icon: FiTrendingUp },
    { name: 'Model Monitoring', path: '/monitoring', icon: FiActivity },
    { name: 'Profile', path: '/profile', icon: FiUser },
    // ... other menu items
  ];

  return (
    <div>
      {/* Render your menu items here */}
    </div>
  );
};

export default Navigation; 