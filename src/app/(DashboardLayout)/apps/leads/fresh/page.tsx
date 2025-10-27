"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Button, Card, Table, Badge, Modal, TextInput, Label, Alert, Select, Textarea, Pagination, Tabs } from "flowbite-react";
import { Icon } from "@iconify/react";
import { useAuth } from "@/app/context/AuthContext";
import { API_ENDPOINTS, API_BASE_URL } from "@/lib/config";
import { useRouter } from "next/navigation";
import { PERMISSIONS } from "@/app/types/permissions";
import { usePermissions } from "@/app/context/PermissionContext";
import LeadStatusChart from "./LeadStatusChart";
import ChartJSLineChart from "@/app/components/charts/ChartJSLineChart";
import LeadAnalyticsChart from "./LeadAnalyticsChart";
import dynamic from "next/dynamic";
import DateTimePicker from "@/components/DateTimePicker";


const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });




const formatDateToDDMMYYYY = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
};

const formatDateToYYYYMMDD = (date: Date): string => {
    const year = String(date.getFullYear());
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};


interface LeadSource {
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
    createdAt: string;
    updatedAt: string;
}

interface CPSourcingUser {
    _id: string;
    name: string;
    email: string;
    userId?: string;
    channelPartnerId?: {
        _id: string;
        name: string;
    };
    projectId?: {
        _id: string;
        name: string;
    };
}

interface FormField {
    name: string;
    type: string;
    required: boolean;
    options: string[];
    _id: string;
}

interface LeadStatus {
    _id: string;
    name: string;
    formFields: FormField[];
    is_default_status?: boolean; // Optional default field from API
    is_final_status?: boolean; // Optional final status field from API
}

interface Lead {
    _id: string;
    user?: {
        _id: string;
        name: string;
        email: string;
        role?: string;
    } | null;
    leadSource?: {
        _id: string;
        name: string;
    } | null;
    currentStatus?: {
        _id: string;
        name: string;
    } | null;
    cpSourcingId?: {
        _id: string;
        name?: string;
        userId?: {
            _id: string;
            name: string;
        };
    } | null;
    channelPartner?: {
        _id: string;
        name: string;
    } | null;
    project?: {
        _id: string;
        name: string;
    } | null;
    customData: {
        "First Name"?: string;
        "Email"?: string;
        "Phone"?: string;
        "Notes"?: string;
        [key: string]: any;
    };
    statusHistory: any[];
    LeadScore?: number;
    createdAt: string;
    updatedAt: string;
    // Computed fields for display
    name?: string;
    email?: string;
    phone?: string;
    source?: string;
    status?: string;
    notes?: string;
    projectName?: string;
}

interface Project {
    _id: string;
    name: string;
    description?: string;
}

interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
    level?: number;
    mobile?: string;
    companyName?: string;
}

const FreshLeadsPage = () => {
    const { token, user } = useAuth();
    const { hasPermission } = usePermissions();
    const router = useRouter();

    // Permissions
    const isSuperAdmin = user?.role === 'superadmin' || user?.email === 'superadmin@deltayards.com';
    const finalPermissions = {
        canReadLeads: isSuperAdmin || hasPermission(PERMISSIONS.LEADS_READ),
        canUpdateLeads: isSuperAdmin ? true : hasPermission(PERMISSIONS.LEADS_UPDATE),
        canDeleteLeads: isSuperAdmin ? true : hasPermission(PERMISSIONS.LEADS_DELETE),
        permissionsLoading: false

    };


    // form

    const [isSubmitting, setIsSubmitting] = useState(false);


    // State for fresh leads data
    const [isLoadingLeads, setIsLoadingLeads] = useState(false);
    const [freshLeads, setFreshLeads] = useState<Lead[]>([]);
    const [totalFreshLeads, setTotalFreshLeads] = useState<Lead[]>([]);
    const [todaysFreshLeads, setTodaysFreshLeads] = useState<Lead[]>([]);
    const [pendingFreshLeads, setPendingFreshLeads] = useState<Lead[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);

    // State for filter data
    const [leadSources, setLeadSources] = useState<LeadSource[]>([]);
    const [leadStatuses, setLeadStatuses] = useState<LeadStatus[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [channelPartners, setChannelPartners] = useState<ChannelPartner[]>([]);
    const [cpSourcingOptions, setCPSourcingOptions] = useState<CPSourcingUser[]>([]);
    const [isLoadingCPSourcing, setIsLoadingCPSourcing] = useState(false);



    const [dynamicFields, setDynamicFields] = useState<{ [key: string]: any }>({});


    // State for UI interaction
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [serverTotalItems, setServerTotalItems] = useState<number | null>(null);
    const [serverTotalPages, setServerTotalPages] = useState<number | null>(null);

    // State for filters
    const [searchTerm, setSearchTerm] = useState("");
    const [filterSource, setFilterSource] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [filterUser, setFilterUser] = useState<string>("all");
    const [filterDateFrom, setFilterDateFrom] = useState<string>("");
    const [filterDateTo, setFilterDateTo] = useState<string>("");
    const [datePreset, setDatePreset] = useState<string>("custom");
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [editingLead, setEditingLead] = useState<Lead | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        source: "",
        status: "",
        notes: "",
        projectId: "", // Will be empty until user selects
        userId: "",
        remark: "", // For status updates
        leadPriority: "",
        propertyType: "",
        configuration: "",
        fundingMode: "",
        gender: "",
        budget: "",
        channelPartner: "", // Channel partner selection
        cpSourcingId: "" // Channel partner sourcing option
    });

    const transformLeadData = (leadsData: any[]): Lead[] => {
        return leadsData.map(lead => ({
            ...lead,
            name: lead.customData?.["First Name"] || lead.customData?.name || 'N/A',
            email: lead.customData?.["Email"] || lead.customData?.email || 'N/A',
            phone: lead.customData?.["Phone"] || lead.customData?.phone || lead.customData?.contact || 'N/A',
            source: lead.leadSource?.name || 'N/A',
            status: lead.currentStatus?.name || 'N/A',
            projectName: lead.project?.name || 'N/A',
        }));
    };


    const fetchData = async () => {
        try {
            setIsLoading(true);

            // fetch projects
            const projectsResponse = await fetch(API_ENDPOINTS.PROJECTS, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (projectsResponse.ok) {
                const projectsData = await projectsResponse.json();
                const projectsList = projectsData.projects || projectsData || [];
                setProjects(projectsList);

                if (projectsList.length === 0) {
                    setAlertMessage({
                        type: 'error',
                        message: 'No projects found. Please create a project first before managing leads.'
                    });
                }
                //frwdw
            } else {
                console.error("Failed to fetch projects:", projectsResponse.statusText);
                setAlertMessage({
                    type: 'error',
                    message: `Failed to fetch projects: ${projectsResponse.status} ${projectsResponse.statusText}`
                });
            }

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
                const statuses = statusesData.leadStatuses || statusesData || [];
                setLeadStatuses(statuses);
            }


            // Fetch channel partners
            const channelPartnersResponse = await fetch(API_ENDPOINTS.CHANNEL_PARTNERS, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (channelPartnersResponse.ok) {
                const channelPartnersData = await channelPartnersResponse.json();
                const partners = channelPartnersData.channelPartners || channelPartnersData || [];
                setChannelPartners(partners);
                // await fetchAllCPSourcingUsers(); // Fetch all CP sourcing users
            }


            // Fetch users (only for super admin)
            if (isSuperAdmin) {
                const usersResponse = await fetch(API_ENDPOINTS.USERS, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (usersResponse.ok) {
                    const projectsData = await usersResponse.json();
                    const projects = projectsData.projects || projectsData || [];

                    // Extract all unique users from projects (owner, members, managers)
                    const allUsers = new Map();

                    projects.forEach((project: any) => {
                        // Add owner
                        if (project.owner) {
                            allUsers.set(project.owner._id, {
                                _id: project.owner._id,
                                name: project.owner.name,
                                email: project.owner.email,
                                role: project.owner.role,
                                level: project.owner.level,
                                mobile: project.owner.mobile,
                                companyName: project.owner.companyName
                            });
                        }

                        // Add members
                        if (project.members && Array.isArray(project.members)) {
                            project.members.forEach((member: any) => {
                                allUsers.set(member._id, {
                                    _id: member._id,
                                    name: member.name,
                                    email: member.email,
                                    role: member.role,
                                    level: member.level,
                                    mobile: member.mobile,
                                    companyName: member.companyName
                                });
                            });
                        }

                        // Add managers
                        if (project.managers && Array.isArray(project.managers)) {
                            project.managers.forEach((manager: any) => {
                                allUsers.set(manager._id, {
                                    _id: manager._id,
                                    name: manager.name,
                                    email: manager.email,
                                    role: manager.role,
                                    level: manager.level,
                                    mobile: manager.mobile,
                                    companyName: manager.companyName
                                });
                            });
                        }
                    });

                    // Convert Map to Array
                    const usersList = Array.from(allUsers.values());
                    setUsers(usersList);
                    console.log("Extracted users from projects:", usersList);
                } else {
                    console.error("Failed to fetch users:", usersResponse.statusText);
                }
            }

        } catch (error) {
            console.error("Error fetching data:", error);
            setAlertMessage({ type: 'error', message: 'Failed to fetch data' });
        } finally {
            setIsLoading(false);
        }
    };

    const fetchFreshLeadData = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(API_ENDPOINTS.FRESH_LEAD_DATA(), {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setTotalFreshLeads(transformLeadData(data.totalFreshLeads || []));
                setTodaysFreshLeads(transformLeadData(data.todaysFreshLeads || []));
                setPendingFreshLeads(transformLeadData(data.pendingFreshLeads || []));
            } else {
                setAlertMessage({ type: 'error', message: `Failed to fetch fresh leads: ${response.statusText}` });
            }
        } catch (error) {
            console.error("Error fetching fresh leads:", error);
            setAlertMessage({ type: 'error', message: 'Network error while fetching fresh leads.' });
        } finally {
            setIsLoading(false);
        }
    };

    const fetchFreshLeads = async () => {
        if (isLoadingLeads) return;

        try {
            setIsLoadingLeads(true);
            // Build URL with pagination params (backend-supported)
            const baseUrl = API_ENDPOINTS.FRESH_LEADS();
            const url = new URL(baseUrl);
            url.searchParams.set('page', String(currentPage));
            url.searchParams.set('limit', String(pageSize));

            const FreshLeadsResponse = await fetch(url.toString(), {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (FreshLeadsResponse.ok) {
                const freshLeadsData = await FreshLeadsResponse.json();
                console.log('Leads Data:', freshLeadsData);
                const leadsArray = freshLeadsData.freshleads || [];
                // Capture server pagination metadata if provided
                const paginationMeta = (freshLeadsData as any).pagination;
                if (paginationMeta && typeof paginationMeta === 'object') {
                    const srvCurrentPage = Number(paginationMeta.currentPage) || currentPage;
                    const srvTotalPages = Number(paginationMeta.totalPages) || null;
                    const srvTotalItems = Number(paginationMeta.totalItems) || null;
                    const srvLimit = Number(paginationMeta.limit) || pageSize;
                    setServerTotalItems(srvTotalItems);
                    setServerTotalPages(srvTotalPages);
                    if (srvCurrentPage !== currentPage) setCurrentPage(srvCurrentPage);
                    if (srvLimit !== pageSize) setPageSize(srvLimit);
                } else {
                    setServerTotalItems(null);
                    setServerTotalPages(null);
                }
                const transformedLeads = transformLeadData(leadsArray);
                setFreshLeads(transformedLeads);


            } else {
                setFreshLeads([]);
                handleLeadsError(FreshLeadsResponse);
            }
        } catch (error) {
            console.error("Error fetching leads:", error);
            setFreshLeads([]);
            setAlertMessage({
                type: 'error',
                message: 'Network error: Failed to fetch leads. Please check your connection.'
            });
        } finally {
            setIsLoadingLeads(false);
        }
    };

    const getRequiredFieldsForStatus = (statusId: string) => {
        const status = leadStatuses.find(s => s._id === statusId);
        return status?.formFields || [];
    };

    const fetchCPSourcingOptions = async (channelPartnerId: string, projectId: string) => {
        console.log('Fetching CP sourcing options:', { channelPartnerId, projectId });

        if (!channelPartnerId || !projectId) {
            console.log('Missing channelPartnerId or projectId, clearing options');
            setCPSourcingOptions([]);
            return;
        }

        try {
            setIsLoadingCPSourcing(true);
            const response = await fetch(
                API_ENDPOINTS.CP_SOURCING_UNIQUE_USERS(projectId, channelPartnerId),
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            console.log('CP sourcing API response:', { status: response.status, ok: response.ok });

            if (response.ok) {
                const data = await response.json();
                console.log('CP sourcing API data:', data);

                // Normalize to unique user list with stable ids (prefer user._id)
                const rawList = Array.isArray(data) ? data : (Array.isArray((data as any)?.users) ? (data as any).users : []);
                const uniqueUsers = new Map<string, CPSourcingUser>();
                rawList.forEach((item: any) => {
                    const user = item?.user || item;
                    const id: string | undefined = user?._id || item?.userId || item?._id;
                    const name: string = user?.name || item?.name || '';
                    const email: string = user?.email || item?.email || '';
                    const userId: string | undefined = user?._id || item?.userId;
                    const channelPartnerId = item?.channelPartnerId || user?.channelPartnerId;
                    const projectId = item?.projectId || user?.projectId;
                    if (!id) return;
                    uniqueUsers.set(id, {
                        _id: id,
                        userId,
                        name,
                        email,
                        channelPartnerId,
                        projectId
                    });
                });
                const normalized = Array.from(uniqueUsers.values());
                console.log('Normalized CP sourcing users:', normalized);

                // Merge into existing options so table lookups keep working
                setCPSourcingOptions(prev => {
                    const map = new Map<string, CPSourcingUser>();
                    prev.forEach(u => map.set(u._id, u));
                    normalized.forEach(u => map.set(u._id, u));
                    const result = Array.from(map.values());
                    console.log('Updated CP sourcing options:', result);
                    return result;
                });
            } else {
                console.error('Failed to fetch CP sourcing users:', response.statusText);
                setCPSourcingOptions([]);
            }
        } catch (error) {
            console.error('Error fetching CP sourcing users:', error);
            setCPSourcingOptions([]);
        } finally {
            setIsLoadingCPSourcing(false);
        }
    };

    // Handler for project change
    const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const projectId = e.target.value;
        const channelPartnerId = formData.channelPartner;

        setFormData(prev => ({
            ...prev,
            projectId: projectId,
            cpSourcingId: '' // Reset CP sourcing when project changes
        }));

        // If a channel partner is already selected, fetch CP sourcing options for the new project
        if (channelPartnerId && projectId) {
            fetchCPSourcingOptions(channelPartnerId, projectId);
        } else {
            setCPSourcingOptions([]);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this lead?")) return;

        try {
            const response = await fetch(API_ENDPOINTS.DELETE_LEAD(id), {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                setAlertMessage({ type: 'success', message: 'Lead deleted successfully!' });
                setTimeout(() => { fetchFreshLeads(), fetchFreshLeadData() }, 2000);
            } else {
                let errorMessage = 'Failed to delete lead';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (parseError) {
                    errorMessage = `Delete failed: ${response.status} ${response.statusText}`;
                }
                setAlertMessage({ type: 'error', message: errorMessage });
            }
        } catch (error) {
            console.error("Error deleting lead:", error);
            setAlertMessage({ type: 'error', message: 'Network error: Failed to delete lead. Please check your connection.' });
        }
    };

    const handleEdit = (lead: Lead) => {
        setEditingLead(lead);
        setFormData({
            name: lead.name || '',
            email: lead.email || '',
            phone: lead.phone || '',
            source: lead.leadSource?._id || '',
            status: lead.currentStatus?._id || '',
            notes: lead.notes || '',
            projectId: lead.project?._id || '',
            userId: user?.id || '', // Always use current user's ID
            remark: '', // Reset remark for new status update
            leadPriority: lead.customData?.["Lead Priority"] || lead.customData?.leadPriority || '',
            propertyType: lead.customData?.["Property Type"] || lead.customData?.propertyType || '',
            configuration: lead.customData?.["Configuration"] || lead.customData?.configuration || '',
            fundingMode: lead.customData?.["Funding Mode"] || lead.customData?.fundingMode || '',
            gender: lead.customData?.["Gender"] || lead.customData?.gender || '',
            budget: lead.customData?.["Budget"] || lead.customData?.budget || '',
            channelPartner: lead.customData?.["Channel Partner"] || '',
            cpSourcingId: lead.customData?.["Channel Partner Sourcing"] || ''
        });

        // Populate dynamic fields from lead's customData
        const newDynamicFields: { [key: string]: any } = {};
        if (lead.currentStatus?._id) {
            const requiredFields = getRequiredFieldsForStatus(lead.currentStatus._id);
            const currentLeadStatus = leadStatuses.find(s => s._id === lead.currentStatus?._id);

            requiredFields.forEach(field => {
                if (field.type === 'date') {
                    if (currentLeadStatus?.is_final_status) {
                        const today = new Date();
                        newDynamicFields[field.name] = lead.customData?.[field.name] || formatDateToYYYYMMDD(today);
                    } else {
                        newDynamicFields[field.name] = lead.customData?.[field.name] || ''; // Keep existing or clear
                    }
                } else if (field.type === 'checkbox') {
                    // Initialize checkbox fields as arrays
                    const existingValue = lead.customData?.[field.name];
                    newDynamicFields[field.name] = Array.isArray(existingValue) ? existingValue : [];
                } else {
                    // Initialize other fields as strings
                    newDynamicFields[field.name] = lead.customData?.[field.name] || '';
                }
            });
        }
        setDynamicFields(newDynamicFields);

        setIsModalOpen(true);
    };


    useEffect(() => {
        if (token) {
            fetchFreshLeadData();
            fetchData();
            fetchFreshLeads();
        }
    }, [token]);

    // Refetch fresh leads when pagination changes
    useEffect(() => {
        if (token) {
            fetchFreshLeads();
        }
    }, [currentPage, pageSize]);



    if (isLoading || finalPermissions.permissionsLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
                <p className="ml-4 text-gray-600 dark:text-gray-400">
                    {finalPermissions.permissionsLoading ? 'Loading permissions...' : 'Loading...'}
                </p>
            </div>
        );
    }






    const tabs = [
        { title: "Total Fresh Leads", data: totalFreshLeads },
        { title: "Today's Fresh Leads", data: todaysFreshLeads },
        { title: "Pending Fresh Leads", data: pendingFreshLeads },
    ];


    const getLeadsBySource = () => {
        if (!totalFreshLeads || !Array.isArray(totalFreshLeads)) {
            return [];
        }

        // The `totalFreshleads` are raw from the API, so we need to transform them
        // to get the user-friendly source name. We can reuse your `transformLeadData` function.
        const transformedLeads = totalFreshLeads; // Already transformed

        const sourceCounts: { [key: string]: number } = {};

        transformedLeads.forEach(lead => {
            // The `source` property is already calculated by `transformLeadData`
            const sourceName = lead.source || 'N/A';
            sourceCounts[sourceName] = (sourceCounts[sourceName] || 0) + 1;
        });

        // Format the data for the chart component and sort it
        return Object.entries(sourceCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
    };

    // lead by user
    const getLeadsByUser = () => {
        if (!totalFreshLeads || !Array.isArray(totalFreshLeads)) {
            return [];
        }

        const userCounts: { [key: string]: number } = {};

        totalFreshLeads.forEach(lead => {
            // Use user's name or 'Unassigned' if no user is assigned
            const userName = lead.user?.name || 'Unassigned';
            userCounts[userName] = (userCounts[userName] || 0) + 1;
        });

        // Format the data for the chart component and sort it
        return Object.entries(userCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
    };

    const handleDatePresetChange = (preset: string) => {
        setDatePreset(preset);
        const today = new Date();

        switch (preset) {
            case "today":
                const todayStr = today.toISOString().split('T')[0];
                setFilterDateFrom(todayStr);
                setFilterDateTo(todayStr);
                break;
            case "yesterday":
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];
                setFilterDateFrom(yesterdayStr);
                setFilterDateTo(yesterdayStr);
                break;
            case "thisWeek":
                const startOfWeek = new Date(today);
                startOfWeek.setDate(today.getDate() - today.getDay());
                const endOfWeek = new Date(today);
                endOfWeek.setDate(today.getDate() + (6 - today.getDay()));
                setFilterDateFrom(startOfWeek.toISOString().split('T')[0]);
                setFilterDateTo(endOfWeek.toISOString().split('T')[0]);
                break;
            case "lastWeek":
                const lastWeekStart = new Date(today);
                lastWeekStart.setDate(today.getDate() - today.getDay() - 7);
                const lastWeekEnd = new Date(today);
                lastWeekEnd.setDate(today.getDate() - today.getDay() - 1);
                setFilterDateFrom(lastWeekStart.toISOString().split('T')[0]);
                setFilterDateTo(lastWeekEnd.toISOString().split('T')[0]);
                break;
            case "thisMonth":
                const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                setFilterDateFrom(startOfMonth.toISOString().split('T')[0]);
                setFilterDateTo(endOfMonth.toISOString().split('T')[0]);
                break;
            case "lastMonth":
                const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
                setFilterDateFrom(lastMonthStart.toISOString().split('T')[0]);
                setFilterDateTo(lastMonthEnd.toISOString().split('T')[0]);
                break;
            case "clear":
                setFilterDateFrom("");
                setFilterDateTo("");
                break;
            default:
                // Custom - don't change dates
                break;
        }
    };

    const handleLeadsError = (response: Response) => {
        if (response.status === 429) {
            setAlertMessage({
                type: 'error',
                message: `Rate Limited (429): Too many requests. Please wait a moment and try again.`
            });
        } else if (response.status === 500) {
            setAlertMessage({
                type: 'error',
                message: `Backend Error (500): The leads API is experiencing issues. Please try again later or contact support.`
            });
        } else if (response.status === 404) {
            setAlertMessage({
                type: 'error',
                message: `API Endpoint Not Found (404): The leads API endpoint may not be implemented yet on the backend.`
            });
        } else if (response.status === 401) {
            setAlertMessage({
                type: 'error',
                message: `Unauthorized (401): Please check your authentication token.`
            });
        } else {
            setAlertMessage({
                type: 'error',
                message: `Failed to fetch leads: ${response.status} ${response.statusText}`
            });
        }
    };

    const filteredLeads = freshLeads.filter(lead => {
        const matchesSearch =
            (lead.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (lead.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        const matchesSource = filterSource === "all" || lead.leadSource?._id === filterSource;
        const matchesStatus = filterStatus === "all" || lead.currentStatus?._id === filterStatus;
        const matchesUser = filterUser === "all" ||
            (filterUser === "unassigned" && !lead.user?._id) ||
            (filterUser !== "unassigned" && lead.user?._id === filterUser);

        // Date filtering
        let matchesDate = true;
        if (filterDateFrom || filterDateTo) {
            const leadDate = new Date(lead.createdAt);
            if (filterDateFrom) {
                const fromDate = new Date(filterDateFrom);
                fromDate.setHours(0, 0, 0, 0);
                matchesDate = matchesDate && leadDate >= fromDate;
            }
            if (filterDateTo) {
                const toDate = new Date(filterDateTo);
                toDate.setHours(23, 59, 59, 999);
                matchesDate = matchesDate && leadDate <= toDate;
            }
        }

        return matchesSearch && matchesSource && matchesStatus && matchesUser && matchesDate;
    });


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate required fields
        if (!formData.name.trim()) {
            setAlertMessage({
                type: 'error',
                message: 'Please enter a lead name'
            });
            return;
        }

        if (!formData.source) {
            setAlertMessage({
                type: 'error',
                message: 'Please select a lead source'
            });
            return;
        }

        // If channel partner is selected as source, validate channel partner selection
        const isChannelPartner = formData.source === 'channel-partner' ||
            leadSources.some(source => source._id === formData.source && source.name.toLowerCase() === 'channel partner');

        if (!editingLead && isChannelPartner && !formData.channelPartner) {
            setAlertMessage({
                type: 'error',
                message: 'Please select a channel partner'
            });
            return;
        }

        if (!formData.status) {
            setAlertMessage({
                type: 'error',
                message: 'Default lead status not found. Please refresh the page.'
            });
            return;
        }

        if (!formData.projectId) {
            setAlertMessage({
                type: 'error',
                message: 'Please select a project from the dropdown to create this lead.'
            });
            return;
        }

        if (!formData.userId) {
            setAlertMessage({
                type: 'error',
                message: 'User ID not available. Please refresh the page and try again.'
            });
            return;
        }

        // Debug: Log form data before submission
        console.log('Form submission data:', {
            formData,
            dynamicFields,
            channelPartner: formData.channelPartner,
            cpSourcingId: formData.cpSourcingId,
            source: formData.source
        });

        // Validate dynamic fields based on selected status
        if (!editingLead) { // Only validate dynamic fields for new leads
            const requiredFields = getRequiredFieldsForStatus(formData.status);
            for (const field of requiredFields) {
                if (field.required) {
                    const fieldValue = dynamicFields[field.name] || formData[field.name as keyof typeof formData];
                    if (!fieldValue || !fieldValue.toString().trim()) {
                        setAlertMessage({
                            type: 'error',
                            message: `Please fill in the required field: ${field.name}`
                        });
                        return;
                    }
                }
            }
        }

        try {
            setIsSubmitting(true);

            if (editingLead) {
                // Check if status has changed - if so, use status update API
                const statusChanged = editingLead.currentStatus?._id !== formData.status;

                if (statusChanged) {
                    // Use status update API with the format you specified
                    const statusUpdateBody = {
                        newStatusId: formData.status, // new status id
                        newData: {
                            "First Name": editingLead.customData?.["First Name"] || editingLead.customData?.name || editingLead.name || 'N/A',
                            "Email": editingLead.customData?.["Email"] || editingLead.customData?.email || editingLead.email || 'N/A',
                            "Phone": editingLead.customData?.["Phone"] || editingLead.customData?.phone || editingLead.customData?.contact || editingLead.phone || 'N/A',
                            "Notes": editingLead.customData?.["Notes"] || editingLead.customData?.notes || editingLead.notes || '',
                            "Lead Priority": editingLead.customData?.["Lead Priority"] || editingLead.customData?.leadPriority || '',
                            "Property Type": editingLead.customData?.["Property Type"] || editingLead.customData?.propertyType || '',
                            "Configuration": editingLead.customData?.["Configuration"] || editingLead.customData?.configuration || '',
                            "Funding Mode": editingLead.customData?.["Funding Mode"] || editingLead.customData?.fundingMode || '',
                            "Gender": editingLead.customData?.["Gender"] || editingLead.customData?.gender || '',
                            "Budget": editingLead.customData?.["Budget"] || editingLead.customData?.budget || '',
                            "Remark": formData.remark || 'Status updated',
                            ...dynamicFields // Include dynamic fields
                        } // form data
                    };

                    console.log('Status update request:', {
                        url: `${API_BASE_URL}/api/leads/${editingLead._id}/status/`,
                        method: 'PUT',
                        body: statusUpdateBody
                    });
                    console.log('Dynamic fields being sent:', dynamicFields);

                    const response = await fetch(`${API_BASE_URL}/api/leads/${editingLead._id}/status/`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify(statusUpdateBody),
                    });

                    if (response.ok) {
                        setAlertMessage({ type: 'success', message: 'Lead status updated successfully!' });
                        handleCloseModal();
                        fetchFreshLeads();
                        fetchFreshLeadData()
                    } else {
                        let errorMessage = 'Failed to update lead status';
                        try {
                            const errorData = await response.json();
                            errorMessage = errorData.message || errorMessage;
                        } catch (parseError) {
                            errorMessage = `Status update failed: ${response.status} ${response.statusText}`;
                        }
                        setAlertMessage({ type: 'error', message: errorMessage });
                    }
                } else {
                    // Regular lead update (no status change)
                    // Check if the selected source is a channel partner
                    const isChannelPartnerSource = formData.source === 'channel-partner' ||
                        leadSources.some(source => source._id === formData.source && source.name.toLowerCase() === 'channel partner');

                    const response = await fetch(API_ENDPOINTS.UPDATE_LEAD(editingLead._id), {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            // Always send the selected lead source id (do not replace with CP id)
                            leadSource: formData.source,
                            currentStatus: formData.status,
                            // Only send CP details if the source is channel partner
                            ...(isChannelPartnerSource && formData.channelPartner ? { channelPartner: formData.channelPartner } : {}),
                            ...(isChannelPartnerSource && formData.cpSourcingId ? { cpSourcingId: formData.cpSourcingId } : {}),
                            customData: {
                                "First Name": formData.name.split(' ')[0] || formData.name,
                                "Email": formData.email,
                                "Phone": formData.phone,
                                "Notes": formData.notes,
                                "Lead Priority": formData.leadPriority,
                                "Property Type": formData.propertyType,
                                "Configuration": formData.configuration,
                                "Funding Mode": formData.fundingMode,
                                "Gender": formData.gender,
                                "Budget": formData.budget,
                                // Only add channel partner to customData if the source is channel partner
                                ...(isChannelPartnerSource && formData.channelPartner ? { "Channel Partner": formData.channelPartner } : {}),
                                ...(isChannelPartnerSource && formData.cpSourcingId ? { "Channel Partner Sourcing": formData.cpSourcingId } : {}),
                                ...dynamicFields // Include dynamic fields
                            },
                            userId: formData.userId
                        }),
                    });

                    if (response.ok) {
                        setAlertMessage({ type: 'success', message: 'Lead updated successfully!' });
                        handleCloseModal();
                        fetchFreshLeads();
                        fetchFreshLeadData()
                    } else {
                        let errorMessage = 'Failed to update lead';
                        try {
                            const errorData = await response.json();
                            errorMessage = errorData.message || errorMessage;
                        } catch (parseError) {
                            errorMessage = `Update failed: ${response.status} ${response.statusText}`;
                        }
                        setAlertMessage({ type: 'error', message: errorMessage });
                    }
                }
            } else {
                // Create new lead
                // Check if the selected source is a channel partner
                const isChannelPartnerSource = formData.source === 'channel-partner' ||
                    leadSources.some(source => source._id === formData.source && source.name.toLowerCase() === 'channel partner');

                const requestBody = {
                    // Always send the selected lead source id (do not replace with CP id)
                    leadSource: formData.source,
                    currentStatus: formData.status,
                    project: formData.projectId, // Add required project field
                    // Only include channel partner fields if the source is actually channel partner
                    ...(isChannelPartnerSource && formData.channelPartner ? { channelPartner: formData.channelPartner } : {}),
                    ...(isChannelPartnerSource && formData.cpSourcingId ? { cpSourcingId: formData.cpSourcingId } : {}),
                    customData: {
                        "First Name": formData.name.split(' ')[0] || formData.name,
                        "Email": formData.email,
                        "Phone": formData.phone,
                        "Notes": formData.notes,
                        "Lead Priority": formData.leadPriority,
                        "Property Type": formData.propertyType,
                        "Configuration": formData.configuration,
                        "Funding Mode": formData.fundingMode,
                        "Gender": formData.gender,
                        "Budget": formData.budget,
                        // Only add channel partner to customData if the source is channel partner
                        ...(isChannelPartnerSource && formData.channelPartner ? { "Channel Partner": formData.channelPartner } : {}),
                        ...(isChannelPartnerSource && formData.cpSourcingId ? { "Channel Partner Sourcing": formData.cpSourcingId } : {}),
                        ...dynamicFields // Include dynamic fields
                    },
                    userId: formData.userId
                };

                console.log('Creating new lead with data:', {
                    selectedSource: formData.source,
                    isChannelPartnerSource,
                    channelPartner: formData.channelPartner,
                    cpSourcingId: formData.cpSourcingId,
                    leadSourceFromList: leadSources.find(s => s._id === formData.source),
                    fullRequestBody: requestBody
                });

                const response = await fetch(API_ENDPOINTS.CREATE_LEAD(formData.projectId), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(requestBody),
                });

                if (response.ok) {
                    const responseData = await response.json();
                    console.log('Lead created successfully - Backend response:', responseData);
                    setAlertMessage({ type: 'success', message: 'Lead created successfully!' });
                    setTimeout(() => {
                        fetchFreshLeads();
                        fetchFreshLeadData()
                    }, 2000);
                } else {
                    let errorMessage = 'Failed to create lead';
                    try {
                        const responseText = await response.text();
                        try {
                            const errorData = JSON.parse(responseText);
                            errorMessage = errorData.message || errorData.error || errorData.details || errorMessage;
                        } catch (parseError) {
                            errorMessage = responseText || `Creation failed: ${response.status} ${response.statusText}`;
                        }
                    } catch (textError) {
                        errorMessage = `Creation failed: ${response.status} ${response.statusText}`;
                    }

                    setAlertMessage({
                        type: 'error',
                        message: `Lead creation failed (${response.status}): ${errorMessage}`
                    });
                }
            }

            handleCloseModal();
        } catch (error) {
            console.error("Error saving lead:", error);
            setAlertMessage({ type: 'error', message: 'Network error: Failed to save lead. Please check your connection.' });
        } finally {
            setIsSubmitting(false);
        }
    };


    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingLead(null);

        // Find default status (check for default field, then "New", then first status)
        const defaultStatus = leadStatuses.find((status: LeadStatus) =>
            (status as any).is_default_status === true
        ) || leadStatuses.find((status: LeadStatus) =>
            status.name.toLowerCase() === 'new'
        ) || leadStatuses[0];

        // Initialize dynamic fields for default status
        const newDynamicFields: { [key: string]: any } = {};
        if (defaultStatus && defaultStatus.formFields && defaultStatus.formFields.length > 0) {
            const selectedDefaultStatus = leadStatuses.find(s => s._id === defaultStatus._id);
            defaultStatus.formFields.forEach((field: FormField) => {
                if (field.type === 'date') {
                    if (selectedDefaultStatus?.is_final_status) {
                        const today = new Date();
                        newDynamicFields[field.name] = formatDateToDDMMYYYY(today);
                    } else {
                        newDynamicFields[field.name] = ''; // Clear date if not a final status
                    }
                } else if (field.type === 'checkbox') {
                    // Initialize checkbox fields as empty arrays
                    newDynamicFields[field.name] = [];
                } else {
                    // Initialize other fields as empty strings
                    newDynamicFields[field.name] = '';
                }
            });
        }

        setFormData({
            name: "",
            email: "",
            phone: "",
            source: "",
            status: defaultStatus?._id || "", // Set default status
            notes: "",
            projectId: projects.length > 0 ? projects[0]._id : "", // Use default project
            userId: user?.id || "", // Always use current user's ID
            remark: "",
            leadPriority: "",
            propertyType: "",
            configuration: "",
            fundingMode: "",
            gender: "",
            budget: "",
            channelPartner: "",
            cpSourcingId: ""
        });
        setDynamicFields(newDynamicFields);
    };


    const handleSourceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newSource = e.target.value;

        console.log('🔍 Source changed:', {
            newSource,
            selectedSourceName: leadSources.find(s => s._id === newSource)?.name || 'Unknown',
            allLeadSources: leadSources.map(s => ({ id: s._id, name: s.name }))
        });

        // Check if the selected source is a channel partner (either by ID or manual value)
        const isChannelPartner = newSource === 'channel-partner' ||
            leadSources.some(source => source._id === newSource && source.name.toLowerCase() === 'channel partner');

        console.log('🔍 Is Channel Partner:', isChannelPartner);

        // Single functional update to prevent stale overwrites
        setFormData(prev => ({
            ...prev,
            source: newSource,
            channelPartner: isChannelPartner ? prev.channelPartner : '',
            cpSourcingId: isChannelPartner ? prev.cpSourcingId : ''
        }));

        // Reset dynamic fields when source changes
        setDynamicFields({});
    };

    const handleStatusChange = (statusId: string) => {
        // Don't allow status changes when dropdown is disabled

        setFormData(prev => ({ ...prev, status: statusId }));

        // Reset dynamic fields
        const newDynamicFields: { [key: string]: any } = {};
        const requiredFields = getRequiredFieldsForStatus(statusId);
        const newlySelectedStatus = leadStatuses.find(s => s._id === statusId);

        // Initialize dynamic fields based on status requirements
        requiredFields.forEach(field => {
            if (field.type === 'date') {
                if (newlySelectedStatus?.is_final_status) {
                    const today = new Date();
                    newDynamicFields[field.name] = formatDateToYYYYMMDD(today);
                } else {
                    newDynamicFields[field.name] = ''; // Clear date if not a final status
                }
            } else if (field.type === 'checkbox') {
                // Initialize checkbox fields as empty arrays
                newDynamicFields[field.name] = [];
            } else {
                // Initialize other fields as empty strings
                newDynamicFields[field.name] = formData[field.name as keyof typeof formData] || "";
            }
        });

        setDynamicFields(newDynamicFields);
    };

    const handleChannelPartnerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const channelPartnerId = e.target.value;
        const projectId = formData.projectId;

        console.log('Channel partner changed:', {
            channelPartnerId,
            projectId,
            previousChannelPartner: formData.channelPartner
        });

        setFormData(prev => ({
            ...prev,
            channelPartner: channelPartnerId,
            cpSourcingId: '' // Reset CP sourcing when channel partner changes
        }));

        // Fetch CP sourcing options for the selected channel partner and project
        if (channelPartnerId && projectId) {
            fetchCPSourcingOptions(channelPartnerId, projectId);
        } else {
            setCPSourcingOptions([]);
        }
    };

    // Pagination derived values
    const clientTotalItems = filteredLeads.length;
    const totalItems = serverTotalItems ?? clientTotalItems;
    const totalPages = serverTotalPages ?? Math.max(1, Math.ceil(clientTotalItems / pageSize));
    const displayedPage = Math.min(currentPage, totalPages);
    const startIndex = (displayedPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedLeads = serverTotalItems != null || serverTotalPages != null
        ? filteredLeads
        : filteredLeads.slice(startIndex, endIndex);


    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
                <p className="ml-4 text-gray-600 dark:text-gray-400">Loading Fresh Leads...</p>
            </div>
        );
    }

    if (!finalPermissions.canReadLeads) {
        return (
            <Card>
                <div className="text-center py-8">
                    <Icon icon="solar:shield-warning-line-duotone" className="mx-auto text-4xl mb-4" />
                    <p className="text-lg font-medium mb-2">Access Denied</p>
                    <p className="text-sm mb-4">You don't have permission to view leads.</p>
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex-1">
                    <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">Fresh Leads</h1>
                    <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">
                        View and manage new and pending leads.
                    </p>
                </div>
                <Button onClick={fetchFreshLeadData} color="gray" disabled={isLoading}>
                    <Icon icon="solar:refresh-line-duotone" className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Alert Messages */}
            {alertMessage && (
                <Alert color={alertMessage.type} onDismiss={() => setAlertMessage(null)}>
                    {alertMessage.message}
                </Alert>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                <Card className="p-6">
                    <div className="text-center">
                        <div className="text-3xl lg:text-4xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                            {totalFreshLeads.length}
                        </div>
                        <div className="text-base text-gray-600 dark:text-gray-400 font-medium">Total Fresh Leads</div>
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="text-center">
                        <div className="text-3xl lg:text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
                            {todaysFreshLeads.length}
                        </div>
                        <div className="text-base text-gray-600 dark:text-gray-400 font-medium">Today's Fresh Leads</div>
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="text-center">
                        <div className="text-3xl lg:text-4xl font-bold text-yellow-500 dark:text-yellow-400 mb-2">
                            {pendingFreshLeads.length}
                        </div>
                        <div className="text-base text-gray-600 dark:text-gray-400 font-medium">Pending Fresh Leads</div>
                    </div>
                </Card>
            </div>



            {/* graphs */}
            <LeadAnalyticsChart leads={totalFreshLeads} />

            {/* New Status Chart */}
            <LeadStatusChart leads={totalFreshLeads} />

            {/* Add/Edit Modal */}
            <Modal show={isModalOpen && projects.length > 0} onClose={handleCloseModal} size="6xl">
                <Modal.Header>
                    {editingLead ? 'Change Lead Status' : 'Add New Lead'}
                </Modal.Header>
                <form onSubmit={handleSubmit}>
                    <Modal.Body className="max-h-[80vh] overflow-y-auto">
                        <div className="space-y-8">
                            {/* Basic Information Section */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                                <div className="flex items-center mb-6">
                                    <div className="bg-blue-100 dark:bg-blue-900/20 p-2 rounded-lg mr-3">
                                        <Icon icon="solar:user-line-duotone" className="text-blue-600 dark:text-blue-400 text-xl" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Basic Information</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" value="Full Name *" className="text-sm font-medium text-gray-700 dark:text-gray-300" />
                                        <TextInput
                                            autoComplete="off"
                                            id="name"
                                            type="text"
                                            placeholder="Enter full name..."
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                            className="w-full"
                                            disabled={!!editingLead}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email" value="Email Address" className="text-sm font-medium text-gray-700 dark:text-gray-300" />
                                        <TextInput
                                            autoComplete="off"
                                            id="email"
                                            type="email"
                                            placeholder="Enter email address..."
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full"
                                            disabled={!!editingLead}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone" value="Phone Number" className="text-sm font-medium text-gray-700 dark:text-gray-300" />
                                        <TextInput
                                            autoComplete="off"
                                            id="phone"
                                            type="tel"
                                            placeholder="Enter phone number..."
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full"
                                            disabled={!!editingLead}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Project Selection Section */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                                <div className="flex items-center mb-6">
                                    <div className="bg-purple-100 dark:bg-purple-900/20 p-2 rounded-lg mr-3">
                                        <Icon icon="solar:folder-line-duotone" className="text-purple-600 dark:text-purple-400 text-xl" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Project Selection</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Select the project for this lead
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="projectId" value="Project *" className="text-sm font-medium text-gray-700 dark:text-gray-300" />
                                        <Select
                                            id="projectId"
                                            value={formData.projectId}
                                            onChange={handleProjectChange}
                                            required
                                            className="w-full"
                                            disabled={!!editingLead}
                                        >
                                            <option value="">Select a project</option>
                                            {projects.map(project => (
                                                <option key={project._id} value={project._id}>
                                                    {project.name}
                                                </option>
                                            ))}
                                        </Select>
                                        {formData.projectId && (
                                            <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                                <Icon icon="solar:check-circle-line-duotone" className="w-3 h-3" />
                                                {(() => {
                                                    const selectedProject = projects.find(p => p._id === formData.projectId);
                                                    return selectedProject ? `Project: ${selectedProject.name}` : 'Project selected';
                                                })()}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>



                            {/* Lead Details Section */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                                <div className="flex items-center mb-6">
                                    <div className="bg-green-100 dark:bg-green-900/20 p-2 rounded-lg mr-3">
                                        <Icon icon="solar:chart-line-duotone" className="text-green-600 dark:text-green-400 text-xl" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Lead Details</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Status is automatically set to default and locked
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="source" value="Lead Source *" className="text-sm font-medium text-gray-700 dark:text-gray-300" />
                                        <Select
                                            id="source"
                                            value={formData.source}
                                            onChange={handleSourceChange}
                                            required
                                            className="w-full"
                                            disabled={!!editingLead}
                                        >
                                            console.log(leadSources)
                                            <option value="">Select lead source</option>
                                            {leadSources.map(source => (
                                                <option key={source._id} value={source._id}>

                                                    {source.name}
                                                </option>

                                            ))}
                                            {!leadSources.some(source => source.name.toLowerCase() === 'channel partner') && (
                                                <option value="channel-partner">Channel Partner</option>
                                            )}
                                        </Select>
                                        {(formData.source === 'channel-partner' ||
                                            leadSources.some(source => source._id === formData.source && source.name.toLowerCase() === 'channel partner')) && (
                                                <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                                    <Icon icon="solar:info-circle-line-duotone" className="w-3 h-3" />
                                                    Channel partner selected as lead source
                                                </p>
                                            )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="status" value="Lead Status *" className="text-sm font-medium text-gray-700 dark:text-gray-300" />
                                        <Select
                                            id="status"
                                            value={formData.status}
                                            onChange={(e) => handleStatusChange(e.target.value)}
                                            required
                                            className="w-full"
                                            disabled={!editingLead}
                                        >
                                            <option value="">Select lead status</option>
                                            {leadStatuses.map(status => (
                                                <option key={status._id} value={status._id}>
                                                    {status.name}
                                                </option>
                                            ))}
                                        </Select>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                            <Icon icon="solar:lock-line-duotone" className="w-3 h-3" />
                                            Status is automatically set to default and locked
                                        </p>
                                    </div>
                                </div>



                                {/* Channel Partner Fields - Only show when Channel Partner is selected as source */}
                                {((formData.source === 'channel-partner' ||
                                    leadSources.some(source => source._id === formData.source && source.name.toLowerCase() === 'channel partner')) && !editingLead) && (
                                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                                            <div className="flex items-center mb-6">
                                                <div className="bg-orange-100 dark:bg-orange-900/20 p-2 rounded-lg mr-3">
                                                    <Icon icon="solar:users-group-two-rounded-line-duotone" className="text-orange-600 dark:text-orange-400 text-xl" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Channel Partner Selection</h3>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        Select channel partner and CP sourcing user
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <Label htmlFor="channelPartner" value="Select Channel Partner *" className="text-sm font-medium text-gray-700 dark:text-gray-300" />
                                                    <Select
                                                        id="channelPartner"
                                                        value={formData.channelPartner}
                                                        onChange={handleChannelPartnerChange}
                                                        required
                                                        className="w-full"
                                                    >
                                                        <option value="">Select a channel partner</option>
                                                        {channelPartners.map(partner => (
                                                            <option key={partner._id} value={partner._id}>
                                                                {partner.name} - {partner.firmName} - {partner.phone}
                                                            </option>
                                                        ))}
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="channelPartnerSourcing" value="CP Sourcing User" className="text-sm font-medium text-gray-700 dark:text-gray-300" />
                                                    <Select
                                                        id="cpSourcingId"
                                                        value={formData.cpSourcingId}
                                                        onChange={(e) => {
                                                            console.log('CP Sourcing changed:', {
                                                                cpSourcingId: e.target.value,
                                                                previousCpSourcingId: formData.cpSourcingId
                                                            });
                                                            setFormData({ ...formData, cpSourcingId: e.target.value });
                                                        }}
                                                        className="w-full"
                                                        disabled={isLoadingCPSourcing || !formData.channelPartner || !formData.projectId}
                                                    >
                                                        <option value="">
                                                            {!formData.channelPartner || !formData.projectId
                                                                ? "Select channel partner and project first"
                                                                : isLoadingCPSourcing
                                                                    ? "Loading users..."
                                                                    : "Select CP sourcing user"
                                                            }
                                                        </option>
                                                        {cpSourcingOptions.map(user => (
                                                            <option key={user._id} value={user._id}>
                                                                {user.name} ({user.email})
                                                            </option>
                                                        ))}
                                                    </Select>
                                                    {isLoadingCPSourcing && (
                                                        <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                                            <Icon icon="solar:refresh-line-duotone" className="w-3 h-3 animate-spin" />
                                                            Loading users...
                                                        </p>
                                                    )}
                                                    {!isLoadingCPSourcing && cpSourcingOptions.length === 0 && formData.channelPartner && formData.projectId && (
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            No users found for this channel partner and project combination
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}


                            </div>

                            {/* Dynamic Fields based on selected status */}
                            {formData.status && getRequiredFieldsForStatus(formData.status).length > 0 && (
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-xl border border-blue-200 dark:border-blue-700 p-6">
                                    <div className="flex items-center mb-6">
                                        <div className="bg-blue-100 dark:bg-blue-900/20 p-2 rounded-lg mr-3">
                                            <Icon icon="solar:settings-line-duotone" className="text-blue-600 dark:text-blue-400 text-xl" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                                Additional Required Fields
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                for "{leadStatuses.find(s => s._id === formData.status)?.name}" Status
                                            </p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {getRequiredFieldsForStatus(formData.status)
                                            .filter(field => field.name && field.name.trim() !== '') // Filter out empty field names
                                            .map((field) => (
                                                <div key={field.name} className="space-y-2">
                                                    <Label
                                                        htmlFor={field.name}
                                                        value={`${field.name} ${field.required ? '*' : ''}`}
                                                        className="text-sm font-medium text-gray-700 dark:text-gray-300"
                                                    />
                                                    {field.type === 'text' ? (
                                                        <TextInput
                                                            id={field.name}
                                                            type="text"
                                                            placeholder={`Enter ${field.name.toLowerCase()}...`}
                                                            value={dynamicFields[field.name] || ''}
                                                            onChange={(e) => setDynamicFields(prev => ({ ...prev, [field.name]: e.target.value }))}
                                                            required={field.required}
                                                            className="w-full"
                                                        // disabled={!!editingLead}
                                                        />
                                                    ) : field.type === 'email' ? (
                                                        <TextInput
                                                            id={field.name}
                                                            type="email"
                                                            placeholder={`Enter ${field.name.toLowerCase()}...`}
                                                            value={dynamicFields[field.name] || ''}
                                                            onChange={(e) => setDynamicFields(prev => ({ ...prev, [field.name]: e.target.value }))}
                                                            required={field.required}
                                                            className="w-full"
                                                            disabled={!!editingLead}
                                                        />
                                                    ) : field.type === 'tel' || field.type === 'phone' ? (
                                                        <TextInput
                                                            id={field.name}
                                                            type="tel"
                                                            placeholder={`Enter ${field.name.toLowerCase()}...`}
                                                            value={dynamicFields[field.name] || ''}
                                                            onChange={(e) => setDynamicFields(prev => ({ ...prev, [field.name]: e.target.value }))}
                                                            required={field.required}
                                                            className="w-full"
                                                            disabled={!!editingLead}
                                                        />
                                                    ) : field.type === 'number' ? (
                                                        <TextInput
                                                            id={field.name}
                                                            type="number"
                                                            placeholder={`Enter ${field.name.toLowerCase()}...`}
                                                            value={dynamicFields[field.name] || ''}
                                                            onChange={(e) => setDynamicFields(prev => ({ ...prev, [field.name]: e.target.value }))}
                                                            required={field.required}
                                                            className="w-full"
                                                            disabled={!!editingLead}
                                                        />
                                                    ) : field.type === 'date' ? (
                                                        <TextInput
                                                            id={field.name}
                                                            type="date"
                                                            placeholder={`Enter ${field.name.toLowerCase()}...`}
                                                            value={dynamicFields[field.name] || ''}
                                                            onChange={(e) => setDynamicFields(prev => ({ ...prev, [field.name]: e.target.value }))}
                                                            required={field.required}
                                                            className="w-full"
                                                            disabled={(() => {
                                                                const currentStatus = leadStatuses.find(s => s._id === formData.status);
                                                                return currentStatus?.is_final_status === true;
                                                            })()}
                                                        />
                                                    ) : field.type === 'datetime' ? (
                                                        <DateTimePicker
                                                            id={field.name}
                                                            type="datetime"
                                                            value={dynamicFields[field.name] || ''}
                                                            onChange={(value) => setDynamicFields(prev => ({ ...prev, [field.name]: value }))}
                                                            placeholder={`Select ${field.name.toLowerCase()}...`}
                                                            className="w-full"
                                                            required={field.required}
                                                        />
                                                    ) : field.type === 'time' ? (
                                                        <DateTimePicker
                                                            id={field.name}
                                                            type="time"
                                                            value={dynamicFields[field.name] || ''}
                                                            onChange={(value) => setDynamicFields(prev => ({ ...prev, [field.name]: value }))}
                                                            placeholder={`Select ${field.name.toLowerCase()}...`}
                                                            className="w-full"
                                                            required={field.required}
                                                        />
                                                    ) : field.type === 'textarea' ? (
                                                        <Textarea
                                                            id={field.name}
                                                            placeholder={`Enter ${field.name.toLowerCase()}...`}
                                                            value={dynamicFields[field.name] || ''}
                                                            onChange={(e) => setDynamicFields(prev => ({ ...prev, [field.name]: e.target.value }))}
                                                            rows={3}
                                                            required={field.required}
                                                            className="w-full"
                                                            disabled={!!editingLead}
                                                        />
                                                    ) : field.type === 'select' && field.options && field.options.length > 0 ? (
                                                        <Select
                                                            id={field.name}
                                                            value={dynamicFields[field.name] || ''}
                                                            onChange={(e) => setDynamicFields(prev => ({ ...prev, [field.name]: e.target.value }))}
                                                            required={field.required}
                                                            className="w-full"
                                                            disabled={!!editingLead}
                                                        >
                                                            <option value="">Select {field.name}</option>
                                                            {field.options.map((option: string, index: number) => (
                                                                <option key={index} value={option}>
                                                                    {option}
                                                                </option>
                                                            ))}
                                                        </Select>
                                                    ) : field.type === 'checkbox' && field.options && field.options.length > 0 ? (
                                                        <div className="space-y-2">
                                                            {field.options.map((option: string, index: number) => {
                                                                const currentValues = dynamicFields[field.name] || [];
                                                                const isChecked = Array.isArray(currentValues)
                                                                    ? currentValues.includes(option)
                                                                    : currentValues === option;

                                                                return (
                                                                    <div key={index} className="flex items-center">
                                                                        <input
                                                                            type="checkbox"
                                                                            id={`${field.name}_${index}`}
                                                                            checked={isChecked}
                                                                            onChange={(e) => {
                                                                                const currentValues = dynamicFields[field.name] || [];
                                                                                let newValues;

                                                                                if (Array.isArray(currentValues)) {
                                                                                    if (e.target.checked) {
                                                                                        newValues = [...currentValues, option];
                                                                                    } else {
                                                                                        newValues = currentValues.filter((v: string) => v !== option);
                                                                                    }
                                                                                } else {
                                                                                    newValues = e.target.checked ? [option] : [];
                                                                                }

                                                                                setDynamicFields(prev => ({ ...prev, [field.name]: newValues }));
                                                                            }}
                                                                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                                                            disabled={!!editingLead}
                                                                        />
                                                                        <label htmlFor={`${field.name}_${index}`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                                                            {option}
                                                                        </label>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <TextInput
                                                            id={field.name}
                                                            type="text"
                                                            placeholder={`Enter ${field.name.toLowerCase()}...`}
                                                            value={dynamicFields[field.name] || ''}
                                                            onChange={(e) => setDynamicFields(prev => ({ ...prev, [field.name]: e.target.value }))}
                                                            required={field.required}
                                                            className="w-full"
                                                        // disabled={!!editingLead}
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}

                            {/* Additional Lead Information */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                                <div className="flex items-center mb-6">
                                    <div className="bg-indigo-100 dark:bg-indigo-900/20 p-2 rounded-lg mr-3">
                                        <Icon icon="solar:settings-line-duotone" className="text-indigo-600 dark:text-indigo-400 text-xl" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Additional Lead Information</h3>
                                </div>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="leadPriority" value="Lead Priority *" className="text-sm font-medium text-gray-700 dark:text-gray-300" />
                                            <Select
                                                id="leadPriority"
                                                value={formData.leadPriority}
                                                onChange={(e) => setFormData({ ...formData, leadPriority: e.target.value })}
                                                className="w-full"
                                                required
                                                disabled={!!editingLead}
                                            >
                                                <option value="">Select Priority</option>
                                                <option value="Hot">Hot</option>
                                                <option value="Cold">Cold</option>
                                                <option value="Warm">Warm</option>

                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="propertyType" value="Property Type *" className="text-sm font-medium text-gray-700 dark:text-gray-300" />
                                            <Select
                                                id="propertyType"
                                                value={formData.propertyType}
                                                onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                                                className="w-full"
                                                required
                                                disabled={!!editingLead}
                                            >
                                                <option value="">Select Property Type</option>
                                                <option value="residential">Residential</option>


                                                <option value="Commercial">Commercial</option>

                                            </Select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="configuration" value="Configuration *" className="text-sm font-medium text-gray-700 dark:text-gray-300" />
                                            <Select
                                                id="configuration"
                                                value={formData.configuration}
                                                onChange={(e) => setFormData({ ...formData, configuration: e.target.value })}
                                                className="w-full"
                                                required
                                                disabled={!!editingLead}
                                            >
                                                <option value="">Select Configuration</option>
                                                <option value="1 BHK">1 BHK</option>
                                                <option value="2 BHK">2 BHK</option>
                                                <option value="3 BHK">3 BHK</option>
                                                <option value="2+1 BHK">2+1 BHK</option>
                                                <option value="2+2 BHK">2+2 BHK</option>
                                                <option value="commercial office">Commercial Office</option>
                                                <option value="unknown">Unknown</option>

                                                <option value="Duplex">Duplex</option>

                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="fundingMode" value="Funding Mode *" className="text-sm font-medium text-gray-700 dark:text-gray-300" />
                                            <Select
                                                id="fundingMode"
                                                value={formData.fundingMode}
                                                onChange={(e) => setFormData({ ...formData, fundingMode: e.target.value })}
                                                className="w-full"
                                                required
                                                disabled={!!editingLead}
                                            >
                                                <option value="">Select Funding Mode</option>
                                                <option value="Self Funded">Self Funded</option>
                                                <option value="sale out property">Sale Out Property</option>
                                                <option value="loan">Loan</option>
                                                <option value="self loan">Self Loan</option>


                                            </Select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="gender" value="Gender *" className="text-sm font-medium text-gray-700 dark:text-gray-300" />
                                            <Select
                                                id="gender"
                                                value={formData.gender}
                                                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                                className="w-full"
                                                required
                                                disabled={!!editingLead}
                                            >
                                                <option value="">Select Gender</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>

                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="budget" value="Budget *" className="text-sm font-medium text-gray-700 dark:text-gray-300" />
                                            <Select
                                                id="budget"
                                                value={formData.budget}
                                                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                                                className="w-full"
                                                required
                                                disabled={!!editingLead}
                                            >
                                                <option value="">Select Budget Range</option>
                                                <option value="25-50 Lakhs">25-50 Lakhs</option>
                                                <option value="50 Lakhs - 1 Crore">50 Lakhs - 1 Crore</option>
                                                <option value="1-2 Crores">1-2 Crores</option>
                                                <option value="2-5 Crores">2-5 Crores</option>
                                                <option value="Above 5 Crores">Above 5 Crores</option>
                                                <option value="Not Specified">Not Specified</option>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Notes Section */}
                            {formData.status !== (leadStatuses.find(s => s.name.toLowerCase() === 'new')?._id || '') && (
                                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                                    <div className="flex items-center mb-6">
                                        <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-lg mr-3">
                                            <Icon icon="solar:notes-line-duotone" className="text-gray-600 dark:text-gray-400 text-xl" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Additional Notes</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Add any additional information about this lead
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="notes" value="Notes" className="text-sm font-medium text-gray-700 dark:text-gray-300" />
                                        <Textarea
                                            id="notes"
                                            placeholder="Enter any additional notes about this lead..."
                                            value={formData.notes}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            rows={4}
                                            className="w-full"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </Modal.Body>
                    <Modal.Footer className="flex flex-col sm:flex-row gap-2">
                        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                            {isSubmitting ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                                <Icon icon="solar:check-circle-line-duotone" className="mr-2" />
                            )}
                            {editingLead ? 'Update' : 'Create'}
                        </Button>
                        <Button color="gray" onClick={handleCloseModal} className="w-full sm:w-auto">
                            Cancel
                        </Button>
                    </Modal.Footer>
                </form>
            </Modal>


            {/* Search and Filters */}
            <Card>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-9 gap-3 lg:gap-4">
                    <div>
                        <TextInput
                            placeholder="Search leads..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            icon={() => <Icon icon="solar:magnifer-line-duotone" className="text-gray-400" />}
                            disabled={projects.length === 0}
                        />
                    </div>
                    <div>
                        <Select
                            value="all"
                            disabled={true}
                            title="Project filter disabled - viewing all leads"
                        >
                            <option value="all">All Projects</option>
                        </Select>
                        <p className="text-sm text-gray-500 mt-1">
                            Viewing leads from all projects
                        </p>
                    </div>
                    <div>
                        <Select
                            value={filterSource}
                            onChange={(e) => setFilterSource(e.target.value)}
                            disabled={projects.length === 0}
                        >
                            <option value="all">All Sources</option>
                            {leadSources.map(source => (
                                <option key={source._id} value={source._id}>
                                    {source.name}
                                </option>
                            ))}
                        </Select>
                    </div>

                    <div>
                        <Select
                            value={filterUser}
                            onChange={(e) => setFilterUser(e.target.value)}
                            disabled={projects.length === 0}
                        >
                            <option value="all">All Users</option>
                            <option value="unassigned">Unassigned</option>
                            {users.map(user => (
                                <option key={user._id} value={user._id}>
                                    {user.name} ({user.email})
                                </option>
                            ))}
                        </Select>
                    </div>
                    <div>
                        <TextInput
                            type="date"
                            value={filterDateFrom}
                            onChange={(e) => setFilterDateFrom(e.target.value)}
                            placeholder="From Date"
                            disabled={projects.length === 0}
                        />
                        <p className="text-sm text-gray-500 mt-1">From Date</p>
                    </div>
                    <div>
                        <TextInput
                            type="date"
                            value={filterDateTo}
                            onChange={(e) => setFilterDateTo(e.target.value)}
                            placeholder="To Date"
                            disabled={projects.length === 0}
                        />
                        <p className="text-sm text-gray-500 mt-1">To Date</p>
                    </div>
                    <div>
                        <Select
                            value={datePreset}
                            onChange={(e) => handleDatePresetChange(e.target.value)}
                            disabled={projects.length === 0}
                        >
                            <option value="custom">Custom Range</option>
                            <option value="today">Today</option>
                            <option value="yesterday">Yesterday</option>
                            <option value="thisWeek">This Week</option>
                            <option value="lastWeek">Last Week</option>
                            <option value="thisMonth">This Month</option>
                            <option value="lastMonth">Last Month</option>
                            <option value="clear">Clear All</option>
                        </Select>
                        <p className="text-sm text-gray-500 mt-1">Quick Filters</p>
                    </div>
                    <div>
                        <Button
                            color="gray"
                            onClick={() => {
                                setFilterDateFrom("");
                                setFilterDateTo("");
                                setDatePreset("custom");
                            }}
                            disabled={projects.length === 0}
                            className="w-full"
                        >
                            <Icon icon="solar:refresh-line-duotone" className="mr-2" />
                            Clear Dates
                        </Button>
                    </div>
                    <div>
                        <Button
                            color="gray"
                            onClick={() => {
                                setSearchTerm("");
                                setFilterSource("all");
                                setFilterStatus("all");
                                setFilterUser("all");
                                setFilterDateFrom("");
                                setFilterDateTo("");
                                setDatePreset("custom");
                            }}
                            disabled={projects.length === 0}
                            className="w-full"
                        >
                            <Icon icon="solar:refresh-line-duotone" className="mr-2" />
                            Clear All
                        </Button>
                    </div>
                    <div className="flex items-center">
                        <Badge color="info" size="lg">
                            {filteredLeads.length} Lead{filteredLeads.length !== 1 ? 's' : ''}
                        </Badge>
                    </div>
                </div>
            </Card>

            {/* Leads Table with Tabs */}
            {/* Leads Table */}
            {projects.length > 0 ? (
                <Card>
                    {isLoadingLeads ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                            <p className="text-gray-500 dark:text-gray-400">Loading leads...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <Table.Head>
                                    {/* <Table.HeadCell className="min-w-[50px]">
                                        <input
                                            type="checkbox"
                                            checked={allCurrentSelected}
                                            onChange={() => {
                                                if (allCurrentSelected) {
                                                    setSelectedLeads(prev => prev.filter(id => !currentPageLeadIds.includes(id)));
                                                } else {
                                                    setSelectedLeads(prev => Array.from(new Set([...prev, ...currentPageLeadIds])));
                                                }
                                            }}
                                            className="rounded border-gray-300"
                                        />
                                    </Table.HeadCell> */}
                                    <Table.HeadCell className="min-w-[120px]">Name</Table.HeadCell>
                                    <Table.HeadCell className="min-w-[150px]">Contact</Table.HeadCell>
                                    <Table.HeadCell className="min-w-[100px]">Source</Table.HeadCell>
                                    <Table.HeadCell className="min-w-[100px]">Status</Table.HeadCell>
                                    <Table.HeadCell className="min-w-[100px]">Project</Table.HeadCell>
                                    <Table.HeadCell className="min-w-[140px]">Assigned To</Table.HeadCell>
                                    <Table.HeadCell className="min-w-[100px]">Created</Table.HeadCell>
                                    <Table.HeadCell className="min-w-[150px]">Actions</Table.HeadCell>
                                </Table.Head>
                                <Table.Body className="divide-y">
                                    {filteredLeads.length === 0 ? (
                                        <Table.Row>
                                            <Table.Cell colSpan={9} className="text-center py-8">
                                                <div className="text-gray-500 dark:text-gray-400">
                                                    <Icon icon="solar:info-circle-line-duotone" className="mx-auto text-4xl mb-2" />
                                                    <p>No leads found</p>
                                                    <p className="text-sm">
                                                        {filteredLeads.length === 0
                                                            ? "No leads available in the system"
                                                            : "No leads match your current filters"
                                                        }
                                                    </p>
                                                </div>
                                            </Table.Cell>
                                        </Table.Row>
                                    ) : (
                                        filteredLeads.map((lead) => (
                                            <Table.Row
                                                key={lead._id}
                                                className={`bg-white dark:border-gray-700 dark:bg-gray-800 
                                                    ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700'
                                                    : ''
                                                    }`}
                                            >
                                                {/* <Table.Cell>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedLeads.includes(lead._id)}
                                                        onChange={() => handleSelectLead(lead._id)}
                                                        className="rounded border-gray-300"
                                                    />
                                                </Table.Cell> */}
                                                <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                                                    <button
                                                        onClick={() => router.push(`/apps/leads/${lead._id}`)}
                                                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline transition-colors"
                                                    >
                                                        {lead.name || 'N/A'}
                                                    </button>
                                                </Table.Cell>
                                                <Table.Cell>
                                                    <div className="text-sm">
                                                        <div>{lead.email || 'N/A'}</div>
                                                        <div className="text-gray-500 dark:text-gray-400">{lead.phone || 'N/A'}</div>
                                                    </div>
                                                </Table.Cell>
                                                <Table.Cell>
                                                    <div className="space-y-1">
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {lead.source || 'N/A'}
                                                        </div>
                                                        {/* {(lead.cpSourcingId || lead.customData?.["Channel Partner Sourcing"]) && (
                                         <div className="text-xs text-gray-500 dark:text-gray-400">
                                           <span className="font-medium">CP User:</span> {(() => {
                                             const cpRef = lead.cpSourcingId || lead.customData?.["Channel Partner Sourcing"];
           
                                             // Check if it's an object with userId.name (new format)
                                             if (typeof cpRef === 'object' && cpRef && cpRef.userId && cpRef.userId.name) {
                                               return cpRef.userId.name;
                                             }
           
                                             // Try multiple shapes: object with user, object with _id, plain userId, plain _id
                                             const refId = typeof cpRef === 'object' && cpRef
                                               ? (cpRef.user?._id || cpRef._id)
                                               : cpRef;
                                             // Attempt lookups by _id first
                                             let cpUser = Array.isArray(cpSourcingOptions) ? cpSourcingOptions.find(u => u._id === refId) : null;
                                             // Fallback: if we have userId separate
                                             if (!cpUser && Array.isArray(cpSourcingOptions)) {
                                               cpUser = cpSourcingOptions.find(u => u.userId === refId);
                                             }
                                             return cpUser ? `${cpUser.name} (${cpUser.email})` : 'N/A';
                                           })()}
                                         </div>
                                       )} */}
                                                    </div>
                                                </Table.Cell>
                                                <Table.Cell>
                                                    <Badge color="green" size="sm">
                                                        {lead.currentStatus?.name || 'N/A'}
                                                    </Badge>
                                                </Table.Cell>
                                                <Table.Cell>
                                                    <Badge color="purple" size="sm">
                                                        {lead.projectName || 'N/A'}
                                                    </Badge>
                                                </Table.Cell>
                                                <Table.Cell>
                                                    <div className="text-sm">
                                                        <div className="font-medium text-gray-900 dark:text-white">
                                                            {lead.user?.name && lead.user.name !== 'N/A' ? lead.user.name : 'Unassigned'}
                                                        </div>
                                                        <div className="text-gray-500 dark:text-gray-400 text-xs">
                                                            {lead.user?.email && lead.user.email !== 'N/A' ? lead.user.email : ''}
                                                        </div>
                                                        {lead.user?.role && lead.user.role !== 'N/A' && (
                                                            <div className="mt-1">
                                                                <Badge color="blue" size="xs">
                                                                    {lead.user.role}
                                                                </Badge>
                                                            </div>
                                                        )}
                                                    </div>
                                                </Table.Cell>
                                                <Table.Cell className="whitespace-nowrap text-gray-500 dark:text-gray-400">
                                                    {lead.createdAt ? (
                                                        <span className="font-medium text-gray-900 dark:text-white">
                                                            {new Date(lead.createdAt).toLocaleDateString('en-US', {
                                                                day: '2-digit',
                                                                month: 'short',
                                                                year: 'numeric'
                                                            })}
                                                        </span>
                                                    ) : 'N/A'}
                                                </Table.Cell>
                                                <Table.Cell>
                                                    <div className="flex flex-col sm:flex-row gap-2">
                                                        <Button
                                                            size="xs"
                                                            color="primary"
                                                            onClick={() => router.push(`/apps/leads/${lead._id}`)}
                                                            className="text-xs"
                                                        >
                                                            <Icon icon="solar:eye-line-duotone" className="mr-1" />
                                                            <span className="hidden sm:inline">View</span>
                                                        </Button>
                                                        {finalPermissions.canUpdateLeads && (
                                                            <Button
                                                                size="xs"
                                                                color="info"
                                                                onClick={() => handleEdit(lead)}
                                                                className="text-xs"
                                                                disabled={finalPermissions.permissionsLoading}
                                                            >
                                                                <Icon icon="solar:pen-line-duotone" className="mr-1" />
                                                                <span className="hidden sm:inline">change status</span>
                                                            </Button>
                                                        )}
                                                        {finalPermissions.canDeleteLeads && (
                                                            <Button
                                                                size="xs"
                                                                color="failure"
                                                                onClick={() => handleDelete(lead._id)}
                                                                className="text-xs"
                                                                disabled={finalPermissions.permissionsLoading}
                                                            >
                                                                <Icon icon="solar:trash-bin-trash-line-duotone" className="mr-1" />
                                                                <span className="hidden sm:inline">Delete</span>
                                                            </Button>
                                                        )}
                                                        {!finalPermissions.canUpdateLeads && !finalPermissions.canDeleteLeads && (
                                                            <Badge color="gray" size="sm">
                                                                View Only
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </Table.Cell>
                                            </Table.Row>
                                        ))
                                    )}
                                </Table.Body>
                            </Table>
                        </div>
                    )}

                    {/* Pagination Footer */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 pb-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            Showing {serverTotalItems != null ? (paginatedLeads.length > 0 ? startIndex + 1 : 0) : Math.min(startIndex + 1, clientTotalItems)}-
                            {serverTotalItems != null ? Math.min(endIndex, totalItems) : Math.min(endIndex, clientTotalItems)} of {totalItems} lead{totalItems !== 1 ? 's' : ''}
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Rows per page:</span>
                                <Select value={String(pageSize)} onChange={(e) => setPageSize(parseInt(e.target.value, 10))}>
                                    <option value="10">10</option>
                                    <option value="20">20</option>
                                    <option value="50">50</option>
                                    <option value="100">100</option>
                                </Select>
                            </div>
                            <Pagination
                                currentPage={displayedPage}
                                totalPages={totalPages}
                                onPageChange={(page) => setCurrentPage(page)}
                                showIcons
                            />
                        </div>
                    </div>
                </Card>
            ) : (
                <Card>
                    <div className="text-center py-8">
                        <div className="text-gray-500 dark:text-gray-400">
                            <Icon icon="solar:info-circle-line-duotone" className="mx-auto text-4xl mb-4" />
                            <p className="text-lg font-medium mb-2">No Projects Available</p>
                            <p className="text-sm mb-4">
                                You need to create at least one project before you can view or manage leads.
                            </p>
                            <Button color="primary" onClick={() => window.location.href = '/projects'}>
                                <Icon icon="solar:add-circle-line-duotone" className="mr-2" />
                                Create Project
                            </Button>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default FreshLeadsPage;
