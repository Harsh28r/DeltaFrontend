"use client";
import React, { useState, useEffect, useMemo, Suspense } from "react";
import { Card, Table, Badge, Button, Alert, Pagination, Select } from "flowbite-react";
import { Icon } from "@iconify/react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { API_ENDPOINTS } from "@/lib/config";
import { PERMISSIONS } from "@/app/types/permissions";
import { usePermissions } from "@/app/context/PermissionContext";

interface LeadStatus {
    _id: string;
    name: string;
    is_site_visit_done?: boolean;
    is_final_status?: boolean;
}

// Re-using interfaces from the main leads page for consistency


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


const FilteredLeadsComponent = () => {
    const { token } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { hasPermission } = usePermissions();

    const [leads, setLeads] = useState<Lead[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
    const [siteVisitStatusId, setSiteVisitStatusId] = useState<string | null>(null);
    const [bookingStatusId, setBookingStatusId] = useState<string | null>(null);



    const canReadLeads = hasPermission(PERMISSIONS.LEADS_READ);

    useEffect(() => {
        const fetchLeads = async () => {
            if (!token) return;

            // Fetch statuses first to get dynamic IDs
            try {
                const statusResponse = await fetch(API_ENDPOINTS.LEAD_STATUSES, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (statusResponse.ok) {
                    const statuses: LeadStatus[] = await statusResponse.json();
                    const siteVisitStatus = statuses.find(s => s.is_site_visit_done);
                    const bookingStatus = statuses.find(s => s.is_final_status);
                    if (siteVisitStatus) setSiteVisitStatusId(siteVisitStatus._id);
                    if (bookingStatus) setBookingStatusId(bookingStatus._id);
                } else {
                    setAlertMessage({ type: 'error', message: 'Failed to fetch lead statuses.' });
                }
            } catch (error) {
                console.error("Error fetching lead statuses:", error);
                setAlertMessage({ type: 'error', message: 'Network error while fetching statuses.' });
            }


            setIsLoading(true);


            try {
                const response = await fetch(API_ENDPOINTS.LEAD_DATA(), {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (response.ok) {
                    const data = await response.json();
                    const allLeads = data.leads || [];
                    // Log all fetched leads before filtering, as requested.
                    console.log("All leads:", allLeads);
                    setLeads(allLeads);
                    console.log('allLeads', allLeads);


                    // Check if data is a valid array before filtering
                    if (!Array.isArray(allLeads)) {
                        console.error("Fetched leads data is not an array:", allLeads);
                        setAlertMessage({ type: 'error', message: 'Received invalid data format for leads.' });
                        setLeads([]);
                        return;
                    }


                } else {
                    const errorData = await response.json();
                    setAlertMessage({ type: 'error', message: errorData.message || 'Failed to fetch leads.' });
                }
            } catch (error) {
                console.error("Error fetching leads:", error);
                setAlertMessage({ type: 'error', message: 'Network error while fetching leads.' });
            } finally {
                setIsLoading(false);
            }
        };

        fetchLeads();
    }, [token, searchParams]);

    const transformLeadData = (leadsData: any[]): Lead[] => {
        return leadsData.map(lead => ({
            ...lead,
            name: lead.customData?.["First Name"] || lead.customData?.name || 'N/A',
            email: lead.customData?.["Email"] || lead.customData?.email || 'N/A',
            phone: lead.customData?.["Phone"] || lead.customData?.phone || lead.customData?.contact || 'N/A',
            source: lead.leadSource?.name || 'N/A', // This is correct for display
            status: lead.currentStatus?.name || 'N/A', // This is correct for display
            projectName: lead.project?.name || 'N/A',
        }));
    };



    const filteredLeads = useMemo(() => {
        const statusId = searchParams.get('statusId');
        const projectId = searchParams.get('projectId');
        const userId = searchParams.get('userId');
        const filter = searchParams.get('filter');

        // Handle date range from analytics page
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');
        let startDate: Date | null = startDateParam ? new Date(startDateParam) : null;
        let endDate: Date | null = endDateParam ? new Date(endDateParam) : null;

        // Handle month/year from other pages
        if (!startDate && !endDate) {
            const year = Number(searchParams.get('year'));
            const month = Number(searchParams.get('month'));
            if (!isNaN(year) && year > 0 && !isNaN(month) && month > 0) {
                startDate = new Date(year, month - 1, 1);
                endDate = new Date(year, month, 0, 23, 59, 59);
            }
        }

        if (filter && startDate && endDate && (siteVisitStatusId || bookingStatusId)) {
            const filtered = leads.filter(lead => {
                const projectMatch = !projectId || lead.project?._id === projectId;
                if (!projectMatch) return false;

                let targetStatusIds: string[] = [];
                if (filter === 'siteVisits' && siteVisitStatusId) {
                    targetStatusIds = [siteVisitStatusId];
                } else if (filter === 'bookings' && bookingStatusId) {
                    targetStatusIds = [bookingStatusId];
                } else if (filter === 'projectImpact') {
                    if (siteVisitStatusId) targetStatusIds.push(siteVisitStatusId);
                    if (bookingStatusId) targetStatusIds.push(bookingStatusId);
                }

                // For "bookings", only check currentStatus and its history entry for the date.
                if (filter === 'bookings' && bookingStatusId) {
                    const isCurrentlyBooked = lead.currentStatus?._id === bookingStatusId;
                    if (!isCurrentlyBooked) return false;

                    const lastStatusChange = lead.statusHistory[lead.statusHistory.length - 1];
                    if (lastStatusChange && lastStatusChange.status?._id === bookingStatusId) {
                        const changedDate = new Date(lastStatusChange.changedAt);
                        return changedDate >= startDate! && changedDate <= endDate!;
                    }
                }

                // For "siteVisits" and "projectImpact", check both creation and history.
                const isCreatedWithStatus = lead.currentStatus?._id && targetStatusIds.includes(lead.currentStatus._id) &&
                    new Date(lead.createdAt) >= startDate! &&
                    new Date(lead.createdAt) <= endDate!;
                if (isCreatedWithStatus) return true;

                const hasStatusInHistory = lead.statusHistory.some((historyItem: any) => {
                    const historyDate = new Date(historyItem.changedAt);
                    return targetStatusIds.includes(historyItem.status?._id) &&
                        historyDate >= startDate! &&
                        historyDate <= endDate!;
                });
                return hasStatusInHistory;
            });
            return transformLeadData(filtered);
        }

        // Fallback to original filtering logic if filter is not present
        if (!statusId && !projectId && !userId && !startDate) {
            return transformLeadData(leads);
        }

        const filtered = leads.filter(lead => {
            const statusMatch = !statusId || lead.currentStatus?._id === statusId;
            const projectMatch = !projectId || lead.project?._id === projectId;
            const userMatch = !userId || lead.user?._id === userId;



            return statusMatch && projectMatch && userMatch ;
        });

        return transformLeadData(filtered);
    }, [leads, searchParams, siteVisitStatusId, bookingStatusId]);




    if (!canReadLeads) {
        return <Alert color="failure">You do not have permission to view leads.</Alert>;
    }

    return (
        <Card>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                    <Button color="gray" size="sm" onClick={() => router.push('/dashboards/analytics')}>
                        <Icon icon="solar:arrow-left-line-duotone" className="mr-2 h-5 w-5" />
                        Back to Analytics
                    </Button>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Filtered Leads</h1>
                </div>
                <Badge color="info">{filteredLeads.length} Leads</Badge>
            </div>
            {alertMessage && <Alert color={alertMessage.type} onDismiss={() => setAlertMessage(null)}>{alertMessage.message}</Alert>}

            <div className="overflow-x-auto">
                <Table hoverable>
                    <Table.Head>
                        <Table.HeadCell>Name</Table.HeadCell>
                        <Table.HeadCell>Contact</Table.HeadCell>
                        <Table.HeadCell>Source</Table.HeadCell>
                        <Table.HeadCell>Status</Table.HeadCell>
                        <Table.HeadCell>Project</Table.HeadCell>
                        <Table.HeadCell>Assigned To</Table.HeadCell>
                    </Table.Head>
                    <Table.Body className="divide-y">
                        {isLoading ? (
                            <Table.Row><Table.Cell colSpan={7} className="text-center">Loading...</Table.Cell></Table.Row>
                        ) : filteredLeads.length === 0 ? (
                            <Table.Row><Table.Cell colSpan={7} className="text-center">No leads found for the selected filters.</Table.Cell></Table.Row>
                        ) : (
                            filteredLeads.map((lead) => (
                                <Table.Row key={lead._id} className="bg-white dark:border-gray-700 dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer" onClick={() => router.push(`/apps/leads/${lead._id}`)}>
                                    <Table.Cell className="font-medium text-gray-900 dark:text-white">{lead.name}</Table.Cell>
                                    <Table.Cell>{lead.email}<br />{lead.phone}</Table.Cell>
                                    <Table.Cell>{lead.source}</Table.Cell>
                                    <Table.Cell><Badge color="green">{lead.status}</Badge></Table.Cell>
                                    <Table.Cell><Badge color="purple">{lead.projectName}</Badge></Table.Cell>
                                    <Table.Cell>{lead.user?.name || 'Unassigned'}</Table.Cell>
                                </Table.Row>
                            ))
                        )}
                    </Table.Body>
                </Table>
            </div>


        </Card>
    );
};

const FilteredLeadsViewPage = () => (
    <Suspense fallback={<div>Loading...</div>}>
        <FilteredLeadsComponent />
    </Suspense>
);

export default FilteredLeadsViewPage;
