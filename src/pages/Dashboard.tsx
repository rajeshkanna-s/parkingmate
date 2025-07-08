
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Car, Bike, ArrowUp, ArrowDown } from 'lucide-react';
import Navigation from '@/components/Navigation';

const Dashboard = () => {
  // Mock data - replace with actual data from Supabase
  const todayStats = {
    vehiclesIn: 45,
    vehiclesOut: 32,
    currentlyParked: 13,
    totalEntries: 77
  };

  const companyData = [
    { name: 'TechCorp Ltd.', count: 15, color: '#3B82F6' },
    { name: 'Digital Solutions Inc.', count: 12, color: '#10B981' },
    { name: 'Innovation Hub', count: 8, color: '#F59E0B' },
    { name: 'StartupVenture', count: 6, color: '#EF4444' },
    { name: 'Others', count: 4, color: '#8B5CF6' }
  ];

  const hourlyData = [
    { hour: '8AM', cars: 4, bikes: 2 },
    { hour: '9AM', cars: 8, bikes: 5 },
    { hour: '10AM', cars: 12, bikes: 8 },
    { hour: '11AM', cars: 15, bikes: 10 },
    { hour: '12PM', cars: 10, bikes: 6 },
    { hour: '1PM', cars: 8, bikes: 4 },
    { hour: '2PM', cars: 12, bikes: 7 },
    { hour: '3PM', cars: 14, bikes: 9 },
    { hour: '4PM', cars: 16, bikes: 11 },
    { hour: '5PM', cars: 18, bikes: 13 }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Real-time parking analytics for today</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Vehicles IN</p>
                  <p className="text-2xl font-bold text-green-600">{todayStats.vehiclesIn}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <ArrowUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Vehicles OUT</p>
                  <p className="text-2xl font-bold text-red-600">{todayStats.vehiclesOut}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <ArrowDown className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Currently Parked</p>
                  <p className="text-2xl font-bold text-blue-600">{todayStats.currentlyParked}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Car className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Entries</p>
                  <p className="text-2xl font-bold text-purple-600">{todayStats.totalEntries}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Bike className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Company-wise Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Company-wise Vehicle Count</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={companyData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="count"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {companyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {companyData.map((company) => (
                  <div key={company.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: company.color }}
                      />
                      <span className="text-sm">{company.name}</span>
                    </div>
                    <Badge variant="outline">{company.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Hourly Traffic */}
          <Card>
            <CardHeader>
              <CardTitle>Hourly Vehicle Traffic</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Bar dataKey="cars" fill="#3B82F6" name="Cars" />
                    <Bar dataKey="bikes" fill="#10B981" name="Bikes" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                  <span className="text-sm">Cars</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span className="text-sm">Bikes</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
