"use client";
import React, { useState, useEffect } from "react";
import { Button, Card, Table, Badge, Modal, Alert } from "flowbite-react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/config";
import { getSelfieUrl, cleanupObjectUrl } from "@/utils/cpSourcingUtils";

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
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

const ChannelPartnersPage = () => {
  const router = useRouter();
  const { token } = useAuth();
  const [channelPartners, setChannelPartners] = useState<ChannelPartner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<ChannelPartner | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Bulk upload state
  const [bulkUploadModalOpen, setBulkUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResults, setUploadResults] = useState<{
    success: number;
    failed: number;
    errors: Array<{ row: number; error: string }>;
  } | null>(null);

  // Fetch channel partners
  useEffect(() => {
    if (token) {
      fetchChannelPartners();
    }
  }, [token]);

  const fetchChannelPartners = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(API_ENDPOINTS.CHANNEL_PARTNERS, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch channel partners: ${response.status}`);
      }

      const data = await response.json();
      const partners = data.channelPartners || data || [];
      setChannelPartners(partners);
    } catch (err: any) {
      console.error("Error fetching channel partners:", err);
      setError(err.message || "Failed to fetch channel partners");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (partner: ChannelPartner) => {
    setSelectedPartner(partner);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedPartner) return;

    try {
      setIsDeleting(true);
      const response = await fetch(API_ENDPOINTS.DELETE_CHANNEL_PARTNER(selectedPartner._id), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to delete channel partner: ${response.status}`);
      }

      // Remove from local state
      setChannelPartners(prev => prev.filter(p => p._id !== selectedPartner._id));
      setDeleteModalOpen(false);
      setSelectedPartner(null);
      setError(null); // Clear any previous errors
    } catch (err: any) {
      console.error("Error deleting channel partner:", err);
      setError(err.message || "Failed to delete channel partner");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if file is CSV or Excel
      const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      if (!validTypes.includes(file.type) && !file.name.endsWith('.csv') && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        setError('Please select a valid CSV or Excel file');
        return;
      }
      
      setSelectedFile(file);
      setUploadResults(null);
      setError(null);
    }
  };

  // Handle bulk upload
  const handleBulkUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);
      setError(null);

      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch(`${API_ENDPOINTS.CHANNEL_PARTNERS}/bulk-upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to upload file: ${response.status}`);
      }

      const result = await response.json();
      
      setUploadResults({
        success: result.success || result.successCount || 0,
        failed: result.failed || result.failedCount || 0,
        errors: result.errors || []
      });

      // Refresh the channel partners list
      if (result.success > 0 || result.successCount > 0) {
        await fetchChannelPartners();
      }

      // Reset file selection after successful upload
      setSelectedFile(null);
      
    } catch (err: any) {
      console.error('Error uploading file:', err);
      setError(err.message || 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  // Download sample template
  const handleDownloadTemplate = () => {
    // Create a sample CSV template
    const headers = ['name', 'phone', 'firmName', 'location', 'address', 'mahareraNo', 'pinCode'];
    const sampleData = [
      ['John Doe', '9876543210', 'ABC Realty', 'Mumbai', '123 Main St, Mumbai', 'MH12345678', '400001'],
      ['Jane Smith', '9876543211', 'XYZ Properties', 'Delhi', '456 Park Ave, Delhi', 'DL87654321', '110001']
    ];
    
    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'channel_partners_template.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Close bulk upload modal
  const closeBulkUploadModal = () => {
    setBulkUploadModalOpen(false);
    setSelectedFile(null);
    setUploadResults(null);
    setUploadProgress(0);
    setError(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading channel partners...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Channel Partners</h1>
          <p className="text-gray-600">Manage your channel partner network</p>
        </div>
        <div className="flex gap-2">
          <Button
            color="indigo"
            onClick={() => setBulkUploadModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Icon icon="lucide:upload" className="w-4 h-4" />
            Bulk Upload
          </Button>
          <Button
            color="orange"
            onClick={() => router.push('/apps/channel-partners/add')}
            className="flex items-center gap-2"
          >
            <Icon icon="lucide:plus" className="w-4 h-4" />
            Add Channel Partner
          </Button>
        </div>
      </div>

      {error && (
        <Alert color="failure" className="mb-4">
          <Icon icon="lucide:alert-circle" className="w-4 h-4" />
          <span className="ml-2">{error}</span>
        </Alert>
      )}

      <Card>
        {channelPartners.length === 0 ? (
          <div className="text-center py-12">
            <Icon icon="lucide:users" className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Channel Partners</h3>
            <p className="text-gray-600 mb-4">Get started by adding your first channel partner.</p>
            <Button
              color="orange"
              onClick={() => router.push('/apps/channel-partners/add')}
              className="flex items-center gap-2"
            >
              <Icon icon="lucide:plus" className="w-4 h-4" />
              Add Channel Partner
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table hoverable>
              <Table.Head>
                <Table.HeadCell>Name</Table.HeadCell>
                <Table.HeadCell>Firm Name</Table.HeadCell>
                <Table.HeadCell>Phone</Table.HeadCell>
                <Table.HeadCell>Location</Table.HeadCell>
                <Table.HeadCell>MAHARERA No.</Table.HeadCell>
                <Table.HeadCell>Status</Table.HeadCell>
                <Table.HeadCell>Created</Table.HeadCell>
                <Table.HeadCell>Actions</Table.HeadCell>
              </Table.Head>
              <Table.Body className="divide-y">
                {channelPartners.map((partner) => (
                  <Table.Row key={partner._id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                    <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                      <div className="flex items-center gap-3">
                        {partner.photo ? (
                          <img
                            src={`${API_BASE_URL}/api/channel-partner/${partner._id}/photo`}
                            alt={partner.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                            <Icon icon="lucide:user" className="w-4 h-4 text-orange-600" />
                          </div>
                        )}
                        {partner.name}
                      </div>
                    </Table.Cell>
                    <Table.Cell>{partner.firmName}</Table.Cell>
                    <Table.Cell>{partner.phone}</Table.Cell>
                    <Table.Cell>{partner.location}</Table.Cell>
                    <Table.Cell>
                      <Badge color="blue" size="sm">
                        {partner.mahareraNo}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge 
                        color={partner.isActive ? 'success' : 'failure'} 
                        size="sm"
                      >
                        {partner.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>{formatDate(partner.createdAt)}</Table.Cell>
                    <Table.Cell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          color="gray"
                          onClick={() => router.push(`/apps/channel-partners/${partner._id}`)}
                          title="View Details"
                        >
                          <Icon icon="lucide:eye" className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          color="blue"
                          onClick={() => router.push(`/apps/channel-partners/edit/${partner._id}`)}
                          title="Edit"
                        >
                          <Icon icon="lucide:edit" className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          color="failure"
                          onClick={() => handleDelete(partner)}
                          title="Delete"
                        >
                          <Icon icon="lucide:trash-2" className="w-3 h-3" />
                        </Button>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal show={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
        <Modal.Header>Delete Channel Partner</Modal.Header>
        <Modal.Body>
          <div className="text-center">
            <Icon icon="lucide:alert-triangle" className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Are you sure you want to delete this channel partner?
            </h3>
            <p className="text-gray-600 mb-4">
              This action cannot be undone. This will permanently delete{" "}
              <strong>{selectedPartner?.name}</strong> and all associated data.
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button color="gray" onClick={() => setDeleteModalOpen(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button color="failure" onClick={confirmDelete} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Deleting...
              </>
            ) : (
              'Delete Channel Partner'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Bulk Upload Modal */}
      <Modal show={bulkUploadModalOpen} onClose={closeBulkUploadModal} size="2xl">
        <Modal.Header>
          <div className="flex items-center gap-2">
            <Icon icon="lucide:upload" className="w-5 h-5 text-indigo-600" />
            <span>Bulk Upload Channel Partners</span>
          </div>
        </Modal.Header>
        <Modal.Body>
          <div className="space-y-6">
            {/* Instructions */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
              <div className="flex items-start gap-3">
                <Icon icon="lucide:info" className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Upload Instructions</h4>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                    <li>Download the sample template to see the required format</li>
                    <li>Fill in the channel partner details in the template</li>
                    <li>Save the file as CSV or Excel format</li>
                    <li>Upload the completed file using the button below</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Download Template Button */}
            <div className="flex justify-center">
              <Button
                color="gray"
                onClick={handleDownloadTemplate}
                className="flex items-center gap-2"
              >
                <Icon icon="lucide:download" className="w-4 h-4" />
                Download Sample Template
              </Button>
            </div>

            {/* File Upload Section */}
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
              <div className="text-center">
                <Icon icon="lucide:file-spreadsheet" className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <div className="flex items-center justify-center">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileSelect}
                      className="hidden"
                      disabled={isUploading}
                    />
                    <div className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                      <Icon icon="lucide:upload" className="w-4 h-4 inline mr-2" />
                      Select File
                    </div>
                  </label>
                </div>
                {selectedFile && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Icon icon="lucide:file" className="w-4 h-4" />
                    <span>{selectedFile.name}</span>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="text-red-500 hover:text-red-700"
                      disabled={isUploading}
                    >
                      <Icon icon="lucide:x" className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Upload Results */}
            {uploadResults && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon icon="lucide:check-circle" className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <span className="font-semibold text-green-900 dark:text-green-100">Success</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {uploadResults.success}
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Partners created successfully
                    </p>
                  </div>

                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon icon="lucide:x-circle" className="w-5 h-5 text-red-600 dark:text-red-400" />
                      <span className="font-semibold text-red-900 dark:text-red-100">Failed</span>
                    </div>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {uploadResults.failed}
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      Partners failed to create
                    </p>
                  </div>
                </div>

                {/* Error Details */}
                {uploadResults.errors && uploadResults.errors.length > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-700 max-h-40 overflow-y-auto">
                    <h5 className="font-semibold text-red-900 dark:text-red-100 mb-2 flex items-center gap-2">
                      <Icon icon="lucide:alert-triangle" className="w-4 h-4" />
                      Error Details
                    </h5>
                    <ul className="space-y-1 text-sm text-red-700 dark:text-red-300">
                      {uploadResults.errors.map((error, index) => (
                        <li key={index}>
                          Row {error.row}: {error.error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            color="gray"
            onClick={closeBulkUploadModal}
            disabled={isUploading}
          >
            {uploadResults ? 'Close' : 'Cancel'}
          </Button>
          {!uploadResults && (
            <Button
              color="indigo"
              onClick={handleBulkUpload}
              disabled={!selectedFile || isUploading}
              className="flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Icon icon="lucide:upload" className="w-4 h-4" />
                  Upload File
                </>
              )}
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ChannelPartnersPage;
