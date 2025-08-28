"use client";
import React, { useState, useEffect } from "react";
import { Button, Card, Table, Badge, Modal, TextInput, Label, Alert, Select, Textarea } from "flowbite-react";
import { Icon } from "@iconify/react";
import { useAuth } from "@/app/context/AuthContext";
import { API_ENDPOINTS, createRefreshEvent } from "@/lib/config";

interface LeadSource {
  _id: string;
  name: string;
}

interface FormField {
  name: string;
  type: string;
  required: boolean;
}

interface LeadStatus {
  _id: string;
  name: string;
  formFields: FormField[];
}

interface Lead {
  _id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  source: string;
  status: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

const LeadsPage = () => {
  const { token } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadSources, setLeadSources] = useState<LeadSource[]>([]);
  const [leadStatuses, setLeadStatuses] = useState<LeadStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    source: "",
    status: "",
    notes: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch lead sources
      const sourcesResponse = await fetch(API_ENDPOINTS.LEAD_SOURCES, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (sourcesResponse.ok) {
        const sourcesData = await sourcesResponse.json();
        setLeadSources(sourcesData.leadSources || sourcesData || []);
      }

      // Fetch lead statuses
      const statusesResponse = await fetch(API_ENDPOINTS.LEAD_STATUSES, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (statusesResponse.ok) {
        const statusesData = await statusesResponse.json();
        setLeadStatuses(statusesData.leadStatuses || statusesData || []);
      }

      // TODO: Fetch actual leads when backend implements the endpoint
      // For now, we'll show a message that leads API needs to be implemented
      setLeads([]);
      
    } catch (error) {
      console.error("Error fetching data:", error);
      setAlertMessage({ type: 'error', message: 'Failed to fetch data' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.source || !formData.status) return;

    try {
      setIsSubmitting(true);
      
      // TODO: Implement actual lead creation/update when backend provides the endpoint
      // For now, we'll show a success message
      if (editingLead) {
        setAlertMessage({ type: 'success', message: 'Lead updated successfully! (Backend endpoint needed)' });
      } else {
        setAlertMessage({ type: 'success', message: 'Lead created successfully! (Backend endpoint needed)' });
      }

      handleCloseModal();
    } catch (error) {
      console.error("Error saving lead:", error);
      setAlertMessage({ type: 'error', message: 'Failed to save lead' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this lead?")) return;

    try {
      // TODO: Implement actual lead deletion when backend provides the endpoint
      setAlertMessage({ type: 'success', message: 'Lead deleted successfully! (Backend endpoint needed)' });
    } catch (error) {
      console.error("Error deleting lead:", error);
      setAlertMessage({ type: 'error', message: 'Failed to delete lead' });
    }
  };

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setFormData({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      source: lead.source,
      status: lead.status,
      notes: lead.notes
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingLead(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      company: "",
      source: "",
      status: "",
      notes: ""
    });
  };

  const handleAddNew = () => {
    setEditingLead(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      company: "",
      source: "",
      status: "",
      notes: ""
    });
    setIsModalOpen(true);
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSource = filterSource === "all" || lead.source === filterSource;
    const matchesStatus = filterStatus === "all" || lead.status === filterStatus;
    return matchesSearch && matchesSource && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Lead Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your sales leads and prospects</p>
        </div>
        <Button onClick={handleAddNew} color="primary">
          <Icon icon="solar:add-circle-line-duotone" className="mr-2" />
          Add New Lead
        </Button>
      </div>

      {/* Alert Messages */}
      {alertMessage && (
        <Alert
          color={alertMessage.type === 'success' ? 'success' : 'failure'}
          onDismiss={() => setAlertMessage(null)}
        >
          {alertMessage.message}
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {leads.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Leads</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {leadSources.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Lead Sources</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {leadStatuses.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Lead Statuses</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {leads.filter(lead => lead.status === 'New').length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">New Leads</div>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <TextInput
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={() => <Icon icon="solar:magnifer-line-duotone" className="text-gray-400" />}
            />
          </div>
          <div>
            <Select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
            >
              <option value="all">All Sources</option>
              {leadSources.map(source => (
                <option key={source._id} value={source.name}>
                  {source.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              {leadStatuses.map(status => (
                <option key={status._id} value={status.name}>
                  {status.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-center">
            <Badge color="info" size="lg">
              {filteredLeads.length} Lead{filteredLeads.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Leads Table */}
      <Card>
        <Table>
          <Table.Head>
            <Table.HeadCell>Name</Table.HeadCell>
            <Table.HeadCell>Contact</Table.HeadCell>
            <Table.HeadCell>Company</Table.HeadCell>
            <Table.HeadCell>Source</Table.HeadCell>
            <Table.HeadCell>Status</Table.HeadCell>
            <Table.HeadCell>Created</Table.HeadCell>
            <Table.HeadCell>Actions</Table.HeadCell>
          </Table.Head>
          <Table.Body className="divide-y">
            {filteredLeads.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={7} className="text-center py-8">
                  <div className="text-gray-500 dark:text-gray-400">
                    <Icon icon="solar:info-circle-line-duotone" className="mx-auto text-4xl mb-2" />
                    <p>No leads found</p>
                    <p className="text-sm">
                      {leads.length === 0 
                        ? "Backend needs to implement /api/leads endpoint to display leads"
                        : "No leads match your current filters"
                      }
                    </p>
                  </div>
                </Table.Cell>
              </Table.Row>
            ) : (
              filteredLeads.map((lead) => (
                <Table.Row key={lead._id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                  <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                    {lead.name}
                  </Table.Cell>
                  <Table.Cell>
                    <div className="text-sm">
                      <div>{lead.email}</div>
                      <div className="text-gray-500 dark:text-gray-400">{lead.phone}</div>
                    </div>
                  </Table.Cell>
                  <Table.Cell className="whitespace-nowrap text-gray-900 dark:text-white">
                    {lead.company}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color="blue" size="sm">
                      {lead.source}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color="green" size="sm">
                      {lead.status}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell className="whitespace-nowrap text-gray-500 dark:text-gray-400">
                    {new Date(lead.createdAt).toLocaleDateString()}
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        color="info"
                        onClick={() => handleEdit(lead)}
                      >
                        <Icon icon="solar:pen-line-duotone" className="mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        color="failure"
                        onClick={() => handleDelete(lead._id)}
                      >
                        <Icon icon="solar:trash-bin-trash-line-duotone" className="mr-1" />
                        Delete
                      </Button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))
            )}
          </Table.Body>
        </Table>
      </Card>

      {/* Add/Edit Modal */}
      <Modal show={isModalOpen} onClose={handleCloseModal} size="2xl">
        <Modal.Header>
          {editingLead ? 'Edit Lead' : 'Add New Lead'}
        </Modal.Header>
        <form onSubmit={handleSubmit}>
          <Modal.Body>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" value="Full Name *" />
                <TextInput
                  id="name"
                  type="text"
                  placeholder="Enter full name..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email" value="Email" />
                <TextInput
                  id="email"
                  type="email"
                  placeholder="Enter email..."
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="phone" value="Phone" />
                <TextInput
                  id="phone"
                  type="tel"
                  placeholder="Enter phone number..."
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="company" value="Company" />
                <TextInput
                  id="company"
                  type="text"
                  placeholder="Enter company name..."
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="source" value="Lead Source *" />
                <Select
                  id="source"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  required
                >
                  <option value="">Select source</option>
                  {leadSources.map(source => (
                    <option key={source._id} value={source.name}>
                      {source.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="status" value="Lead Status *" />
                <Select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  required
                >
                  <option value="">Select status</option>
                  {leadStatuses.map(status => (
                    <option key={status._id} value={status.name}>
                      {status.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="mt-4">
              <Label htmlFor="notes" value="Notes" />
              <Textarea
                id="notes"
                placeholder="Enter additional notes..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Icon icon="solar:check-circle-line-duotone" className="mr-2" />
              )}
              {editingLead ? 'Update' : 'Create'}
            </Button>
            <Button color="gray" onClick={handleCloseModal}>
              Cancel
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
    </div>
  );
};

export default LeadsPage;
