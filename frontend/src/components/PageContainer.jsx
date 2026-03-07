import React from 'react';

export default function PageContainer({ children }) {
  return (
    <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-sm p-8 border border-slate-200">
      {children}
    </div>
  );
}
