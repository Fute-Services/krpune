import React from 'react';

const FloorPlanPage = () => {
  return (
    <div className="p-10 text-white bg-slate-900 min-h-screen flex flex-col items-center">
      <h1 className="text-4xl font-bold mb-6">Floor Plan Details</h1>
      <div className="max-w-4xl w-full bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-md">
        <p className="text-lg">Detailed floor plans for all levels, including 3D and 2D visualizations.</p>
        {/* Add floor plan specific content here */}
      </div>
    </div>
  );
};

export default FloorPlanPage;