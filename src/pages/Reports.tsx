
import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Search, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportEntry {
  id: string;
  vehicle_number: string;
  vehicle_status: string;
  vehicle_category: string;
  owner_name: string;
  purpose_of_visit: string;
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
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    status: 'all',
    companyId: 'all'
  });

  const [quickSearch, setQuickSearch] = useState({
    vehicleNumber: '',
    companyName: '',
    ownerName: ''
  });

  const [reportData, setReportData] = useState<ReportEntry[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    fetchCompanies();
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

  const handleSearch = async () => {
    setLoading(true);
    setHasSearched(true);

    try {
      let query = supabase
        .from('vehicle_entries')
        .select(`
          *,
          companies (
            name
          )
        `)
        .order('created_at', { ascending: false });

      // Apply date filters
      if (filters.fromDate) {
        query = query.gte('created_at', `${filters.fromDate}T00:00:00`);
      }
      if (filters.toDate) {
        query = query.lte('created_at', `${filters.toDate}T23:59:59`);
      }

      // Apply status filter
      if (filters.status !== 'all') {
        query = query.eq('vehicle_status', filters.status);
      }

      // Apply company filter
      if (filters.companyId !== 'all') {
        query = query.eq('company_id', filters.companyId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Apply client-side quick search filters
      let filteredData = data || [];
      
      if (quickSearch.vehicleNumber) {
        filteredData = filteredData.filter(entry =>
          entry.vehicle_number.toLowerCase().includes(quickSearch.vehicleNumber.toLowerCase())
        );
      }

      if (quickSearch.companyName) {
        filteredData = filteredData.filter(entry =>
          entry.companies?.name?.toLowerCase().includes(quickSearch.companyName.toLowerCase())
        );
      }

      if (quickSearch.ownerName) {
        filteredData = filteredData.filter(entry =>
          entry.owner_name?.toLowerCase().includes(quickSearch.ownerName.toLowerCase())
        );
      }

      setReportData(filteredData);
      
      toast({
        title: "Success!",
        description: `Found ${filteredData.length} records matching your criteria.`,
      });
    } catch (error: any) {
      console.error('Error fetching report data:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch report data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExcel = () => {
    if (reportData.length === 0) {
      toast({
        title: "No Data",
        description: "Please search for data first before exporting.",
        variant: "destructive"
      });
      return;
    }

    const exportData = reportData.map((entry, index) => ({
      'S.No.': index + 1,
      'Vehicle Number': entry.vehicle_number,
      'Status': entry.vehicle_status,
      'Category': entry.vehicle_category,
      'Company': entry.companies?.name || 'N/A',
      'Purpose': entry.purpose_of_visit || 'N/A',
      'Owner': entry.owner_name || 'N/A',
      'Date & Time': new Date(entry.created_at).toLocaleString()
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Vehicle Entries');
    
    const fileName = `vehicle_entries_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    toast({
      title: "Success!",
      description: "Excel file downloaded successfully.",
    });
  };

  const handleDownloadPDF = () => {
    if (reportData.length === 0) {
      toast({
        title: "No Data",
        description: "Please search for data first before exporting.",
        variant: "destructive"
      });
      return;
    }

    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text('Vehicle Entries Report', 14, 15);
    
    // Add generation date
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 25);

    // Prepare table data
    const tableData = reportData.map((entry, index) => [
      index + 1,
      entry.vehicle_number,
      entry.vehicle_status,
      entry.vehicle_category,
      entry.companies?.name || 'N/A',
      entry.purpose_of_visit || 'N/A',
      entry.owner_name || 'N/A',
      new Date(entry.created_at).toLocaleString()
    ]);

    // Add table
    autoTable(doc, {
      head: [['S.No.', 'Vehicle No.', 'Status', 'Category', 'Company', 'Purpose', 'Owner', 'Date & Time']],
      body: tableData,
      startY: 35,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
    });

    const fileName = `vehicle_entries_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);

    toast({
      title: "Success!",
      description: "PDF file downloaded successfully.",
    });
  };

  const getSummary = () => {
    const currentlyIn = reportData.filter(entry => entry.vehicle_status === 'IN').length;
    const currentlyOut = reportData.filter(entry => entry.vehicle_status === 'OUT').length;
    
    return {
      currentlyIn,
      currentlyOut,
      totalRecords: reportData.length
    };
  };

  const summary = getSummary();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reports & Tracking</h1>
          <p className="text-gray-600 mt-2">Filter, search and export vehicle entry data</p>
        </div>

        <Tabs defaultValue="filters" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="filters">Advanced Filters</TabsTrigger>
            <TabsTrigger value="quick-search">Quick Search</TabsTrigger>
          </TabsList>

          <TabsContent value="filters">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Advanced Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
                    <Select value={filters.companyId} onValueChange={(value) => setFilters(prev => ({ ...prev, companyId: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Companies</SelectItem>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleSearch} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                  <Search className="h-4 w-4 mr-2" />
                  {loading ? "Searching..." : "Search Records"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quick-search">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Quick Search
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="space-y-2">
                    <Label>Vehicle Number</Label>
                    <Input
                      placeholder="Search by vehicle number"
                      value={quickSearch.vehicleNumber}
                      onChange={(e) => setQuickSearch(prev => ({ ...prev, vehicleNumber: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Company Name</Label>
                    <Input
                      placeholder="Search by company name"
                      value={quickSearch.companyName}
                      onChange={(e) => setQuickSearch(prev => ({ ...prev, companyName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Owner Name</Label>
                    <Input
                      placeholder="Search by owner name"
                      value={quickSearch.ownerName}
                      onChange={(e) => setQuickSearch(prev => ({ ...prev, ownerName: e.target.value }))}
                    />
                  </div>
                </div>
                <Button onClick={handleSearch} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                  <Search className="h-4 w-4 mr-2" />
                  {loading ? "Searching..." : "Search Records"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Export Buttons */}
        {hasSearched && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <Button onClick={handleDownloadExcel} className="bg-green-600 hover:bg-green-700">
                  <Download className="h-4 w-4 mr-2" />
                  Export to Excel
                </Button>
                <Button onClick={handleDownloadPDF} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export to PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {hasSearched && (
          <Card>
            <CardHeader>
              <CardTitle>Search Results ({reportData.length} records found)</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Searching...</div>
              ) : (
                <>
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
                          <th className="text-left py-3 px-2 font-medium text-gray-700 hidden lg:table-cell">Date & Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.map((entry, index) => (
                          <tr key={entry.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-2">{index + 1}</td>
                            <td className="py-3 px-2 font-mono text-sm">{entry.vehicle_number}</td>
                            <td className="py-3 px-2">
                              <Badge 
                                variant={entry.vehicle_status === 'IN' ? 'default' : 'secondary'}
                                className={entry.vehicle_status === 'IN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                              >
                                {entry.vehicle_status}
                              </Badge>
                            </td>
                            <td className="py-3 px-2">
                              <Badge variant="outline">{entry.vehicle_category}</Badge>
                            </td>
                            <td className="py-3 px-2 hidden sm:table-cell text-sm">{entry.companies?.name || 'N/A'}</td>
                            <td className="py-3 px-2 hidden sm:table-cell text-sm">{entry.purpose_of_visit || 'N/A'}</td>
                            <td className="py-3 px-2 hidden md:table-cell text-sm">{entry.owner_name || 'N/A'}</td>
                            <td className="py-3 px-2 hidden lg:table-cell text-sm">{new Date(entry.created_at).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {reportData.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No records found matching your search criteria.
                    </div>
                  )}

                  {reportData.length > 0 && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-2">Summary</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Currently IN:</span>
                          <span className="ml-2 font-medium text-green-600">{summary.currentlyIn}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Currently OUT:</span>
                          <span className="ml-2 font-medium text-red-600">{summary.currentlyOut}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Total Records:</span>
                          <span className="ml-2 font-medium">{summary.totalRecords}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Search Date:</span>
                          <span className="ml-2 font-medium">{new Date().toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Reports;
