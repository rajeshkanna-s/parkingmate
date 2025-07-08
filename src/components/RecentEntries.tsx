
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Entry {
  id: string;
  vehicleNumber: string;
  category: string;
  status: string;
  company: string;
  ownerName: string;
  timestamp: string;
}

const RecentEntries = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Mock data - replace with actual data from Supabase
  const [entries] = useState<Entry[]>([
    {
      id: '1',
      vehicleNumber: 'MH12AB1234',
      category: 'Car',
      status: 'IN',
      company: 'TechCorp Ltd.',
      ownerName: 'John Doe',
      timestamp: '2024-01-15 10:30 AM'
    },
    {
      id: '2',
      vehicleNumber: 'MH14CD5678',
      category: 'Bike',
      status: 'OUT',
      company: 'Digital Solutions Inc.',
      ownerName: 'Jane Smith',
      timestamp: '2024-01-15 11:45 AM'
    },
    {
      id: '3',
      vehicleNumber: 'KA01EF9012',
      category: 'Car',
      status: 'IN',
      company: 'Others',
      ownerName: 'Mike Johnson',
      timestamp: '2024-01-15 12:15 PM'
    }
  ]);

  const filteredEntries = entries.filter(entry =>
    entry.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.ownerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (entryId: string) => {
    console.log('Edit entry:', entryId);
    // Implement edit functionality
  };

  return (
    <Card className="w-full max-w-6xl mx-auto mt-8">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Recent Entries</span>
          <div className="flex items-center gap-2 w-full max-w-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by vehicle number or owner..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
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
                <th className="text-left py-3 px-2 font-medium text-gray-700 hidden lg:table-cell">Time</th>
                <th className="text-center py-3 px-2 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry) => (
                <tr key={entry.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-2 font-mono text-sm">{entry.vehicleNumber}</td>
                  <td className="py-3 px-2">
                    <Badge variant="outline">{entry.category}</Badge>
                  </td>
                  <td className="py-3 px-2">
                    <Badge 
                      variant={entry.status === 'IN' ? 'default' : 'secondary'}
                      className={entry.status === 'IN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                    >
                      {entry.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-2 hidden sm:table-cell text-sm">{entry.company}</td>
                  <td className="py-3 px-2 hidden md:table-cell text-sm">{entry.ownerName}</td>
                  <td className="py-3 px-2 hidden lg:table-cell text-sm text-gray-600">{entry.timestamp}</td>
                  <td className="py-3 px-2 text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(entry.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredEntries.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No entries found matching your search.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentEntries;
