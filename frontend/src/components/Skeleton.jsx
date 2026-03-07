import React from 'react';

export default function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-[#E2E8F0] rounded ${className}`}></div>;
}
