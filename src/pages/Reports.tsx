
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Search, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Navigation from '@/components/Navigation';

interface Entry {
  id: string;
  vehicle_number: string;
  vehicle_category: string;
  vehicle_status: string;
  owner_name: string | null;
  purpose_of_visit: string;
  user_name: string | null;
  user_mobile: string | null;
  created_at: string;
  companies: {
    name: string;
  } | null;
}

interface Company {
  id: string;
  name: string;
}

const Reports = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<Entry[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [filters, setFilters] = useState({
    fromDate: new Date().toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    status: '',
    category: '',
    companyId: ''
  });
  
  // Quick search state
  const [quickSearch, setQuickSearch] = useState({
    vehicleNumber: '',
    companyName: '',
    ownerName: ''
  });

  useEffect(() => {
    fetchCompanies();
    fetchEntries();
  }, []);

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const fetchEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicle_entries')
        .select(`
          *,
          companies (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
      setFilteredEntries(data || []);
    } catch (error) {
      console.error('Error fetching entries:', error);
      toast({
        title: "Error",
        description: "Failed to load entries.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    let filtered = [...entries];

    // Apply date filters
    if (filters.fromDate) {
      filtered = filtered.filter(entry => 
        new Date(entry.created_at) >= new Date(filters.fromDate)
      );
    }
    if (filters.toDate) {
      const toDate = new Date(filters.toDate);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(entry => 
        new Date(entry.created_at) <= toDate
      );
    }

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(entry => entry.vehicle_status === filters.status);
    }

    // Apply category filter
    if (filters.category) {
      filtered = filtered.filter(entry => entry.vehicle_category === filters.category);
    }

    // Apply company filter
    if (filters.companyId) {
      filtered = filtered.filter(entry => entry.companies?.name === companies.find(c => c.id === filters.companyId)?.name);
    }

    // Apply quick search filters
    if (quickSearch.vehicleNumber) {
      filtered = filtered.filter(entry => 
        entry.vehicle_number.toLowerCase().includes(quickSearch.vehicleNumber.toLowerCase())
      );
    }
    if (quickSearch.companyName) {
      filtered = filtered.filter(entry => 
        entry.companies?.name?.toLowerCase().includes(quickSearch.companyName.toLowerCase())
      );
    }
    if (quickSearch.ownerName) {
      filtered = filtered.filter(entry => 
        entry.owner_name?.toLowerCase().includes(quickSearch.ownerName.toLowerCase())
      );
    }

    setFilteredEntries(filtered);
    
    toast({
      title: "Search Complete",
      description: `Found ${filtered.length} matching entries.`,
      className: "bg-blue-50 border-blue-200 text-blue-800"
    });
  };

  const exportToExcel = () => {
    const exportData = filteredEntries.map(entry => ({
      'Vehicle Number': entry.vehicle_number,
      'Category': entry.vehicle_category,
      'Status': entry.vehicle_status,
      'Company': entry.companies?.name || 'N/A',
      'Owner Name': entry.owner_name || 'N/A',
      'Purpose': entry.purpose_of_visit,
      'User Name': entry.user_name || 'N/A',
      'User Mobile': entry.user_mobile || 'N/A',
      'Date & Time': new Date(entry.created_at).toLocaleString()
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Vehicle Entries');
    
    XLSX.writeFile(wb, `vehicle-entries-${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast({
      title: "Excel Export Complete",
      description: "Your report has been downloaded successfully.",
      className: "bg-green-50 border-green-200 text-green-800"
    });
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Vehicle Entries Report', 14, 22);
    
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 32);
    doc.text(`Total Entries: ${filteredEntries.length}`, 14, 40);

    const tableData = filteredEntries.map(entry => [
      entry.vehicle_number,
      entry.vehicle_category,
      entry.vehicle_status,
      entry.companies?.name || 'N/A',
      entry.owner_name || 'N/A',
      entry.purpose_of_visit,
      entry.user_name || 'N/A',
      entry.user_mobile || 'N/A',
      new Date(entry.created_at).toLocaleDateString()
    ]);

    autoTable(doc, {
      head: [['Vehicle No.', 'Category', 'Status', 'Company', 'Owner', 'Purpose', 'User', 'Mobile', 'Date']],
      body: tableData,
      startY: 50,
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 15 },
        2: { cellWidth: 15 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
        5: { cellWidth: 20 },
        6: { cellWidth: 25 },
        7: { cellWidth: 20 },
        8: { cellWidth: 20 }
      }
    });

    doc.save(`vehicle-entries-${new Date().toISOString().split('T')[0]}.pdf`);
    
    toast({
      title: "PDF Export Complete",
      description: "Your report has been downloaded successfully.",
      className: "bg-green-50 border-green-200 text-green-800"
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Loading reports...</div>
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
            Reports & Analytics
          </h1>
          <p className="text-gray-600">
            Generate and export detailed vehicle entry reports
          </p>
        </div>

        {/* Advanced Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Advanced Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fromDate">From Date</Label>
                <Input
                  id="fromDate"
                  type="date"
                  value={filters.fromDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, fromDate: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="toDate">To Date</Label>
                <Input
                  id="toDate"
                  type="date"
                  value={filters.toDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, toDate: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Statuses</SelectItem>
                    <SelectItem value="IN">Vehicle IN</SelectItem>
                    <SelectItem value="OUT">Vehicle OUT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    <SelectItem value="Car">Car</SelectItem>
                    <SelectItem value="Bike">Bike</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Company</Label>
                <Select value={filters.companyId} onValueChange={(value) => setFilters(prev => ({ ...prev, companyId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All companies" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Companies</SelectItem>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Quick Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="vehicleSearch">Vehicle Number</Label>
                <Input
                  id="vehicleSearch"
                  placeholder="Search by vehicle number..."
                  value={quickSearch.vehicleNumber}
                  onChange={(e) => setQuickSearch(prev => ({ ...prev, vehicleNumber: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="companySearch">Company Name</Label>
                <Input
                  id="companySearch"
                  placeholder="Search by company name..."
                  value={quickSearch.companyName}
                  onChange={(e) => setQuickSearch(prev => ({ ...prev, companyName: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ownerSearch">Owner Name</Label>
                <Input
                  id="ownerSearch"
                  placeholder="Search by owner name..."
                  value={quickSearch.ownerName}
                  onChange={(e) => setQuickSearch(prev => ({ ...prev, ownerName: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={handleSearch} className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Search
              </Button>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={exportToExcel} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Excel
                </Button>
                
                <Button variant="outline" onClick={exportToPDF} className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Search Results ({filteredEntries.length} entries)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium text-gray-700">Vehicle Number</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700">Category</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700 hidden sm:table-cell">Company</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700 hidden md:table-cell">Owner</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700 hidden lg:table-cell">User</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700 hidden xl:table-cell">Mobile</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-700 hidden lg:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((entry) => (
                    <tr key={entry.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-2 font-mono text-sm">{entry.vehicle_number}</td>
                      <td className="py-3 px-2">
                        <Badge variant="outline">{entry.vehicle_category}</Badge>
                      </td>
                      <td className="py-3 px-2">
                        <Badge 
                          variant={entry.vehicle_status === 'IN' ? 'default' : 'secondary'}
                          className={entry.vehicle_status === 'IN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                        >
                          {entry.vehicle_status}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 hidden sm:table-cell text-sm">{entry.companies?.name || 'N/A'}</td>
                      <td className="py-3 px-2 hidden md:table-cell text-sm">{entry.owner_name || 'N/A'}</td>
                      <td className="py-3 px-2 hidden lg:table-cell text-sm">{entry.user_name || 'N/A'}</td>
                      <td className="py-3 px-2 hidden xl:table-cell text-sm">{entry.user_mobile || 'N/A'}</td>
                      <td className="py-3 px-2 hidden lg:table-cell text-sm text-gray-600">
                        {new Date(entry.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredEntries.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No entries found matching your search criteria.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
