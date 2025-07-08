
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface EditEntryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  entryId: string | null;
  onSuccess: () => void;
}

interface Company {
  id: string;
  name: string;
}

interface EntryData {
  vehicle_number: string;
  vehicle_status: string;
  vehicle_category: string;
  company_id: string | null;
  purpose_of_visit: string;
  owner_name: string | null;
}

const EditEntryDialog = ({ isOpen, onClose, entryId, onSuccess }: EditEntryDialogProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<EntryData>({
    vehicle_number: '',
    vehicle_status: '',
    vehicle_category: '',
    company_id: null,
    purpose_of_visit: 'Job',
    owner_name: null
  });
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCompanies();
      if (entryId) {
        fetchEntryData();
      }
    }
  }, [isOpen, entryId]);

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

  const fetchEntryData = async () => {
    if (!entryId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('vehicle_entries')
        .select('*')
        .eq('id', entryId)
        .single();

      if (error) throw error;
      
      setFormData({
        vehicle_number: data.vehicle_number || '',
        vehicle_status: data.vehicle_status || '',
        vehicle_category: data.vehicle_category || '',
        company_id: data.company_id,
        purpose_of_visit: data.purpose_of_visit || 'Job',
        owner_name: data.owner_name
      });
    } catch (error) {
      console.error('Error fetching entry data:', error);
      toast({
        title: "Error",
        description: "Failed to load entry data.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVehicleNumberChange = (value: string) => {
    // Allow only letters and numbers, max 13 characters
    const sanitizedValue = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 13);
    setFormData(prev => ({ ...prev, vehicle_number: sanitizedValue }));
  };

  const handleOwnerNameChange = (value: string) => {
    // Allow only letters and spaces
    const sanitizedValue = value.replace(/[^a-zA-Z\s]/g, '');
    setFormData(prev => ({ ...prev, owner_name: sanitizedValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.vehicle_number || !formData.vehicle_status || !formData.vehicle_category) {
      toast({
        title: "Error",
        description: "Please fill in all mandatory fields.",
        variant: "destructive"
      });
      return;
    }

    if (!user || !entryId) return;

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('vehicle_entries')
        .update({
          vehicle_number: formData.vehicle_number,
          vehicle_status: formData.vehicle_status,
          vehicle_category: formData.vehicle_category,
          company_id: formData.company_id,
          purpose_of_visit: formData.purpose_of_visit,
          owner_name: formData.owner_name || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', entryId);

      if (error) throw error;
      
      toast({
        title: "Success!",
        description: "Entry updated successfully.",
        className: "bg-green-50 border-green-200 text-green-800"
      });
      
      onSuccess();
      onClose();
      
    } catch (error: any) {
      console.error('Error updating entry:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update entry. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Vehicle Entry</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="p-6 text-center">Loading entry data...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicleNumber" className="text-sm font-medium">
                  Vehicle Number *
                </Label>
                <Input
                  id="vehicleNumber"
                  value={formData.vehicle_number}
                  onChange={(e) => handleVehicleNumberChange(e.target.value)}
                  className="w-full uppercase"
                  maxLength={13}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicleStatus" className="text-sm font-medium">
                  Vehicle Status *
                </Label>
                <Select value={formData.vehicle_status} onValueChange={(value) => setFormData(prev => ({ ...prev, vehicle_status: value }))}>
                  <SelectTrigger>
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
                <Select value={formData.vehicle_category} onValueChange={(value) => setFormData(prev => ({ ...prev, vehicle_category: value }))}>
                  <SelectTrigger>
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
                <Select value={formData.company_id || ''} onValueChange={(value) => setFormData(prev => ({ ...prev, company_id: value || null }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
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
                <Select value={formData.purpose_of_visit} onValueChange={(value) => setFormData(prev => ({ ...prev, purpose_of_visit: value }))}>
                  <SelectTrigger>
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
                  value={formData.owner_name || ''}
                  onChange={(e) => handleOwnerNameChange(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Updating..." : "Update Entry"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditEntryDialog;
