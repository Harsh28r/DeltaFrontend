"use client";
import React, { useState, useEffect } from "react";
import { Button, Card, Badge, Alert, Modal, Table } from "flowbite-react";
import { Icon } from "@iconify/react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/config";

interface User {
  _id: string;
  name: string;
  email: string;
}

interface Lead {
  _id: string;
  user: User;
  project: string | { _id: string; name: string };
  channelPartner: string;
  leadSource: string;
  currentStatus: string;
  customData: {
    "First Name"?: string;
    "Last Name"?: string;
    Email?: string;
    Phone?: string;
    Notes?: string;
    "Lead Priority"?: string;
    "Property Type"?: string;
    Configuration?: string;
    "Funding Mode"?: string;
    Gender?: string;
    Budget?: string;
    Remark?: string;
    "Channel Partner"?: string;
    // Lowercase versions (from bulk upload)
    name?: string;
    email?: string;
    phone?: string;
    contact?: string;
    leadPriority?: string;
    propertyType?: string;
    configuration?: string;
    fundingMode?: string;
    gender?: string;
    budget?: string;
    [key: string]: any; // Allow any additional properties
  };
  cpSourcingId: {
    _id: string;
    projectId: string;
  };
  statusHistory: any[];
  createdAt: string;
  updatedAt: string;
}

interface Project {
  _id: string;
  name: string;
}

interface ChannelPartner {
  _id: string;
  name: string;
  phone: string;
  firmName: string;
  location: string;
  address: string;
  mahareraNo: string;
  pinCode: string;
  photo?: string;
  isActive: boolean;
  createdBy: User;
  updatedBy: User;
  createdAt: string;
  updatedAt: string;
  leads?: Lead[];
}

const ChannelPartnerDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const { token } = useAuth();
  const partnerId = params.id as string;

  const [partner, setPartner] = useState<ChannelPartner | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Filters and export
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    if (token && partnerId) {
      fetchPartnerDetails();
      fetchProjects();
    }
  }, [token, partnerId]);

  const fetchProjects = async () => {
    try {
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
      }
    } catch (err: any) {
      console.error("Error fetching projects:", err);
      // Don't set error state as this is not critical
    }
  };

  const fetchPartnerDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `${API_ENDPOINTS.CHANNEL_PARTNER_BY_ID(partnerId)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Channel Partner not found");
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `Failed to fetch channel partner details: ${response.status}`
        );
      }

      const data = await response.json();
      // Adjust for API response structure: merge channelPartner and leads
      setPartner({
        ...data.channelPartner,
        leads: data.leads,
      });
    } catch (err: any) {
      console.error("Error fetching channel partner details:", err);
      setError(err.message || "Failed to fetch channel partner details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!partner) return;

    try {
      setIsDeleting(true);
      const response = await fetch(
        API_ENDPOINTS.DELETE_CHANNEL_PARTNER(partner._id),
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Failed to delete channel partner: ${response.status}`
        );
      }

      router.push("/apps/channel-partners");
    } catch (err: any) {
      console.error("Error deleting channel partner:", err);
      setError(err.message || "Failed to delete channel partner");
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  const getProjectName = (projectId: string | { _id: string; name: string }) => {
    if (typeof projectId === 'object' && projectId?.name) {
      return projectId.name;
    }
    
    if (typeof projectId === 'string') {
      const project = projects.find(p => p._id === projectId);
      return project?.name || 'Unknown Project';
    }
    
    return 'N/A';
  };

  // Filter leads
  const getFilteredLeads = () => {
    if (!partner?.leads) return [];
    
    return partner.leads.filter((lead) => {
      const firstName = lead.customData?.["First Name"] || lead.customData?.name?.split(' ')[0] || '';
      const lastName = lead.customData?.["Last Name"] || lead.customData?.name?.split(' ').slice(1).join(' ') || '';
      const fullName = `${firstName} ${lastName}`.trim() || lead.customData?.name || '';
      const email = lead.customData?.Email || lead.customData?.email || '';
      const phone = lead.customData?.Phone || lead.customData?.phone || lead.customData?.contact || '';
      const propertyType = lead.customData?.["Property Type"] || lead.customData?.propertyType || '';
      const priority = lead.customData?.["Lead Priority"] || lead.customData?.leadPriority || '';

      // Search filter
      const matchesSearch = !searchQuery.trim() || 
        fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        phone.includes(searchQuery);

      // Priority filter
      const matchesPriority = !priorityFilter || priority === priorityFilter;

      // Property type filter
      const matchesPropertyType = !propertyTypeFilter || propertyType === propertyTypeFilter;

      return matchesSearch && matchesPriority && matchesPropertyType;
    });
  };

  // Export to CSV
  const handleExportToCSV = () => {
    const filteredLeads = getFilteredLeads();
    
    const headers = [
      'Name',
      'Email',
      'Phone',
      'Project',
      'Property Type',
      'Budget',
      'Priority',
      'Created At'
    ];

    const rows = filteredLeads.map(lead => {
      const firstName = lead.customData?.["First Name"] || lead.customData?.name?.split(' ')[0] || '';
      const lastName = lead.customData?.["Last Name"] || lead.customData?.name?.split(' ').slice(1).join(' ') || '';
      const fullName = `${firstName} ${lastName}`.trim() || lead.customData?.name || 'N/A';
      
      return [
        fullName,
        lead.customData?.Email || lead.customData?.email || 'N/A',
        lead.customData?.Phone || lead.customData?.phone || lead.customData?.contact || 'N/A',
        getProjectName(lead.project),
        lead.customData?.["Property Type"] || lead.customData?.propertyType || 'N/A',
        lead.customData?.Budget || lead.customData?.budget || 'N/A',
        lead.customData?.["Lead Priority"] || lead.customData?.leadPriority || 'N/A',
        new Date(lead.createdAt).toLocaleDateString('en-US', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${partner?.name}_leads_bucket_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    setShowExportMenu(false);
  };

  // Export to PDF
  const handleExportToPDF = () => {
    const filteredLeads = getFilteredLeads();
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${partner?.name} - Leads Bucket</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; border-bottom: 2px solid #f97316; padding-bottom: 10px; }
          .meta { color: #666; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #f97316; color: white; padding: 12px; text-align: left; }
          td { padding: 10px; border-bottom: 1px solid #ddd; }
          tr:hover { background-color: #f5f5f5; }
          .badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
          .badge-hot { background-color: #fecaca; color: #991b1b; }
          .badge-warm { background-color: #fed7aa; color: #9a3412; }
          .badge-cold { background-color: #bfdbfe; color: #1e3a8a; }
        </style>
      </head>
      <body>
        <h1>${partner?.name} - Leads Bucket</h1>
        <div class="meta">
          <p><strong>Channel Partner:</strong> ${partner?.name}</p>
          <p><strong>Firm:</strong> ${partner?.firmName}</p>
          <p><strong>Phone:</strong> ${partner?.phone}</p>
          <p><strong>Total Leads:</strong> ${filteredLeads.length}</p>
          <p><strong>Export Date:</strong> ${new Date().toLocaleString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Project</th>
              <th>Property Type</th>
              <th>Budget</th>
              <th>Priority</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            ${filteredLeads.map(lead => {
              const firstName = lead.customData?.["First Name"] || lead.customData?.name?.split(' ')[0] || '';
              const lastName = lead.customData?.["Last Name"] || lead.customData?.name?.split(' ').slice(1).join(' ') || '';
              const fullName = `${firstName} ${lastName}`.trim() || lead.customData?.name || 'N/A';
              const priority = lead.customData?.["Lead Priority"] || lead.customData?.leadPriority || 'N/A';
              
              return `
                <tr>
                  <td>${fullName}</td>
                  <td>${lead.customData?.Email || lead.customData?.email || 'N/A'}</td>
                  <td>${lead.customData?.Phone || lead.customData?.phone || lead.customData?.contact || 'N/A'}</td>
                  <td>${getProjectName(lead.project)}</td>
                  <td>${lead.customData?.["Property Type"] || lead.customData?.propertyType || 'N/A'}</td>
                  <td>${lead.customData?.Budget || lead.customData?.budget || 'N/A'}</td>
                  <td><span class="badge badge-${priority.toLowerCase()}">${priority}</span></td>
                  <td>${new Date(lead.createdAt).toLocaleDateString('en-US', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');
    
    if (printWindow) {
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 250);
      };
    }
    
    setShowExportMenu(false);
  };

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showExportMenu && !target.closest('.export-menu-container')) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExportMenu]);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert color="failure" className="mb-4">
          <Icon icon="lucide:alert-circle" className="w-4 h-4" />
          <span className="ml-2">{error}</span>
        </Alert>
        <Button color="gray" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="p-6">
        <Alert color="failure" className="mb-4">
          <Icon icon="lucide:alert-circle" className="w-4 h-4" />
          <span className="ml-2">Channel partner not found</span>
        </Alert>
        <Button color="gray" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
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
            <h1 className="text-2xl font-bold text-gray-900">
              Channel Partner Details
            </h1>
            <p className="text-gray-600">{partner.name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            color="orange"
            onClick={() => router.push(`/apps/channel-partners/edit/${partner._id}`)}
            className="flex items-center gap-2"
          >
            <Icon icon="lucide:edit" className="w-4 h-4" />
            Edit
          </Button>
          <Button
            color="failure"
            onClick={handleDelete}
            className="flex items-center gap-2"
          >
            <Icon icon="lucide:trash-2" className="w-4 h-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Icon icon="lucide:user" className="w-6 h-6 text-orange-500" />
              <h2 className="text-xl font-semibold text-gray-900">
                Partner Information
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Name</label>
                <p className="text-gray-900">{partner.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Phone</label>
                <p className="text-gray-900">{partner.phone}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Firm Name
                </label>
                <p className="text-gray-900">{partner.firmName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Location
                </label>
                <p className="text-gray-900">{partner.location}</p>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-500">
                  Address
                </label>
                <p className="text-gray-900">{partner.address}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  MAHARERA Number
                </label>
                <p className="text-gray-900">{partner.mahareraNo}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  PIN Code
                </label>
                <p className="text-gray-900">{partner.pinCode}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Status
                </label>
                <Badge color={partner.isActive ? "success" : "failure"}>
                  {partner.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </Card>

          {/* Leads Bucket Statistics */}
          {partner.leads && partner.leads.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 dark:text-blue-300">Total Leads</p>
                    <p className="text-3xl font-bold text-blue-900 dark:text-white">
                      {partner.leads?.length || 0}
                    </p>
                  </div>
                  <Icon icon="lucide:users" className="w-10 h-10 text-blue-600 dark:text-blue-300" />
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900 dark:to-red-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-600 dark:text-red-300">Hot Leads</p>
                    <p className="text-3xl font-bold text-red-900 dark:text-white">
                      {partner.leads?.filter(l => 
                        (l.customData?.["Lead Priority"] || l.customData?.leadPriority) === "Hot"
                      ).length || 0}
                    </p>
                  </div>
                  <Icon icon="lucide:flame" className="w-10 h-10 text-red-600 dark:text-red-300" />
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-600 dark:text-orange-300">Warm Leads</p>
                    <p className="text-3xl font-bold text-orange-900 dark:text-white">
                      {partner.leads?.filter(l => 
                        (l.customData?.["Lead Priority"] || l.customData?.leadPriority) === "Warm"
                      ).length || 0}
                    </p>
                  </div>
                  <Icon icon="lucide:thermometer" className="w-10 h-10 text-orange-600 dark:text-orange-300" />
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900 dark:to-cyan-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-cyan-600 dark:text-cyan-300">Cold Leads</p>
                    <p className="text-3xl font-bold text-cyan-900 dark:text-white">
                      {partner.leads?.filter(l => 
                        (l.customData?.["Lead Priority"] || l.customData?.leadPriority) === "Cold"
                      ).length || 0}
                    </p>
                  </div>
                  <Icon icon="lucide:snowflake" className="w-10 h-10 text-cyan-600 dark:text-cyan-300" />
                </div>
              </Card>
            </div>
          )}

          <Card className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Icon
                  icon="lucide:users"
                  className="w-6 h-6 text-orange-500"
                />
                <h2 className="text-xl font-semibold text-gray-900">
                  Leads in {partner.name}'s Bucket
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <Badge color="blue" size="lg">
                  {getFilteredLeads().length} / {partner.leads?.length || 0} leads
                </Badge>
                
                {/* Export Button with Dropdown */}
                {partner.leads && partner.leads.length > 0 && (
                  <div className="relative export-menu-container">
                    <Button
                      color="success"
                      size="sm"
                      onClick={() => setShowExportMenu(!showExportMenu)}
                    >
                      <Icon icon="lucide:download" className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                    
                    {showExportMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                        <div className="py-1">
                          <button
                            onClick={handleExportToCSV}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                          >
                            <Icon icon="lucide:file-spreadsheet" className="w-4 h-4 mr-2 text-green-600" />
                            Export as CSV
                          </button>
                          <button
                            onClick={handleExportToPDF}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                          >
                            <Icon icon="lucide:file-text" className="w-4 h-4 mr-2 text-red-600" />
                            Export as PDF
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Filters Section */}
            {partner.leads && partner.leads.length > 0 && (
              <div className="mb-4 p-4 bg-gradient-to-r from-gray-50 to-orange-50 dark:from-gray-800 dark:to-orange-900/20 rounded-lg border-2 border-orange-200 dark:border-orange-700">
                <div className="flex items-center gap-2 mb-4">
                  <Icon icon="lucide:filter" className="w-5 h-5 text-orange-600" />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Filter Leads</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Search */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Search
                    </label>
                    <div className="relative">
                      <Icon icon="lucide:search" className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search by name, email, phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Priority Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Priority
                    </label>
                    <select
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">All Priorities</option>
                      <option value="Hot">Hot</option>
                      <option value="Warm">Warm</option>
                      <option value="Cold">Cold</option>
                    </select>
                  </div>

                  {/* Property Type Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Property Type
                    </label>
                    <select
                      value={propertyTypeFilter}
                      onChange={(e) => setPropertyTypeFilter(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">All Property Types</option>
                      <option value="Residential">Residential</option>
                      <option value="Commercial">Commercial</option>
                    </select>
                  </div>
                </div>

                {/* Clear Filters */}
                {(searchQuery || priorityFilter || propertyTypeFilter) && (
                  <div className="mt-4 flex items-center gap-2">
                    <Button
                      size="xs"
                      color="warning"
                      onClick={() => {
                        setSearchQuery('');
                        setPriorityFilter('');
                        setPropertyTypeFilter('');
                      }}
                    >
                      <Icon icon="lucide:x" className="w-3 h-3 mr-1" />
                      Clear All Filters
                    </Button>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Showing {getFilteredLeads().length} of {partner.leads?.length || 0} leads
                    </span>
                  </div>
                )}
              </div>
            )}
            
            {partner.leads && partner.leads.length > 0 ? (
              getFilteredLeads().length === 0 ? (
                <div className="text-center py-8">
                  <Icon icon="lucide:filter-x" className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Matching Leads</h3>
                  <p className="text-gray-600">Try adjusting your filters to see more results.</p>
                  <Button
                    size="sm"
                    color="light"
                    className="mt-4"
                    onClick={() => {
                      setSearchQuery('');
                      setPriorityFilter('');
                      setPropertyTypeFilter('');
                    }}
                  >
                    Clear All Filters
                  </Button>
                </div>
              ) : (
              <div className="overflow-x-auto">
                <Table hoverable>
                  <Table.Head>
                    <Table.HeadCell>Name</Table.HeadCell>
                    <Table.HeadCell>Email</Table.HeadCell>
                    <Table.HeadCell>Phone</Table.HeadCell>
                    <Table.HeadCell>Project</Table.HeadCell>
                    <Table.HeadCell>Property Type</Table.HeadCell>
                    <Table.HeadCell>Budget</Table.HeadCell>
                    <Table.HeadCell>Priority</Table.HeadCell>
                    <Table.HeadCell>Created At</Table.HeadCell>
                    <Table.HeadCell>Actions</Table.HeadCell>
                  </Table.Head>
                  <Table.Body className="divide-y">
                    {getFilteredLeads().map((lead) => {
                      // Handle both Title Case and lowercase field names (for bulk uploads)
                      const firstName = lead.customData?.["First Name"] || lead.customData?.name?.split(' ')[0] || '';
                      const lastName = lead.customData?.["Last Name"] || lead.customData?.name?.split(' ').slice(1).join(' ') || '';
                      const fullName = `${firstName} ${lastName}`.trim() || lead.customData?.name || 'N/A';
                      const email = lead.customData?.Email || lead.customData?.email || 'N/A';
                      const phone = lead.customData?.Phone || lead.customData?.phone || lead.customData?.contact || 'N/A';
                      const propertyType = lead.customData?.["Property Type"] || lead.customData?.propertyType || 'N/A';
                      const budget = lead.customData?.Budget || lead.customData?.budget || 'N/A';
                      const priority = lead.customData?.["Lead Priority"] || lead.customData?.leadPriority || 'N/A';
                      
                      return (
                        <Table.Row key={lead._id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                          <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                            {fullName}
                          </Table.Cell>
                          <Table.Cell>{email}</Table.Cell>
                          <Table.Cell>{phone}</Table.Cell>
                          <Table.Cell>
                            <Badge color="purple" size="sm">
                              {getProjectName(lead.project)}
                            </Badge>
                          </Table.Cell>
                          <Table.Cell>{propertyType}</Table.Cell>
                          <Table.Cell>{budget}</Table.Cell>
                          <Table.Cell>
                            <Badge
                              color={
                                priority === "Hot"
                                  ? "failure"
                                  : priority === "Warm"
                                  ? "warning"
                                  : priority !== "N/A"
                                  ? "info"
                                  : "gray"
                              }
                              size="sm"
                            >
                              {priority}
                            </Badge>
                          </Table.Cell>
                          <Table.Cell>{formatDate(lead.createdAt)}</Table.Cell>
                          <Table.Cell>
                            <Button
                              size="xs"
                              color="light"
                              onClick={() => router.push(`/apps/leads/${lead._id}`)}
                            >
                              <Icon icon="lucide:eye" className="w-3 h-3 mr-1" />
                              View
                            </Button>
                          </Table.Cell>
                        </Table.Row>
                      );
                    })}
                  </Table.Body>
                </Table>
              </div>
              )
            ) : (
              <div className="text-center py-8">
                <Icon icon="lucide:users" className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Leads Yet</h3>
                <p className="text-gray-600">This channel partner doesn't have any leads in their bucket yet.</p>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          {partner.photo && (
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <Icon icon="lucide:camera" className="w-6 h-6 text-orange-500" />
                <h3 className="text-lg font-semibold text-gray-900">Photo</h3>
              </div>
              <div className="text-center">
                <img
                  src={`${API_BASE_URL}/api/channel-partner/${partner._id}/photo`}
                  alt={partner.name}
                  className="w-full h-48 object-cover rounded-lg border border-gray-300"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                  }}
                />
              </div>
            </Card>
          )}

          <Card>
            <div className="flex items-center gap-3 mb-4">
              <Icon icon="lucide:info" className="w-6 h-6 text-orange-500" />
              <h3 className="text-lg font-semibold text-gray-900">
                Record Information
              </h3>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Partner ID
                </label>
                <p className="text-gray-900 font-mono text-sm">{partner._id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Created By
                </label>
                <p className="text-gray-900 text-sm">{partner.createdBy.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Created
                </label>
                <p className="text-gray-900 text-sm">
                  {formatDate(partner.createdAt)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Updated By
                </label>
                <p className="text-gray-900 text-sm">{partner.updatedBy.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Last Updated
                </label>
                <p className="text-gray-900 text-sm">
                  {formatDate(partner.updatedAt)}
                </p>
              </div>
            </div>
          </Card>

        </div>
      </div>

      <Modal show={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
        <Modal.Header>Delete Channel Partner</Modal.Header>
        <Modal.Body>
          <div className="text-center">
            <Icon
              icon="lucide:alert-triangle"
              className="w-16 h-16 text-red-500 mx-auto mb-4"
            />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Are you sure you want to delete this channel partner?
            </h3>
            <p className="text-gray-600 mb-4">
              This action cannot be undone. This will permanently delete{" "}
              <strong>{partner.name}</strong> and all associated data.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg text-left">
              <p>
                <strong>Name:</strong> {partner.name}
              </p>
              <p>
                <strong>Firm:</strong> {partner.firmName}
              </p>
              <p>
                <strong>Phone:</strong> {partner.phone}
              </p>
              <p>
                <strong>Location:</strong> {partner.location}
              </p>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            color="gray"
            onClick={() => setDeleteModalOpen(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button color="failure" onClick={confirmDelete} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Deleting...
              </>
            ) : (
              "Delete Channel Partner"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ChannelPartnerDetailPage;