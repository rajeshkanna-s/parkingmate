
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Car, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface VehicleEntry {
  vehicleNumber: string;
  vehicleStatus: string;
  vehicleCategory: string;
  companyName: string;
  purposeOfVisit: string;
  ownerName: string;
}

const VehicleEntryForm = () => {
  const [formData, setFormData] = useState<VehicleEntry>({
    vehicleNumber: '',
    vehicleStatus: '',
    vehicleCategory: '',
    companyName: 'Others',
    purposeOfVisit: 'Job',
    ownerName: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const companies = [
    'TechCorp Ltd.',
    'Digital Solutions Inc.',
    'Innovation Hub',
    'StartupVenture',
    'Others'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.vehicleNumber || !formData.vehicleStatus || !formData.vehicleCategory) {
      toast({
        title: "Error",
        description: "Please fill in all mandatory fields.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate API call - replace with actual Supabase integration
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Vehicle entry submitted:', {
        ...formData,
        timestamp: new Date().toISOString()
      });
      
      toast({
        title: "Success!",
        description: "Entry submitted successfully.",
      });
      
      // Reset form
      setFormData({
        vehicleNumber: '',
        vehicleStatus: '',
        vehicleCategory: '',
        companyName: 'Others',
        purposeOfVisit: 'Job',
        ownerName: ''
      });
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit entry. Please try again.",
        variant: "destructive"
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
                onChange={(e) => handleInputChange('vehicleNumber', e.target.value)}
                className="w-full"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicleStatus" className="text-sm font-medium">
                Vehicle Status *
              </Label>
              <Select value={formData.vehicleStatus} onValueChange={(value) => handleInputChange('vehicleStatus', value)}>
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
              <Select value={formData.vehicleCategory} onValueChange={(value) => handleInputChange('vehicleCategory', value)}>
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
              <Select value={formData.companyName} onValueChange={(value) => handleInputChange('companyName', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company} value={company}>
                      {company}
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
                placeholder="Enter owner name (optional)"
                value={formData.ownerName}
                onChange={(e) => handleInputChange('ownerName', e.target.value)}
                className="w-full"
              />
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
