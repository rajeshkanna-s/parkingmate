import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import EditEntryDialog from './EditEntryDialog';
import { useAuth } from '@/contexts/AuthContext';

interface Entry {
  id: string;
  vehicle_number: string;
  vehicle_category: string;
  vehicle_status: string;
  owner_name: string;
  purpose_of_visit: string;
  created_at: string;
  companies: {
    name: string;
  } | null;
}

const RecentEntries = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchEntries();
      subscribeToChanges();
    }
  }, [user]);

  const fetchEntries = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('vehicle_entries')
        .select(`
          *,
          companies (
            name
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching entries:', error);
      toast({
        title: "Error",
        description: "Failed to load recent entries.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const subscribeToChanges = () => {
    if (!user) return;

    const channel = supabase
      .channel('vehicle_entries_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vehicle_entries',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          console.log('Vehicle entries changed, refetching...');
          fetchEntries();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const filteredEntries = entries.filter(entry =>
    entry.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (entry.owner_name && entry.owner_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (entry.companies?.name && entry.companies.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleEdit = (entryId: string) => {
    setSelectedEntryId(entryId);
    setEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    fetchEntries();
  };

  if (!user) {
    return (
      <Card className="w-full max-w-6xl mx-auto mt-8">
        <CardContent className="p-6">
          <div className="text-center">Please log in to view recent entries.</div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="w-full max-w-6xl mx-auto mt-8">
        <CardContent className="p-6">
          <div className="text-center">Loading recent entries...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
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
                    <td className="py-3 px-2 hidden sm:table-cell text-sm">{entry.companies?.name || 'Others'}</td>
                    <td className="py-3 px-2 hidden md:table-cell text-sm">{entry.owner_name || 'N/A'}</td>
                    <td className="py-3 px-2 hidden lg:table-cell text-sm text-gray-600">
                      {new Date(entry.created_at).toLocaleString()}
                    </td>
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

      <EditEntryDialog
        isOpen={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        entryId={selectedEntryId}
        onSuccess={handleEditSuccess}
      />
    </>
  );
};

export default RecentEntries;
