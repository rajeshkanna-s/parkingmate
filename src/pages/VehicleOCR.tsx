
import React from 'react';
import Navigation from '@/components/Navigation';
import VehicleOCR from '@/components/VehicleOCR';
import { toast } from '@/hooks/use-toast';

const VehicleOCRPage = () => {
  const handleVehicleNumberDetected = (vehicleNumber: string) => {
    console.log('Vehicle number detected:', vehicleNumber);
    // You can add logic here to auto-fill forms or perform other actions
    toast({
      title: "Vehicle Number Ready",
      description: `${vehicleNumber} is ready to use`,
      className: "bg-blue-50 border-blue-200 text-blue-800",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Vehicle Number Detection
          </h1>
          <p className="text-lg text-gray-600">
            Upload an image or use your camera to detect vehicle numbers using OCR
          </p>
        </div>

        <VehicleOCR onVehicleNumberDetected={handleVehicleNumberDetected} />
      </div>
    </div>
  );
};

export default VehicleOCRPage;
