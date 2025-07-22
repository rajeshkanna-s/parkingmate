
import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import Tesseract from 'tesseract.js';

interface VehicleOCRProps {
  onVehicleNumberDetected?: (vehicleNumber: string) => void;
}

const VehicleOCR: React.FC<VehicleOCRProps> = ({ onVehicleNumberDetected }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedNumber, setDetectedNumber] = useState<string>('');
  const [previewImage, setPreviewImage] = useState<string>('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Vehicle number regex pattern
  //const vehicleNumberRegex = /[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}/g;
   const vehicleNumberRegex = /^[A-Za-z0-9]{1,14}$/;

  const extractVehicleNumber = useCallback(async (imageFile: File | string) => {
    setIsProcessing(true);
    
    try {
      const result = await Tesseract.recognize(
        imageFile,
        'eng',
        {
          logger: (m) => console.log('OCR Progress:', m),
          config: 'tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 tessedit_pageseg_mode=7'
        } as any
      );
      const text = result.data.text;

      console.log('OCR Raw Text:', text);
      
      // Extract vehicle numbers using regex
      const matches = text.match(vehicleNumberRegex);
      
      if (matches && matches.length > 0) {
        const vehicleNumber = matches[0];
        setDetectedNumber(vehicleNumber);
        
        if (onVehicleNumberDetected) {
          onVehicleNumberDetected(vehicleNumber);
        }
        
        toast({
          title: "Vehicle Number Detected",
          description: `Found: ${vehicleNumber}`,
          className: "bg-green-50 border-green-200 text-green-800",
        });
      } else {
        toast({
          title: "No Vehicle Number Found",
          description: "Could not detect a valid vehicle number in the image.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('OCR Error:', error);
      toast({
        title: "OCR Error",
        description: "Failed to process the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [onVehicleNumberDetected]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload an image file.",
        variant: "destructive",
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Process with OCR
    await extractVehicleNumber(file);
  }, [extractVehicleNumber]);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' } // Use back camera on mobile
      });
      
      setStream(mediaStream);
      setIsCameraOpen(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Camera Error:', error);
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please check permissions.",
        variant: "destructive",
      });
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  }, [stream]);

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0);

    // Convert canvas to blob
    canvas.toBlob(async (blob) => {
      if (!blob) return;

      // Create preview
      const imageUrl = URL.createObjectURL(blob);
      setPreviewImage(imageUrl);

      // Stop camera
      stopCamera();

      // Process with OCR
      await extractVehicleNumber(blob as any);
    }, 'image/jpeg', 0.8);
  }, [extractVehicleNumber, stopCamera]);

  const clearResults = useCallback(() => {
    setDetectedNumber('');
    setPreviewImage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-6 w-6 text-blue-600" />
          Vehicle Number Detection (OCR)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload Section */}
        <div className="space-y-4">
          <Label htmlFor="file-upload" className="text-sm font-medium">
            Upload Image
          </Label>
          <div className="flex items-center gap-4">
            <Input
              id="file-upload"
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              ref={fileInputRef}
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
            >
              <Upload className="h-4 w-4 mr-2" />
              Browse
            </Button>
          </div>
        </div>

        {/* Camera Section */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Camera Capture</Label>
          <div className="flex items-center gap-4">
            {!isCameraOpen ? (
              <Button
                onClick={startCamera}
                disabled={isProcessing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Camera className="h-4 w-4 mr-2" />
                Open Camera
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={capturePhoto}
                  disabled={isProcessing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Capture
                </Button>
                <Button
                  variant="outline"
                  onClick={stopCamera}
                  disabled={isProcessing}
                >
                  <X className="h-4 w-4 mr-2" />
                  Close
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Camera Preview */}
        {isCameraOpen && (
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-64 bg-black rounded-lg object-cover"
            />
            <canvas
              ref={canvasRef}
              className="hidden"
            />
          </div>
        )}

        {/* Image Preview */}
        {previewImage && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Preview</Label>
            <img
              src={previewImage}
              alt="Preview"
              className="w-full h-64 object-contain bg-gray-100 rounded-lg"
            />
          </div>
        )}

        {/* Processing Status */}
        {isProcessing && (
          <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
            <span className="text-blue-800">Processing image with OCR...</span>
          </div>
        )}

        {/* Detected Vehicle Number */}
        {detectedNumber && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Detected Vehicle Number</Label>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-2xl font-bold text-green-800 text-center">
                {detectedNumber}
              </p>
            </div>
          </div>
        )}

        {/* Clear Results */}
        {(detectedNumber || previewImage) && (
          <Button
            variant="outline"
            onClick={clearResults}
            className="w-full"
          >
            Clear Results
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default VehicleOCR;
