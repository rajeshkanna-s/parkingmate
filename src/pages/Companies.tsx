
import { useState } from 'react';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, X, Building2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Companies = () => {
  const [companies, setCompanies] = useState([
    'TechCorp Ltd.',
    'Digital Solutions Inc.',
    'Innovation Hub',
    'StartupVenture'
  ]);
  
  const [newCompany, setNewCompany] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');

  const handleAddCompany = () => {
    if (!newCompany.trim()) {
      toast({
        title: "Error",
        description: "Please enter a company name.",
        variant: "destructive"
      });
      return;
    }

    if (companies.includes(newCompany.trim())) {
      toast({
        title: "Error",
        description: "Company already exists.",
        variant: "destructive"
      });
      return;
    }

    setCompanies(prev => [...prev, newCompany.trim()]);
    setNewCompany('');
    toast({
      title: "Success!",
      description: "Company added successfully.",
    });
  };

  const handleEditCompany = (index: number) => {
    setEditingIndex(index);
    setEditingValue(companies[index]);
  };

  const handleSaveEdit = () => {
    if (!editingValue.trim()) {
      toast({
        title: "Error",
        description: "Company name cannot be empty.",
        variant: "destructive"
      });
      return;
    }

    const updatedCompanies = [...companies];
    updatedCompanies[editingIndex!] = editingValue.trim();
    setCompanies(updatedCompanies);
    setEditingIndex(null);
    setEditingValue('');
    
    toast({
      title: "Success!",
      description: "Company updated successfully.",
    });
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingValue('');
  };

  const handleDeleteCompany = (index: number) => {
    const companyName = companies[index];
    setCompanies(prev => prev.filter((_, i) => i !== index));
    
    toast({
      title: "Success!",
      description: `${companyName} has been removed.`,
    });
  };

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
                  key={index}
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
                        <span className="text-gray-900 font-medium">{company}</span>
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
