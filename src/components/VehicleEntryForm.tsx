import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Car, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface VehicleEntry {
  vehicleNumber: string;
  vehicleStatus: string;
  vehicleCategory: string;
  companyId: string;
  purposeOfVisit: string;
  ownerName: string;
}

interface Company {
  id: string;
  name: string;
}

const VehicleEntryForm = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<VehicleEntry>({
    vehicleNumber: '',
    vehicleStatus: '',
    vehicleCategory: '',
    companyId: 'others',
    purposeOfVisit: 'Job',
    ownerName: ''
  });

  const [companies, setCompanies] = useState<Company[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchCompanies();
      fetchUserProfile();
    }
  }, [user]);

  const fetchCompanies = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast({
        title: "Error",
        description: "Failed to load companies.",
        variant: "destructive",
        duration: 3000
      });
    }
  };

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchVehicleData = async (vehicleNumber: string) => {
    if (!vehicleNumber.trim() || !user) return null;

    try {
      const { data, error } = await supabase
        .from('vehicle_entries')
        .select(`
          *,
          companies (
            id,
            name
          )
        `)
        .eq('vehicle_number', vehicleNumber.toUpperCase())
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      return data?.[0] || null;
    } catch (error) {
      console.error('Error fetching vehicle data:', error);
      return null;
    }
  };

  const handleVehicleNumberChange = async (value: string) => {
    // Allow only letters and numbers, max 13 characters
    const sanitizedValue = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 13);
    
    setFormData(prev => ({
      ...prev,
      vehicleNumber: sanitizedValue
    }));

    if (sanitizedValue.length >= 3) {
      const vehicleData = await fetchVehicleData(sanitizedValue);
      
      if (vehicleData) {
        // Auto-fill form with existing data
        setFormData(prev => ({
          ...prev,
          vehicleCategory: vehicleData.vehicle_category || '',
          companyId: vehicleData.company_id || 'others',
          purposeOfVisit: vehicleData.purpose_of_visit || 'Job',
          ownerName: vehicleData.owner_name || '',
          // Toggle vehicle status
          vehicleStatus: vehicleData.vehicle_status === 'IN' ? 'OUT' : 'IN'
        }));

        toast({
          title: "Vehicle Found",
          description: "Form auto-filled with existing vehicle data. Status toggled automatically.",
          className: "bg-blue-50 border-blue-200",
          duration: 3000
        });
      }
    }
  };

  const handleOwnerNameChange = (value: string) => {
    // Allow only letters and spaces
    const sanitizedValue = value.replace(/[^a-zA-Z\s]/g, '');
    setFormData(prev => ({
      ...prev,
      ownerName: sanitizedValue
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.vehicleNumber || !formData.vehicleStatus || !formData.vehicleCategory) {
      toast({
        title: "Error",
        description: "Please fill in all mandatory fields.",
        variant: "destructive",
        duration: 3000
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to submit entries.",
        variant: "destructive",
        duration: 3000
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('vehicle_entries')
        .insert({
          user_id: user.id,
          vehicle_number: formData.vehicleNumber,
          vehicle_status: formData.vehicleStatus,
          vehicle_category: formData.vehicleCategory,
          company_id: formData.companyId === 'others' ? null : formData.companyId,
          purpose_of_visit: formData.purposeOfVisit,
          owner_name: formData.ownerName || null,
          user_name: userProfile?.name || `${userProfile?.first_name || ''} ${userProfile?.last_name || ''}`.trim() || user.email,
          user_mobile: userProfile?.mobile || null
        });

      if (error) throw error;
      
      toast({
        title: "Success!",
        description: "Vehicle entry submitted successfully.",
        className: "bg-green-50 border-green-200 text-green-800",
        duration: 2000
      });
      
      // Reset form
      setFormData({
        vehicleNumber: '',
        vehicleStatus: '',
        vehicleCategory: '',
        companyId: 'others',
        purposeOfVisit: 'Job',
        ownerName: ''
      });
      
    } catch (error: any) {
      console.error('Error submitting entry:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit entry. Please try again.",
        variant: "destructive",
        duration: 3000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof VehicleEntry, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!user) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center">Please log in to submit vehicle entries.</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Car className="h-6 w-6 text-blue-600" />
          Vehicle Entry Form
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vehicleNumber" className="text-sm font-medium">
                Vehicle Number *
              </Label>
              <Input
                id="vehicleNumber"
                placeholder="Enter vehicle number"
                value={formData.vehicleNumber}
                onChange={(e) => handleVehicleNumberChange(e.target.value)}
                className="w-full uppercase"
                maxLength={13}
                required
              />
              <p className="text-xs text-gray-500">Max 13 characters, letters and numbers only</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicleStatus" className="text-sm font-medium">
                Vehicle Status *
              </Label>
              <Select value={formData.vehicleStatus} onValueChange={(value) => handleInputChange('vehicleStatus', value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN">Vehicle IN</SelectItem>
                  <SelectItem value="OUT">Vehicle OUT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicleCategory" className="text-sm font-medium">
                Vehicle Category *
              </Label>
              <Select value={formData.vehicleCategory} onValueChange={(value) => handleInputChange('vehicleCategory', value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Car">Car</SelectItem>
                  <SelectItem value="Bike">Bike</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-sm font-medium">
                Company Name
              </Label>
              <Select value={formData.companyId} onValueChange={(value) => handleInputChange('companyId', value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="others">Others</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purposeOfVisit" className="text-sm font-medium">
                Purpose of Visit
              </Label>
              <Select value={formData.purposeOfVisit} onValueChange={(value) => handleInputChange('purposeOfVisit', value)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="To Meet Someone">To Meet Someone</SelectItem>
                  <SelectItem value="Job">Job</SelectItem>
                  <SelectItem value="Interview">Interview</SelectItem>
                  <SelectItem value="Others">Others</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="ownerName" className="text-sm font-medium">
                Vehicle Owner Name
              </Label>
              <Input
                id="ownerName"
                placeholder="Enter owner name (letters only)"
                value={formData.ownerName}
                onChange={(e) => handleOwnerNameChange(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-gray-500">Letters and spaces only</p>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full mt-6 bg-blue-600 hover:bg-blue-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              "Submitting..."
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Submit Entry
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default VehicleEntryForm;
