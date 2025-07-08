
import Navigation from '@/components/Navigation';
import VehicleEntryForm from '@/components/VehicleEntryForm';
import RecentEntries from '@/components/RecentEntries';

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome to ParkingMate
          </h1>
          <p className="text-xl text-gray-600">
            Efficient vehicle tracking for modern parking management
          </p>
        </div>

        <VehicleEntryForm />
        <RecentEntries />
      </div>
    </div>
  );
};

export default Index;
