
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Company {
  id: string;
  name: string;
}

interface Entry {
  id: string;
  vehicle_number: string;
  vehicle_category: string;
  vehicle_status: string;
  owner_name: string | null;
  purpose_of_visit: string;
  user_name: string | null;
  user_mobile: string | null;
  company_id: string | null;
  companies: {
    name: string;
  } | null;
}

interface EditEntryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  entryId: string | null;
  onSuccess: () => void;
}

const EditEntryDialog = ({ isOpen, onClose, entryId, onSuccess }: EditEntryDialogProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [formData, setFormData] = useState({
    vehicle_number: '',
    vehicle_category: 'Car',
    vehicle_status: 'IN',
    company_id: '',
    owner_name: '',
    purpose_of_visit: 'Work',
    user_name: '',
    user_mobile: ''
  });

  useEffect(() => {
    if (user) {
      fetchCompanies();
    }
  }, [user]);

  useEffect(() => {
    if (isOpen && entryId) {
      fetchEntry();
    }
  }, [isOpen, entryId]);

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
    }
  };

  const fetchEntry = async () => {
    if (!entryId || !user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vehicle_entries')
        .select(`
          *,
          companies (
            name
          )
        `)
        .eq('id', entryId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          vehicle_number: data.vehicle_number,
          vehicle_category: data.vehicle_category,
          vehicle_status: data.vehicle_status,
          company_id: data.company_id || 'others',
          owner_name: data.owner_name || '',
          purpose_of_visit: data.purpose_of_visit || 'Work',
          user_name: data.user_name || '',
          user_mobile: data.user_mobile || ''
        });
      }
    } catch (error) {
      console.error('Error fetching entry:', error);
      toast({
        title: "Error",
        description: "Failed to load entry details.",
        variant: "destructive",
        duration: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryId || !user) return;

    setLoading(true);
    try {
      const updateData = {
        vehicle_number: formData.vehicle_number.toUpperCase(),
        vehicle_category: formData.vehicle_category,
        vehicle_status: formData.vehicle_status,
        company_id: formData.company_id === 'others' ? null : formData.company_id,
        owner_name: formData.owner_name || null,
        purpose_of_visit: formData.purpose_of_visit,
        user_name: formData.user_name || null,
        user_mobile: formData.user_mobile || null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('vehicle_entries')
        .update(updateData)
        .eq('id', entryId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Entry updated successfully.",
        duration: 3000
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error updating entry:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update entry.",
        variant: "destructive",
        duration: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto overflow-x-hidden max-w-full">
        <DialogHeader>
          <DialogTitle>Edit Vehicle Entry</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-vehicle-number">Vehicle Number</Label>
            <Input
              id="edit-vehicle-number"
              value={formData.vehicle_number}
              onChange={(e) => setFormData(prev => ({ ...prev, vehicle_number: e.target.value }))}
              placeholder="Enter vehicle number"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-vehicle-category">Vehicle Category</Label>
            <Select 
              value={formData.vehicle_category} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, vehicle_category: value }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>



              <SelectContent>

                <SelectItem value="Car">Car</SelectItem>
                <SelectItem value="Bike">Bike</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-vehicle-status">Vehicle Status</Label>
            <Select 
              value={formData.vehicle_status} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, vehicle_status: value }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>

=======
              <SelectContent>

                <SelectItem value="IN">Vehicle IN</SelectItem>
                <SelectItem value="OUT">Vehicle OUT</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-company">Company Name</Label>
            <Select 
              value={formData.company_id} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, company_id: value }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
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
            <Label htmlFor="edit-owner-name">Owner Name</Label>
            <Input
              id="edit-owner-name"
              value={formData.owner_name}
              onChange={(e) => setFormData(prev => ({ ...prev, owner_name: e.target.value }))}
              placeholder="Enter owner name (optional)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-purpose">Purpose of Visit</Label>
            <Select 
              value={formData.purpose_of_visit} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, purpose_of_visit: value }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>


              <SelectContent>

                <SelectItem value="Work">Work</SelectItem>
                <SelectItem value="Meeting">Meeting</SelectItem>
                <SelectItem value="Delivery">Delivery</SelectItem>
                <SelectItem value="Personal">Personal</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-user-name">User Name</Label>
            <Input
              id="edit-user-name"
              value={formData.user_name}
              onChange={(e) => setFormData(prev => ({ ...prev, user_name: e.target.value }))}
              placeholder="Enter user name (optional)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-user-mobile">User Mobile</Label>
            <Input
              id="edit-user-mobile"
              value={formData.user_mobile}
              onChange={(e) => setFormData(prev => ({ ...prev, user_mobile: e.target.value }))}
              placeholder="Enter user mobile (optional)"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Entry"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditEntryDialog;
