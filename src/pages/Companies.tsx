
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
import { useAuth } from '@/contexts/AuthContext';

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
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchCompanies();
      subscribeToChanges();
    }
  }, [user]);

  const fetchCompanies = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, created_at')
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
    if (!user) return;

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
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add companies.",
        variant: "destructive"
      });
      return;
    }

    if (!newCompany.trim()) {
      toast({
        title: "Error",
        description: "Please enter a company name.",
        variant: "destructive"
      });
      return;
    }

    // Check if trying to add "Others" which is reserved
    if (newCompany.trim().toLowerCase() === 'others') {
      toast({
        title: "Error",
        description: "Company name 'Others' is reserved and cannot be added.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('companies')
        .insert({ 
          name: newCompany.trim()
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Error",
            description: "Company already exists in your list.",
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
    if (!user) return;

    if (!editingValue.trim()) {
      toast({
        title: "Error",
        description: "Company name cannot be empty.",
        variant: "destructive"
      });
      return;
    }

    // Check if trying to rename to "Others" which is reserved
    if (editingValue.trim().toLowerCase() === 'others') {
      toast({
        title: "Error",
        description: "Company name 'Others' is reserved and cannot be used.",
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

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Error",
            description: "Company name already exists in your list.",
            variant: "destructive"
          });
        } else {
          throw error;
        }
        return;
      }

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
    if (!user) return;

    const company = companies[index];
    
    // Show confirmation dialog
    if (!confirm(`Are you sure you want to delete "${company.name}"?`)) {
      return;
    }
    
    try {
      console.log('Attempting to delete company:', company.id, company.name);
      
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', company.id);

      if (error) {
        console.error('Delete error:', error);
        if (error.code === '23503') {
          toast({
            title: "Cannot Delete",
            description: "This company is still referenced in vehicle entries. Please remove those entries first.",
            variant: "destructive"
          });
        } else {
          throw error;
        }
        return;
      }
      
      console.log('Company deleted successfully');
      
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Please log in to manage companies.</div>
        </div>
      </div>
    );
  }

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
          <p className="text-gray-600 mt-2">Manage your company list for vehicle entries</p>
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
              Company List ({companies.length + 1}) {/* +1 for Others */}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Static "Others" entry */}
              <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-sm bg-blue-100 text-blue-800">
                    Static
                  </Badge>
                  <span className="text-gray-900 font-medium">Others</span>
                  <span className="text-sm text-blue-600">(Default option)</span>
                </div>
                <div className="text-sm text-gray-500">
                  Cannot be edited or removed
                </div>
              </div>

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
                        autoFocus
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
                <strong>Note:</strong> Changes to your company list will be immediately reflected in the vehicle entry form dropdown.
                The "Others" option is always available by default and cannot be removed.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Companies;
