
import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, X, Building2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Company {
  id: string;
  name: string;
  created_at: string;
}

const Companies = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [newCompany, setNewCompany] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompanies();
    subscribeToChanges();
  }, []);

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast({
        title: "Error",
        description: "Failed to load companies.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const subscribeToChanges = () => {
    const channel = supabase
      .channel('companies_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'companies'
        },
        () => {
          console.log('Companies changed, refetching...');
          fetchCompanies();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleAddCompany = async () => {
    if (!newCompany.trim()) {
      toast({
        title: "Error",
        description: "Please enter a company name.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('companies')
        .insert({ name: newCompany.trim() });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Error",
            description: "Company already exists.",
            variant: "destructive"
          });
        } else {
          throw error;
        }
        return;
      }

      setNewCompany('');
      toast({
        title: "Success!",
        description: "Company added successfully.",
      });
    } catch (error: any) {
      console.error('Error adding company:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add company.",
        variant: "destructive"
      });
    }
  };

  const handleEditCompany = (index: number) => {
    setEditingIndex(index);
    setEditingValue(companies[index].name);
  };

  const handleSaveEdit = async () => {
    if (!editingValue.trim()) {
      toast({
        title: "Error",
        description: "Company name cannot be empty.",
        variant: "destructive"
      });
      return;
    }

    try {
      const company = companies[editingIndex!];
      const { error } = await supabase
        .from('companies')
        .update({ name: editingValue.trim() })
        .eq('id', company.id);

      if (error) throw error;

      setEditingIndex(null);
      setEditingValue('');
      
      toast({
        title: "Success!",
        description: "Company updated successfully.",
      });
    } catch (error: any) {
      console.error('Error updating company:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update company.",
        variant: "destructive"
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingValue('');
  };

  const handleDeleteCompany = async (index: number) => {
    const company = companies[index];
    
    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', company.id);

      if (error) throw error;
      
      toast({
        title: "Success!",
        description: `${company.name} has been removed.`,
      });
    } catch (error: any) {
      console.error('Error deleting company:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete company.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Loading companies...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Company Management</h1>
          <p className="text-gray-600 mt-2">Manage company list for vehicle entries</p>
        </div>

        {/* Add New Company */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Company
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="newCompany">Company Name</Label>
                <Input
                  id="newCompany"
                  placeholder="Enter company name"
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCompany()}
                />
              </div>
              <div className="self-end">
                <Button onClick={handleAddCompany} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Company
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Companies List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Company List ({companies.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {companies.map((company, index) => (
                <div
                  key={company.id}
                  className="flex items-center justify-between p-4 bg-white border rounded-lg hover:shadow-sm transition-shadow"
                >
                  {editingIndex === index ? (
                    <div className="flex items-center gap-3 flex-1">
                      <Input
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                        className="flex-1"
                      />
                      <Button onClick={handleSaveEdit} size="sm" className="bg-green-600 hover:bg-green-700">
                        Save
                      </Button>
                      <Button onClick={handleCancelEdit} size="sm" variant="outline">
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-sm">
                          {index + 1}
                        </Badge>
                        <span className="text-gray-900 font-medium">{company.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleEditCompany(index)}
                          size="sm"
                          variant="outline"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteCompany(index)}
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700 hover:border-red-300"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              
              {companies.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No companies added yet. Add your first company above.
                </div>
              )}
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Changes to the company list will be immediately reflected in the vehicle entry form dropdown.
                The "Others" option is always available by default.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Companies;
