
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Car, Users, Building2, TrendingUp, Calendar } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardStats {
  totalEntries: number;
  vehiclesIn: number;
  vehiclesOut: number;
  totalCompanies: number;
  monthlyData: Array<{ name: string; value: number; color: string }>;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalEntries: 0,
    vehiclesIn: 0,
    vehiclesOut: 0,
    totalCompanies: 0,
    monthlyData: []
  });
  const [recentEntries, setRecentEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // Fetch user-specific vehicle entries
      const [entriesResponse, companiesResponse] = await Promise.all([
        supabase.from('vehicle_entries').select('*').eq('user_id', user.id),
        supabase.from('companies').select('*').eq('user_id', user.id)
      ]);

      if (entriesResponse.error) throw entriesResponse.error;
      if (companiesResponse.error) throw companiesResponse.error;

      const entries = entriesResponse.data || [];
      const companies = companiesResponse.data || [];

      // Calculate stats
      const vehiclesIn = entries.filter(entry => entry.vehicle_status === 'IN').length;
      const vehiclesOut = entries.filter(entry => entry.vehicle_status === 'OUT').length;

      // Calculate monthly data for the pie chart
      const currentYear = new Date().getFullYear();
      const monthlyStats: { [key: string]: number } = {};
      
      entries.forEach(entry => {
        const entryDate = new Date(entry.created_at);
        if (entryDate.getFullYear() === currentYear) {
          const monthName = entryDate.toLocaleString('default', { month: 'long' });
          monthlyStats[monthName] = (monthlyStats[monthName] || 0) + 1;
        }
      });

      const colors = [
        '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1',
        '#d084d0', '#ffb347', '#87ceeb', '#dda0dd', '#98fb98',
        '#f0e68c', '#ffa07a'
      ];

      const monthlyData = Object.entries(monthlyStats).map(([month, count], index) => ({
        name: month,
        value: count,
        color: colors[index % colors.length]
      }));

      setStats({
        totalEntries: entries.length,
        vehiclesIn,
        vehiclesOut,
        totalCompanies: companies.length,
        monthlyData
      });

      // Fetch recent user-specific entries with company info
      const { data: recentData, error: recentError } = await supabase
        .from('vehicle_entries')
        .select(`
          *,
          companies (
            name
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentError) throw recentError;
      setRecentEntries(recentData || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Please log in to view the dashboard.</div>
        </div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard Overview
          </h1>
          <p className="text-gray-600">
            Real-time insights into your parking management system
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEntries}</div>
              <p className="text-xs text-muted-foreground">
                All time vehicle entries
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vehicles IN</CardTitle>
              <Car className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.vehiclesIn}</div>
              <p className="text-xs text-muted-foreground">
                Currently parked
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vehicles OUT</CardTitle>
              <Car className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.vehiclesOut}</div>
              <p className="text-xs text-muted-foreground">
                Exited vehicles
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Companies</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCompanies}</div>
              <p className="text-xs text-muted-foreground">
                Registered companies
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Vehicle Traffic Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Monthly Vehicle Traffic
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.monthlyData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {stats.monthlyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Recent Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentEntries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <Car className="h-5 w-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {entry.vehicle_number}
                        </p>
                        <p className="text-sm text-gray-500">
                          {entry.companies?.name || 'No Company'} • {entry.vehicle_category}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={entry.vehicle_status === 'IN' ? 'default' : 'secondary'}
                        className={entry.vehicle_status === 'IN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                      >
                        {entry.vehicle_status}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(entry.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
                
                {recentEntries.length === 0 && (
                  <div className="text-center py-6 text-gray-500">
                    No recent activities found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
