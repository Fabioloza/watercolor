import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import WatercolorEffect from './components/WatercolorEffect';

function App() {
  return (
    <div className="w-full h-screen bg-[#f0e6d2]">
      <Canvas>
        <Suspense fallback={null}>
          <WatercolorEffect />
        </Suspense>
      </Canvas>
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex items-center justify-center">
        <h1 className="text-4xl font-bold text-[#4a4a4a] opacity-50">Move your cursor to paint</h1>
      </div>
    </div>
  );
}

export default App;