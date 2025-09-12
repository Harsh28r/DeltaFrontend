"use client";
import React, { useState, useEffect, useRef } from "react";
import { Button, Card, Label, TextInput, Alert, FileInput, Select, Textarea } from "flowbite-react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { API_ENDPOINTS } from "@/lib/config";

interface ChannelPartnerData {
  name: string;
  phone: string;
  firmName: string;
  location: string;
  address: string;
  mahareraNo: string;
  pinCode: string;
}

interface Location {
  lat: number;
  lng: number;
}

interface FormData {
  // Channel Partner Data
  channelPartnerData: ChannelPartnerData;
  // Project and Location
  projectId: string;
  location: Location;
  selfie: string;
  selfieFile: File | null;
}

interface FormErrors {
  [key: string]: string;
}

interface Project {
  _id: string;
  name: string;
  description?: string;
}

const AddCPSourcingPage = () => {
  const router = useRouter();
  const { token } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [status, setStatus] = useState<{ type: "idle" | "success" | "error"; message?: string }>({ type: "idle" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');

  const [formData, setFormData] = useState<FormData>({
    channelPartnerData: {
      name: "",
      phone: "",
      firmName: "",
      location: "",
      address: "",
      mahareraNo: "",
      pinCode: "",
    },
    projectId: "",
    location: { lat: 0, lng: 0 },
    selfie: "",
    selfieFile: null,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Fetch projects
  useEffect(() => {
    if (token) {
      fetchProjects();
    }
  }, [token]);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const fetchProjects = async () => {
    try {
      setIsLoadingProjects(true);
      const response = await fetch(API_ENDPOINTS.PROJECTS, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || data || []);
      } else {
        console.error("Failed to fetch projects");
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('channelPartnerData.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        channelPartnerData: {
          ...prev.channelPartnerData,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({
          ...prev,
          selfie: "Please select a valid image file"
        }));
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          selfie: "File size must be less than 5MB"
        }));
        return;
      }

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setFormData(prev => ({
        ...prev,
        selfieFile: file,
        selfie: previewUrl
      }));

      // Clear any previous errors
      if (errors.selfie) {
        setErrors(prev => ({
          ...prev,
          selfie: ""
        }));
      }
    }
  };

  const removeSelfie = () => {
    if (formData.selfie && formData.selfie.startsWith('blob:')) {
      URL.revokeObjectURL(formData.selfie);
    }
    setFormData(prev => ({
      ...prev,
      selfie: "",
      selfieFile: null
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          reject(new Error(`Location error: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  };

  const startCamera = async () => {
    try {
      setIsCapturing(true);
      
      // Get location first
      try {
        const location = await getCurrentLocation();
        setFormData(prev => ({
          ...prev,
          location: location
        }));
        setLocationPermission('granted');
      } catch (locationError) {
        console.warn('Could not get location:', locationError);
        setLocationPermission('denied');
      }

      // Start camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      });

      setCameraStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setStatus({ type: "error", message: "Could not access camera. Please check permissions." });
      setIsCapturing(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCapturing(false);
  };

  const captureSelfie = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
        const previewUrl = URL.createObjectURL(blob);
        
        setFormData(prev => ({
          ...prev,
          selfieFile: file,
          selfie: previewUrl
        }));

        // Clear any previous errors
        if (errors.selfie) {
          setErrors(prev => ({
            ...prev,
            selfie: ""
          }));
        }

        // Stop camera after capture
        stopCamera();
      }
    }, 'image/jpeg', 0.8);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate channel partner data
    if (!formData.channelPartnerData.name.trim()) {
      newErrors['channelPartnerData.name'] = "Partner name is required";
    }

    if (!formData.channelPartnerData.phone.trim()) {
      newErrors['channelPartnerData.phone'] = "Phone number is required";
    } else if (!/^[0-9]{10}$/.test(formData.channelPartnerData.phone.replace(/\D/g, ""))) {
      newErrors['channelPartnerData.phone'] = "Please enter a valid 10-digit phone number";
    }

    if (!formData.channelPartnerData.firmName.trim()) {
      newErrors['channelPartnerData.firmName'] = "Firm name is required";
    }

    if (!formData.channelPartnerData.location.trim()) {
      newErrors['channelPartnerData.location'] = "Location is required";
    }

    if (!formData.channelPartnerData.address.trim()) {
      newErrors['channelPartnerData.address'] = "Address is required";
    }

    // MAHARERA is now optional - no validation needed

    if (!formData.channelPartnerData.pinCode.trim()) {
      newErrors['channelPartnerData.pinCode'] = "PIN code is required";
    } else if (!/^[0-9]{6}$/.test(formData.channelPartnerData.pinCode)) {
      newErrors['channelPartnerData.pinCode'] = "Please enter a valid 6-digit PIN code";
    }

    // Validate other fields
    if (!formData.projectId) {
      newErrors.projectId = "Project selection is required";
    }

    // Location validation - must be captured with selfie
    if (formData.location.lat === 0 && formData.location.lng === 0) {
      newErrors.selfie = "Please capture a selfie to automatically get location coordinates";
    }

    if (!formData.selfieFile) {
      newErrors.selfie = "Selfie is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);
    setStatus({ type: "idle" });

    try {
      if (!token) {
        throw new Error("No token found. Please sign in first.");
      }

      // Prepare form data for API
      const submitData = new FormData();
      
      // Add channel partner data
      submitData.append('channelPartnerData[name]', formData.channelPartnerData.name.trim());
      submitData.append('channelPartnerData[phone]', formData.channelPartnerData.phone.trim());
      submitData.append('channelPartnerData[firmName]', formData.channelPartnerData.firmName.trim());
      submitData.append('channelPartnerData[location]', formData.channelPartnerData.location.trim());
      submitData.append('channelPartnerData[address]', formData.channelPartnerData.address.trim());
      submitData.append('channelPartnerData[mahareraNo]', formData.channelPartnerData.mahareraNo.trim());
      submitData.append('channelPartnerData[pinCode]', formData.channelPartnerData.pinCode.trim());
      
      // Add other data
      submitData.append('projectId', formData.projectId);
      submitData.append('location[lat]', formData.location.lat.toString());
      submitData.append('location[lng]', formData.location.lng.toString());
      
      // Add selfie file (required)
      if (formData.selfieFile) {
        submitData.append('selfie', formData.selfieFile!);
      }

      const response = await fetch(API_ENDPOINTS.CREATE_CP_SOURCING, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: submitData,
        credentials: "include",
        mode: "cors",
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody?.message || `Request failed with ${response.status}`);
      }

      const data = await response.json().catch(() => null);
      setStatus({ type: "success", message: "CP sourcing record created successfully!" });
      
      // Reset form after success
      if (formData.selfie && formData.selfie.startsWith('blob:')) {
        URL.revokeObjectURL(formData.selfie);
      }
      setFormData({
        channelPartnerData: {
          name: "",
          phone: "",
          firmName: "",
          location: "",
          address: "",
          mahareraNo: "",
          pinCode: "",
        },
        projectId: "",
        location: { lat: 0, lng: 0 },
        selfie: "",
        selfieFile: null,
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Redirect after a short delay
      setTimeout(() => {
        router.push("/apps/cp-sourcing");
      }, 2000);

    } catch (err: any) {
      setStatus({ type: "error", message: err?.message || "Something went wrong." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          color="gray"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <Icon icon="lucide:arrow-left" className="w-4 h-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add CP Sourcing</h1>
          <p className="text-gray-600">Create a new channel partner sourcing record</p>
        </div>
      </div>

      <Card className="max-w-6xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          {status.type === "success" && (
            <Alert color="success" className="mb-4">
              <Icon icon="lucide:check-circle" className="w-4 h-4" />
              <span className="ml-2">{status.message}</span>
            </Alert>
          )}

          {status.type === "error" && (
            <Alert color="failure" className="mb-4">
              <Icon icon="lucide:alert-circle" className="w-4 h-4" />
              <span className="ml-2">{status.message}</span>
            </Alert>
          )}

          {/* Channel Partner Information Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Channel Partner Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <Label htmlFor="channelPartnerData.name" value="Partner Name *" />
                <TextInput
                  id="channelPartnerData.name"
                  name="channelPartnerData.name"
                  type="text"
                  placeholder="Enter partner name"
                  value={formData.channelPartnerData.name}
                  onChange={handleChange}
                  color={errors['channelPartnerData.name'] ? "failure" : "gray"}
                  helperText={errors['channelPartnerData.name']}
                />
              </div>

              {/* Phone */}
              <div>
                <Label htmlFor="channelPartnerData.phone" value="Phone Number *" />
                <TextInput
                  id="channelPartnerData.phone"
                  name="channelPartnerData.phone"
                  type="tel"
                  placeholder="Enter 10-digit phone number"
                  value={formData.channelPartnerData.phone}
                  onChange={handleChange}
                  color={errors['channelPartnerData.phone'] ? "failure" : "gray"}
                  helperText={errors['channelPartnerData.phone']}
                />
              </div>

              {/* Firm Name */}
              <div>
                <Label htmlFor="channelPartnerData.firmName" value="Firm Name *" />
                <TextInput
                  id="channelPartnerData.firmName"
                  name="channelPartnerData.firmName"
                  type="text"
                  placeholder="Enter firm/company name"
                  value={formData.channelPartnerData.firmName}
                  onChange={handleChange}
                  color={errors['channelPartnerData.firmName'] ? "failure" : "gray"}
                  helperText={errors['channelPartnerData.firmName']}
                />
              </div>

              {/* Location */}
              <div>
                <Label htmlFor="channelPartnerData.location" value="Location *" />
                <TextInput
                  id="channelPartnerData.location"
                  name="channelPartnerData.location"
                  type="text"
                  placeholder="Enter city/location"
                  value={formData.channelPartnerData.location}
                  onChange={handleChange}
                  color={errors['channelPartnerData.location'] ? "failure" : "gray"}
                  helperText={errors['channelPartnerData.location']}
                />
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <Label htmlFor="channelPartnerData.address" value="Address *" />
                <TextInput
                  id="channelPartnerData.address"
                  name="channelPartnerData.address"
                  type="text"
                  placeholder="Enter complete address"
                  value={formData.channelPartnerData.address}
                  onChange={handleChange}
                  color={errors['channelPartnerData.address'] ? "failure" : "gray"}
                  helperText={errors['channelPartnerData.address']}
                />
              </div>

              {/* MAHARERA Number */}
              <div>
                <Label htmlFor="channelPartnerData.mahareraNo" value="MAHARERA Number (Optional)" />
                <TextInput
                  id="channelPartnerData.mahareraNo"
                  name="channelPartnerData.mahareraNo"
                  type="text"
                  placeholder="Enter MAHARERA registration number (optional)"
                  value={formData.channelPartnerData.mahareraNo}
                  onChange={handleChange}
                  color={errors['channelPartnerData.mahareraNo'] ? "failure" : "gray"}
                  helperText={errors['channelPartnerData.mahareraNo'] || "Optional field"}
                />
              </div>

              {/* PIN Code */}
              <div>
                <Label htmlFor="channelPartnerData.pinCode" value="PIN Code *" />
                <TextInput
                  id="channelPartnerData.pinCode"
                  name="channelPartnerData.pinCode"
                  type="text"
                  placeholder="Enter 6-digit PIN code"
                  value={formData.channelPartnerData.pinCode}
                  onChange={handleChange}
                  color={errors['channelPartnerData.pinCode'] ? "failure" : "gray"}
                  helperText={errors['channelPartnerData.pinCode']}
                />
              </div>
            </div>
          </div>

          {/* Project and Location Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Project & Location</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Project Selection */}
              <div>
                <Label htmlFor="projectId" value="Project *" />
                <Select
                  id="projectId"
                  name="projectId"
                  value={formData.projectId}
                  onChange={handleChange}
                  color={errors.projectId ? "failure" : "gray"}
                  helperText={errors.projectId}
                  disabled={isLoadingProjects}
                >
                  <option value="">Select a project</option>
                  {projects.map((project) => (
                    <option key={project._id} value={project._id}>
                      {project.name}
                    </option>
                  ))}
                </Select>
                {isLoadingProjects && (
                  <p className="text-sm text-gray-500 mt-1">Loading projects...</p>
                )}
              </div>

              {/* Location Status */}
              <div className="space-y-4">
                <Label value="Location Status" />
                <div className="p-4 bg-gray-50 rounded-lg">
                  {locationPermission === 'granted' && formData.location.lat !== 0 ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <Icon icon="lucide:check-circle" className="w-5 h-5" />
                      <div>
                        <p className="font-medium">Location Captured</p>
                        <p className="text-sm">
                          {formData.location.lat.toFixed(4)}, {formData.location.lng.toFixed(4)}
                        </p>
                      </div>
                    </div>
                  ) : locationPermission === 'denied' ? (
                    <div className="flex items-center gap-2 text-yellow-600">
                      <Icon icon="lucide:alert-triangle" className="w-5 h-5" />
                      <div>
                        <p className="font-medium">Location Access Denied</p>
                        <p className="text-sm">Please enable location access to capture coordinates</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Icon icon="lucide:map-pin" className="w-5 h-5" />
                      <div>
                        <p className="font-medium">Location Not Captured</p>
                        <p className="text-sm">Location will be captured when you take a selfie</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Selfie Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Selfie Capture</h3>
            <div className="max-w-2xl">
              <Label htmlFor="selfie" value="Selfie *" />
              <div className="space-y-4">
                {isCapturing ? (
                  <div className="space-y-4">
                    <div className="relative bg-black rounded-lg overflow-hidden">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-64 object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                          <Icon icon="lucide:camera" className="w-8 h-8 text-white" />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-center">
                      <Button
                        color="orange"
                        onClick={captureSelfie}
                        className="flex items-center gap-2"
                      >
                        <Icon icon="lucide:camera" className="w-4 h-4" />
                        Capture Selfie
                      </Button>
                      <Button
                        color="gray"
                        onClick={stopCamera}
                        className="flex items-center gap-2"
                      >
                        <Icon icon="lucide:x" className="w-4 h-4" />
                        Cancel
                      </Button>
                    </div>
                    {locationPermission === 'granted' && (
                      <div className="flex items-center gap-2 text-green-600 text-sm">
                        <Icon icon="lucide:map-pin" className="w-4 h-4" />
                        Location captured: {formData.location.lat.toFixed(4)}, {formData.location.lng.toFixed(4)}
                      </div>
                    )}
                    {locationPermission === 'denied' && (
                      <div className="flex items-center gap-2 text-yellow-600 text-sm">
                        <Icon icon="lucide:alert-triangle" className="w-4 h-4" />
                        Location access denied. Please enter coordinates manually.
                      </div>
                    )}
                  </div>
                ) : formData.selfie ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img
                          src={formData.selfie}
                          alt="Selfie preview"
                          className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">
                          {formData.selfieFile ? formData.selfieFile.name : "Selfie captured"}
                        </p>
                        {locationPermission === 'granted' && (
                          <p className="text-xs text-green-600 mt-1">
                            Location: {formData.location.lat.toFixed(4)}, {formData.location.lng.toFixed(4)}
                          </p>
                        )}
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            color="orange"
                            onClick={startCamera}
                            className="flex items-center gap-1"
                          >
                            <Icon icon="lucide:camera" className="w-3 h-3" />
                            Retake
                          </Button>
                          <Button
                            size="sm"
                            color="failure"
                            onClick={removeSelfie}
                            className="flex items-center gap-1"
                          >
                            <Icon icon="lucide:trash-2" className="w-3 h-3" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex w-full items-center justify-center">
                      <div className="flex flex-col items-center space-y-4">
                        <Button
                          color="orange"
                          onClick={startCamera}
                          className="flex items-center gap-2 px-8 py-4"
                        >
                          <Icon icon="lucide:camera" className="w-6 h-6" />
                          Capture Selfie with Camera
                        </Button>
                        <div className="text-center">
                          <p className="text-sm text-gray-600 mb-2">Or upload from device:</p>
                          <Label
                            htmlFor="selfie-upload"
                            className="flex h-24 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100"
                          >
                            <div className="flex flex-col items-center justify-center">
                              <Icon
                                icon="lucide:upload"
                                className="w-6 h-6 text-gray-400 mb-1"
                              />
                              <p className="text-xs text-gray-500">
                                Upload from device
                              </p>
                            </div>
                            <FileInput
                              id="selfie-upload"
                              ref={fileInputRef}
                              onChange={handleFileChange}
                              accept="image/*"
                              className="hidden"
                            />
                          </Label>
                        </div>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">
                        Camera will automatically capture your location coordinates
                      </p>
                    </div>
                  </div>
                )}
                {errors.selfie && (
                  <p className="text-sm text-red-600">{errors.selfie}</p>
                )}
                {!formData.selfie && !errors.selfie && !isCapturing && (
                  <p className="text-xs text-gray-500">
                    Selfie is required for identification purposes
                  </p>
                )}
              </div>
            </div>
            
            {/* Hidden canvas for image capture */}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t">
            <Button
              type="button"
              color="gray"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              color="orange"
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Icon icon="lucide:plus" className="w-4 h-4" />
                  Create CP Sourcing
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default AddCPSourcingPage;
