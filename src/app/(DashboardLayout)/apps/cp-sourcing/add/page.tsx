"use client";
import React, { useState, useEffect, useRef } from "react";
import { Button, Card, Label, TextInput, Alert, Select, Textarea } from "flowbite-react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { API_ENDPOINTS } from "@/lib/config";
import LocationCapture from "@/components/LocationCapture";
import LocationMap from "@/components/LocationMap";
import { LocationData, getCurrentLocation, reverseGeocode } from "@/utils/locationUtils";

// Define LocalLocationData interface with only coordinates
interface LocalLocationData {
  lat: number;
  lng: number;
}

interface ChannelPartnerData {
  name: string;
  phone: string;
  firmName: string;
  location: string;
  address: string;
  mahareraNo: string;
  pinCode: string;
}

// Use LocationData from utils instead of defining our own
type Location = LocationData;

interface FormData {
  // Channel Partner Data
  channelPartnerData: ChannelPartnerData;
  // Project and Location
  projectId: string;
  location: LocalLocationData;
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

// Helper function to convert LocationData to LocalLocationData
const convertToLocalLocationData = (location: LocationData): LocalLocationData => {
  return {
    lat: location.lat,
    lng: location.lng
  };
};

// Helper functions for location display
const getDetailedLocationString = (location: LocalLocationData): string => {
  return `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
};

const getShortLocationString = (location: LocalLocationData): string => {
  return `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
};

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
  const [isCheckingCPPhone, setIsCheckingCPPhone] = useState(false);
  const [cpAutoFilled, setCpAutoFilled] = useState(false);
  const phoneLookupCacheRef = useRef<Record<string, any>>({});
  const phoneDebounceRef = useRef<any>(null);
  const phoneAbortRef = useRef<AbortController | null>(null);

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
    location: { 
      lat: 0, 
      lng: 0
    },
    selfie: "",
    selfieFile: null,
  });

  const [capturedLocation, setCapturedLocation] = useState<LocalLocationData | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

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

      // If phone changes, allow editing other fields again
      if (field === 'phone') {
        setCpAutoFilled(false);
      }
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

  const lookupCPByPhone = async (digits: string) => {
    if (!token) return;
    // Cache hit
    const cached = phoneLookupCacheRef.current[digits];
    if (cached) {
      applyCPMatch(cached);
      return;
    }

    if (phoneAbortRef.current) {
      phoneAbortRef.current.abort();
    }
    const controller = new AbortController();
    phoneAbortRef.current = controller;

    setIsCheckingCPPhone(true);
    try {
      const resp = await fetch(`${API_ENDPOINTS.CHANNEL_PARTNERS}?phone=${encodeURIComponent(digits)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        signal: controller.signal,
      });
      if (!resp.ok) {
        setCpAutoFilled(false);
        return;
      }
      const data = await resp.json().catch(() => ({}));
      const list = data.channelPartners || data || [];
      const match = Array.isArray(list) ? list.find((p: any) => (p?.phone || '').replace(/\D/g, '') === digits) : null;
      if (match) {
        phoneLookupCacheRef.current[digits] = match;
        applyCPMatch(match);
      } else {
        setCpAutoFilled(false);
      }
    } catch (e) {
      // ignore aborted/other errors
    } finally {
      setIsCheckingCPPhone(false);
    }
  };

  const applyCPMatch = (match: any) => {
    setFormData(prev => ({
      ...prev,
      channelPartnerData: {
        ...prev.channelPartnerData,
        name: match.name || prev.channelPartnerData.name,
        firmName: match.firmName || prev.channelPartnerData.firmName,
        location: match.location || prev.channelPartnerData.location,
        address: match.address || prev.channelPartnerData.address,
        mahareraNo: match.mahareraNo || prev.channelPartnerData.mahareraNo,
        pinCode: match.pinCode || prev.channelPartnerData.pinCode,
        phone: match.phone || prev.channelPartnerData.phone,
      }
    }));
    setCpAutoFilled(true);
  };

  const handleLocationCaptured = (location: LocationData) => {
    const localLocation = convertToLocalLocationData(location);
    setCapturedLocation(localLocation);
    setLocationError(null);
    
    // Update form data with captured location
    setFormData(prev => ({
      ...prev,
      location: localLocation
    }));
  };

  const handleLocationError = (error: any) => {
    setLocationError(error.message);
    setCapturedLocation(null);
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
  };


  const startCamera = async () => {
    try {
      setIsCapturing(true);
      
      // Automatically capture detailed location when opening camera
      try {
        console.log('Capturing detailed location automatically...');
        const location = await getCurrentLocation();
        
        // Convert to local location data
        const localLocation = convertToLocalLocationData(location);
        
        // Update form data with enhanced location
        setFormData(prev => ({
          ...prev,
          location: localLocation
        }));
        
        // Update captured location state
        setCapturedLocation(localLocation);
        setLocationError(null);
        setLocationPermission('granted');
        
        console.log('Detailed location captured successfully:', location);
      } catch (locationError: any) {
        console.warn('Could not get detailed location:', locationError);
        setLocationError(locationError.message || 'Failed to capture detailed location');
        setLocationPermission('denied');
        setCapturedLocation(null);
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

    // Location validation - must be captured
    if (!capturedLocation || (formData.location.lat === 0 && formData.location.lng === 0)) {
      newErrors.location = "Please capture your location before submitting";
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
      
      // Add location data (coordinates only)
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
        location: { 
          lat: 0, 
          lng: 0
        },
        selfie: "",
        selfieFile: null,
      });

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


              
              {/* Phone */}
              <div>
                <Label htmlFor="channelPartnerData.phone" value="Phone Number *" />
                <TextInput
                  id="channelPartnerData.phone"
                  name="channelPartnerData.phone"
                  type="tel"
                  placeholder="Enter 10-digit phone number"
                  value={formData.channelPartnerData.phone}
                  onChange={(e) => {
                    handleChange(e);
                    const digits = e.target.value.replace(/\D/g, "");
                    // Debounce lookup while typing for faster perceived response
                    if (phoneDebounceRef.current) clearTimeout(phoneDebounceRef.current);
                    if (digits.length === 10) {
                      phoneDebounceRef.current = setTimeout(() => lookupCPByPhone(digits), 200);
                    }
                  }}
                  onBlur={() => {
                    const digits = formData.channelPartnerData.phone.replace(/\D/g, "");
                    if (digits.length === 10) lookupCPByPhone(digits);
                  }}
                  color={errors['channelPartnerData.phone'] ? "failure" : "gray"}
                  helperText={errors['channelPartnerData.phone']}
                />
                {isCheckingCPPhone && (
                  <p className="text-xs text-gray-500 mt-1">Checking channel partners…</p>
                )}
                {cpAutoFilled && !isCheckingCPPhone && (
                  <p className="text-xs text-blue-600 mt-1">Existing channel partner found. Details auto-filled.</p>
                )}
              </div>
              
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
                  disabled={cpAutoFilled}
                  color={errors['channelPartnerData.name'] ? "failure" : "gray"}
                  helperText={errors['channelPartnerData.name']}
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
                  disabled={cpAutoFilled}
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
                  disabled={cpAutoFilled}
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
                  disabled={cpAutoFilled}
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
                  disabled={cpAutoFilled}
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
                  disabled={cpAutoFilled}
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

              {/* Location Capture */}
              <div className="space-y-4">
                <Label value="Location Capture *" />
                <LocationCapture
                  onLocationCaptured={handleLocationCaptured}
                  onLocationError={handleLocationError}
                  initialLocation={capturedLocation}
                  showMap={true}
                  className="w-full"
                />
                {locationError && (
                  <Alert color="failure" className="mt-2">
                    <Icon icon="lucide:alert-circle" className="w-4 h-4" />
                    <span className="ml-2">{locationError}</span>
                  </Alert>
                )}
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
                    {/* Location Capture Status */}
                    {capturedLocation ? (
                      <div className="space-y-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-green-800">
                            <Icon icon="lucide:check-circle" className="w-5 h-5" />
                            <span className="font-medium">Detailed Location Captured Successfully</span>
                          </div>
                          <p className="text-sm text-green-700 mt-1">
                            {getDetailedLocationString(capturedLocation)}
                          </p>
                        </div>
                        
                        {/* Location Information */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-blue-800 mb-3 flex items-center gap-2">
                            <Icon icon="lucide:map-pin" className="w-4 h-4" />
                            Location Coordinates
                          </h4>
                          <div className="text-xs">
                            <div><span className="font-medium text-blue-700">Coordinates:</span> {capturedLocation.lat.toFixed(4)}, {capturedLocation.lng.toFixed(4)}</div>
                          </div>
                        </div>
                        
                        {/* Interactive Map */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <Icon icon="lucide:map" className="w-4 h-4" />
                            Location Map
                          </h4>
                          <LocationMap
                            location={capturedLocation}
                            height="200px"
                            width="100%"
                            showPopup={true}
                            popupContent={getDetailedLocationString(capturedLocation)}
                            className="rounded-lg"
                          />
                        </div>
                      </div>
                    ) : locationError ? (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-red-800">
                          <Icon icon="lucide:alert-circle" className="w-5 h-5" />
                          <span className="font-medium">Location Capture Failed</span>
                        </div>
                        <p className="text-sm text-red-700 mt-1">{locationError}</p>
                      </div>
                    ) : (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-blue-800">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span className="font-medium">Capturing Detailed Location...</span>
                        </div>
                        <p className="text-sm text-blue-700 mt-1">Getting precise coordinates, address details, and reverse geocoding information...</p>
                        <div className="mt-2 text-xs text-blue-600">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                            <span>Getting GPS coordinates</span>
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                            <span>Reverse geocoding address</span>
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                            <span>Extracting building and landmark details</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
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
                          Capture Selfie with Detailed Location
                        </Button>
                        <div className="text-center">
                          <p className="text-sm text-blue-600 mb-2 flex items-center justify-center gap-1">
                            <Icon icon="lucide:map-pin" className="w-4 h-4" />
                            Detailed location will be captured automatically
                          </p>
                          <p className="text-xs text-gray-600 mb-2">
                            Including building names, streets, landmarks, and exact address
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500">
                        Camera will automatically capture detailed location including building names, streets, landmarks, and exact address
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
