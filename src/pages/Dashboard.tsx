
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Car, Bike, ArrowUp, ArrowDown } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface DashboardStats {
  vehiclesIn: number;
  vehiclesOut: number;
  currentlyParked: number;
  totalEntries: number;
}

interface CompanyData {
  name: string;
  count: number;
  color: string;
}

interface HourlyData {
  hour: string;
  cars: number;
  bikes: number;
}

const Dashboard = () => {
  const [todayStats, setTodayStats] = useState<DashboardStats>({
    vehiclesIn: 0,
    vehiclesOut: 0,
    currentlyParked: 0,
    totalEntries: 0
  });

  const [companyData, setCompanyData] = useState<CompanyData[]>([]);
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    subscribeToChanges();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Get today's date range
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      // Fetch today's entries
      const { data: entries, error } = await supabase
        .from('vehicle_entries')
        .select(`
          *,
          companies (
            name
          )
        `)
        .gte('created_at', startOfDay.toISOString())
        .lt('created_at', endOfDay.toISOString());

      if (error) throw error;

      // Calculate stats
      const vehiclesIn = entries?.filter(e => e.vehicle_status === 'IN').length || 0;
      const vehiclesOut = entries?.filter(e => e.vehicle_status === 'OUT').length || 0;
      const totalEntries = entries?.length || 0;
      const currentlyParked = vehiclesIn - vehiclesOut;

      setTodayStats({
        vehiclesIn,
        vehiclesOut,
        currentlyParked: Math.max(0, currentlyParked),
        totalEntries
      });

      // Process company data
      const companyCount: { [key: string]: number } = {};
      entries?.forEach(entry => {
        const companyName = entry.companies?.name || 'Others';
        companyCount[companyName] = (companyCount[companyName] || 0) + 1;
      });

      const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
      const processedCompanyData = Object.entries(companyCount)
        .map(([name, count], index) => ({
          name,
          count,
          color: colors[index % colors.length]
        }))
        .sort((a, b) => b.count - a.count);

      setCompanyData(processedCompanyData);

      // Process hourly data (mock data for now - you can enhance this with real hourly breakdown)
      const mockHourlyData = [
        { hour: '8AM', cars: Math.floor(Math.random() * 5), bikes: Math.floor(Math.random() * 3) },
        { hour: '9AM', cars: Math.floor(Math.random() * 8), bikes: Math.floor(Math.random() * 5) },
        { hour: '10AM', cars: Math.floor(Math.random() * 12), bikes: Math.floor(Math.random() * 8) },
        { hour: '11AM', cars: Math.floor(Math.random() * 15), bikes: Math.floor(Math.random() * 10) },
        { hour: '12PM', cars: Math.floor(Math.random() * 10), bikes: Math.floor(Math.random() * 6) },
        { hour: '1PM', cars: Math.floor(Math.random() * 8), bikes: Math.floor(Math.random() * 4) },
        { hour: '2PM', cars: Math.floor(Math.random() * 12), bikes: Math.floor(Math.random() * 7) },
        { hour: '3PM', cars: Math.floor(Math.random() * 14), bikes: Math.floor(Math.random() * 9) },
        { hour: '4PM', cars: Math.floor(Math.random() * 16), bikes: Math.floor(Math.random() * 11) },
        { hour: '5PM', cars: Math.floor(Math.random() * 18), bikes: Math.floor(Math.random() * 13) }
      ];

      setHourlyData(mockHourlyData);

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const subscribeToChanges = () => {
    const channel = supabase
      .channel('dashboard_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vehicle_entries'
        },
        () => {
          console.log('Vehicle entries changed, refreshing dashboard...');
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Loading dashboard...</div>
        </div>
      </div>
    );
  }

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
              {companyData.length > 0 ? (
                <>
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
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No data available for today
                </div>
              )}
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
