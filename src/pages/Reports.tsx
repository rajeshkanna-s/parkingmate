
import { useState } from 'react';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Download, Search } from 'lucide-react';

const Reports = () => {
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    status: 'all',
    company: 'all'
  });

  // Mock data
  const reportData = [
    {
      id: '1',
      vehicleNumber: 'MH12AB1234',
      status: 'IN',
      category: 'Car',
      company: 'TechCorp Ltd.',
      purpose: 'Job',
      owner: 'John Doe',
      inTime: '2024-01-15 10:30 AM',
      outTime: '-'
    },
    {
      id: '2',
      vehicleNumber: 'MH14CD5678',
      status: 'OUT',
      category: 'Bike',
      company: 'Digital Solutions Inc.',
      purpose: 'Interview',
      owner: 'Jane Smith',
      inTime: '2024-01-15 09:15 AM',
      outTime: '2024-01-15 11:45 AM'
    }
  ];

  const companies = [
    'TechCorp Ltd.',
    'Digital Solutions Inc.',
    'Innovation Hub',
    'StartupVenture',
    'Others'
  ];

  const handleDownload = (format: 'excel' | 'pdf') => {
    console.log(`Downloading ${format} report with filters:`, filters);
    // Implement download functionality
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reports & Tracking</h1>
          <p className="text-gray-600 mt-2">Filter and export vehicle entry data</p>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>From Date</Label>
                <Input
                  type="date"
                  value={filters.fromDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, fromDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>To Date</Label>
                <Input
                  type="date"
                  value={filters.toDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, toDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="IN">Vehicle IN</SelectItem>
                    <SelectItem value="OUT">Vehicle OUT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Company</Label>
                <Select value={filters.company} onValueChange={(value) => setFilters(prev => ({ ...prev, company: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Companies</SelectItem>
                    {companies.map((company) => (
                      <SelectItem key={company} value={company}>
                        {company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <Button onClick={() => handleDownload('excel')} className="bg-green-600 hover:bg-green-700">
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
              <Button onClick={() => handleDownload('pdf')} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>Report Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium text-gray-700">S.No.</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700">Vehicle Number</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700">Category</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700 hidden sm:table-cell">Company</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700 hidden sm:table-cell">Purpose</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700 hidden md:table-cell">Owner</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700 hidden lg:table-cell">IN Time</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700 hidden lg:table-cell">OUT Time</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((entry, index) => (
                    <tr key={entry.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-2">{index + 1}</td>
                      <td className="py-3 px-2 font-mono text-sm">{entry.vehicleNumber}</td>
                      <td className="py-3 px-2">
                        <Badge 
                          variant={entry.status === 'IN' ? 'default' : 'secondary'}
                          className={entry.status === 'IN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                        >
                          {entry.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant="outline">{entry.category}</Badge>
                      </td>
                      <td className="py-3 px-2 hidden sm:table-cell text-sm">{entry.company}</td>
                      <td className="py-3 px-2 hidden sm:table-cell text-sm">{entry.purpose}</td>
                      <td className="py-3 px-2 hidden md:table-cell text-sm">{entry.owner}</td>
                      <td className="py-3 px-2 hidden lg:table-cell text-sm">{entry.inTime}</td>
                      <td className="py-3 px-2 hidden lg:table-cell text-sm">{entry.outTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Currently IN:</span>
                  <span className="ml-2 font-medium text-green-600">1</span>
                </div>
                <div>
                  <span className="text-gray-600">Currently OUT:</span>
                  <span className="ml-2 font-medium text-red-600">1</span>
                </div>
                <div>
                  <span className="text-gray-600">Total Records:</span>
                  <span className="ml-2 font-medium">2</span>
                </div>
                <div>
                  <span className="text-gray-600">Date Range:</span>
                  <span className="ml-2 font-medium">Today</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
