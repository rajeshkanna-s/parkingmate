
import Navigation from '@/components/Navigation';
import VehicleEntryForm from '@/components/VehicleEntryForm';
import RecentEntries from '@/components/RecentEntries';

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">
            <span className="bg-gradient-to-r from-indigo-500 via-pink-500 to-amber-500 bg-clip-text text-transparent">
              Welcome to ParkingMate
            </span>
          </h1>
        </div>

        <VehicleEntryForm />
        <RecentEntries />
      </div>
    </div>
  );
};

export default Index;
