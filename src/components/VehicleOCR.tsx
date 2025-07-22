
import React, { useState, useRef, useCallback, useEffect } from 'react';
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
  const [ocrMethod, setOcrMethod] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // OCR.space API configuration
  const OCR_SPACE_API_KEY = 'K87630703888957';
  const OCR_SPACE_ENDPOINT = 'https://api.ocr.space/parse/image';

  // Vehicle number regex pattern
  const vehicleNumberRegex = /^([A-Za-z]{1,2}[0-9]{1,3}[A-Za-z]{1,3}[0-9]{3,5}|[0-9]{2}[A-Za-z]{2}[0-9]{4}[A-Za-z])$/i;

  // Cleanup camera stream on component unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const extractVehicleNumberWithOCRSpace = useCallback(async (imageFile: File): Promise<string | null> => {
    try {
      console.log('Attempting OCR with OCR.space API...');
      
      const formData = new FormData();
      formData.append('file', imageFile);
      formData.append('language', 'eng');
      formData.append('apikey', OCR_SPACE_API_KEY);
      formData.append('isOverlayRequired', 'false');
      formData.append('OCREngine', '2'); // Engine 2 is better for license plates
      formData.append('scale', 'true'); // Improve OCR for low-resolution images

      const response = await fetch(OCR_SPACE_ENDPOINT, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`OCR.space API error: ${response.status}`);
      }

      const result = await response.json();
      console.log('OCR.space API Response:', result);

      if (result.OCRExitCode === 1 && result.ParsedResults && result.ParsedResults.length > 0) {
        const parsedText = result.ParsedResults[0].ParsedText;
        console.log('OCR.space Parsed Text:', parsedText);

        // Clean up the text and look for vehicle numbers
        const cleanText = parsedText.replace(/\s+/g, '').replace(/\n/g, '');
        console.log('Cleaned text:', cleanText);
        
        // Try to find vehicle number pattern in the cleaned text
        const match = cleanText.match(/[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}/i);
        if (match) {
          return match[0].toUpperCase();
        }
        
        // Fallback: try broader pattern
        const broadMatch = cleanText.match(/[A-Z0-9]{8,13}/i);
        if (broadMatch) {
          return broadMatch[0].toUpperCase();
        }
      }

      return null;
    } catch (error) {
      console.error('OCR.space API Error:', error);
      return null;
    }
  }, []);

  const extractVehicleNumberWithTesseract = useCallback(async (imageFile: File | string): Promise<string | null> => {
    try {
      console.log('Attempting OCR with Tesseract.js (fallback)...');
      
      const { data: { text } } = await Tesseract.recognize(
        imageFile,
        'eng',
        {
          logger: (m) => console.log('Tesseract Progress:', m)
        }
      );

      console.log('Tesseract Raw Text:', text);
      
      // Clean up the text and look for vehicle numbers
      const cleanText = text.replace(/\s+/g, '').replace(/\n/g, '');
      console.log('Cleaned text:', cleanText);
      
      // Try to find vehicle number pattern in the cleaned text
      const match = cleanText.match(/[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}/i);
      if (match) {
        return match[0].toUpperCase();
      }
      
      // Fallback: try broader pattern
      const broadMatch = cleanText.match(/[A-Z0-9]{8,13}/i);
      if (broadMatch) {
        return broadMatch[0].toUpperCase();
      }

      return null;
    } catch (error) {
      console.error('Tesseract Error:', error);
      return null;
    }
  }, []);

  const extractVehicleNumber = useCallback(async (imageFile: File | string) => {
    setIsProcessing(true);
    setOcrMethod('');
    
    try {
      let vehicleNumber: string | null = null;
      let usedMethod = '';

      // First try OCR.space API (only for File objects)
      if (imageFile instanceof File) {
        vehicleNumber = await extractVehicleNumberWithOCRSpace(imageFile);
        if (vehicleNumber) {
          usedMethod = 'OCR.space API';
        }
      }

      // If OCR.space failed, try Tesseract.js as fallback
      if (!vehicleNumber) {
        vehicleNumber = await extractVehicleNumberWithTesseract(imageFile);
        if (vehicleNumber) {
          usedMethod = 'Tesseract.js (fallback)';
        }
      }

      setOcrMethod(usedMethod);

      if (vehicleNumber) {
        setDetectedNumber(vehicleNumber);
        
        if (onVehicleNumberDetected) {
          onVehicleNumberDetected(vehicleNumber);
        }
        
        toast({
          title: "Vehicle Number Detected",
          description: `Found: ${vehicleNumber} using ${usedMethod}`,
          className: "bg-green-50 border-green-200 text-green-800",
        });
      } else {
        toast({
          title: "No Vehicle Number Found",
          description: "Could not detect a valid vehicle number in the image using any OCR method.",
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
  }, [extractVehicleNumberWithOCRSpace, extractVehicleNumberWithTesseract, onVehicleNumberDetected]);

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
      console.log('Starting camera...');
      
      // Stop any existing stream first
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      console.log('Camera stream obtained:', mediaStream);
      setStream(mediaStream);
      setIsCameraOpen(true);
      
      // Wait for video element to be ready
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(console.error);
        }
      }, 100);

      toast({
        title: "Camera Started",
        description: "Camera is now active. Position the vehicle number in view and click Capture.",
        className: "bg-blue-50 border-blue-200 text-blue-800",
      });
    } catch (error) {
      console.error('Camera Error:', error);
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please check permissions and try again.",
        variant: "destructive",
      });
    }
  }, [stream]);

  const stopCamera = useCallback(() => {
    console.log('Stopping camera...');
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  }, [stream]);

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) {
      toast({
        title: "Error",
        description: "Camera not ready. Please try again.",
        variant: "destructive",
      });
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (!context) {
      toast({
        title: "Error",
        description: "Could not get canvas context.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to blob
      canvas.toBlob(async (blob) => {
        if (!blob) {
          toast({
            title: "Error",
            description: "Could not capture image.",
            variant: "destructive",
          });
          return;
        }

        // Create preview
        const imageUrl = URL.createObjectURL(blob);
        setPreviewImage(imageUrl);

        // Stop camera
        stopCamera();

        // Convert blob to File for OCR.space API
        const file = new File([blob], 'captured-image.jpg', { type: 'image/jpeg' });

        toast({
          title: "Photo Captured",
          description: "Processing image for vehicle number detection...",
          className: "bg-blue-50 border-blue-200 text-blue-800",
        });

        // Process with OCR
        await extractVehicleNumber(file);
      }, 'image/jpeg', 0.8);
    } catch (error) {
      console.error('Capture error:', error);
      toast({
        title: "Capture Error",
        description: "Failed to capture photo. Please try again.",
        variant: "destructive",
      });
    }
  }, [extractVehicleNumber, stopCamera]);

  const clearResults = useCallback(() => {
    setDetectedNumber('');
    setPreviewImage('');
    setOcrMethod('');
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
        <p className="text-sm text-gray-600">
          Uses OCR.space API with Tesseract.js fallback
        </p>
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
              disabled={isProcessing || isCameraOpen}
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing || isCameraOpen}
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
                  Capture Photo
                </Button>
                <Button
                  variant="outline"
                  onClick={stopCamera}
                  disabled={isProcessing}
                >
                  <X className="h-4 w-4 mr-2" />
                  Close Camera
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Camera Preview */}
        {isCameraOpen && (
          <div className="relative">
            <Label className="text-sm font-medium mb-2 block">Camera View</Label>
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-64 object-cover"
              />
              <div className="absolute inset-0 border-2 border-dashed border-yellow-400 m-4 rounded-lg pointer-events-none">
                <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                  Position vehicle number in frame
                </div>
              </div>
            </div>
            <canvas
              ref={canvasRef}
              className="hidden"
            />
          </div>
        )}

        {/* Image Preview */}
        {previewImage && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Captured Image</Label>
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
              {ocrMethod && (
                <p className="text-xs text-green-600 text-center mt-1">
                  Detected using: {ocrMethod}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Clear Results */}
        {(detectedNumber || previewImage) && (
          <Button
            variant="outline"
            onClick={clearResults}
            className="w-full"
            disabled={isProcessing}
          >
            Clear Results
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default VehicleOCR;
