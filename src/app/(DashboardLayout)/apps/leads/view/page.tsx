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
    const [siteVisitStatusIds, setSiteVisitStatusIds] = useState<string[]>([]);
    const [bookingStatusIds, setBookingStatusIds] = useState<string[]>([]);



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
                    const siteVisitStatuses = statuses.filter(s => s.is_site_visit_done);
                    const finalStatuses = statuses.filter(s => s.is_final_status);

                    if (siteVisitStatuses.length) {
                        setSiteVisitStatusIds(siteVisitStatuses.map(status => status._id));
                    }
                    if (finalStatuses.length) {
                        setBookingStatusIds(finalStatuses.map(status => status._id));
                    }
                } else {
                    setAlertMessage({ type: 'error', message: 'Failed to fetch lead statuses.' });
                }
            } catch (error) {
                console.error("Error fetching lead statuses:", error);
                setAlertMessage({ type: 'error', message: 'Network error while fetching statuses.' });
            }


            setIsLoading(true);


            try {
                const url = new URL(API_ENDPOINTS.LEAD_DATA());

                const statusIdParam = searchParams.get('statusId');
                const projectIdParam = searchParams.get('projectId');
                const userIdParam = searchParams.get('userId');
                const startDateParam = searchParams.get('startDate');
                const endDateParam = searchParams.get('endDate');
                const leadTypeParam = searchParams.get('leadType');

                url.searchParams.set('all', 'true');

                if (statusIdParam && statusIdParam !== 'all') {
                    url.searchParams.set('statusId', statusIdParam);
                }

                if (projectIdParam && projectIdParam !== 'all') {
                    url.searchParams.set('projectId', projectIdParam);
                }

                if (userIdParam && userIdParam !== 'all') {
                    url.searchParams.set('userId', userIdParam);
                }

                if (startDateParam) {
                    url.searchParams.set('startDate', startDateParam);
                }

                if (endDateParam) {
                    url.searchParams.set('endDate', endDateParam);
                }

                if (leadTypeParam && leadTypeParam !== 'all') {
                    url.searchParams.set('leadType', leadTypeParam);
                }

                const response = await fetch(url.toString(), {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (response.ok) {
                    const data = await response.json();
                    const allLeads = data.leads || [];
                    // Log all fetched leads before filtering, as requested.
                    setLeads(allLeads);


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
        const normalizeId = (value: any): string | null => {
            if (!value) return null;
            if (typeof value === 'string') return value;
            if (typeof value === 'object') {
                if (typeof value._id === 'string') return value._id;
                if (value instanceof Date) return value.toISOString();
                if (typeof value.toString === 'function') {
                    const str = value.toString();
                    return str === '[object Object]' ? null : str;
                }
            }
            return null;
        };

        const extractTimestamp = (value: any): number | null => {
            if (!value) return null;
            const date = value instanceof Date ? value : new Date(value);
            const time = date.getTime();
            return Number.isNaN(time) ? null : time;
        };

        const statusId = searchParams.get('statusId');
        const projectId = searchParams.get('projectId');
        const userId = searchParams.get('userId');
        const filter = searchParams.get('filter');
        const statusIdsParam = searchParams.get('statusIds');

        const effectiveSiteVisitIds = statusIdsParam
            ? statusIdsParam.split(',').map(id => id.trim()).filter(Boolean)
            : siteVisitStatusIds;

        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');
        let startDate = startDateParam ? new Date(startDateParam).toISOString() : null;
        let endDate = endDateParam ? new Date(endDateParam).toISOString() : null;

        if (!startDate && !endDate) {
            const year = Number(searchParams.get('year'));
            const month = Number(searchParams.get('month'));
            if (!isNaN(year) && year > 0 && !isNaN(month) && month > 0) {
                startDate = new Date(year, month - 1, 1).toISOString();
                endDate = new Date(year, month, 0, 23, 59, 59).toISOString();
            }
        }

        const startTimestamp = startDate ? extractTimestamp(startDate) : null;
        const endTimestamp = endDate ? extractTimestamp(endDate) : null;
        const hasDateRange = startTimestamp !== null || endTimestamp !== null;

        const isWithinRange = (timestamp: number | null): boolean => {
            if (timestamp === null) return false;
            if (startTimestamp !== null && timestamp < startTimestamp) return false;
            if (endTimestamp !== null && timestamp > endTimestamp) return false;
            return true;
        };

        const enrichedLeads = leads.map(lead => {
            const statusHistory = Array.isArray(lead.statusHistory) ? lead.statusHistory : [];

            const finalStatusEvents = bookingStatusIds.length
                ? statusHistory.filter((historyItem: any) => {
                    const historyStatusId = normalizeId(historyItem?.status);
                    return historyStatusId ? bookingStatusIds.includes(historyStatusId) : false;
                })
                : [];

            const siteVisitEvents = effectiveSiteVisitIds.length
                ? statusHistory.filter((historyItem: any) => {
                    const historyStatusId = normalizeId(historyItem?.status);
                    return historyStatusId ? effectiveSiteVisitIds.includes(historyStatusId) : false;
                })
                : [];

            const latestBookingAt = finalStatusEvents.reduce<number | null>((latest, event: any) => {
                const eventTimestamp = extractTimestamp(event?.changedAt);
                if (eventTimestamp === null) return latest;
                return latest === null || eventTimestamp > latest ? eventTimestamp : latest;
            }, null);

            const latestSiteVisitAt = siteVisitEvents.reduce<number | null>((latest, event: any) => {
                const eventTimestamp = extractTimestamp(event?.changedAt);
                if (eventTimestamp === null) return latest;
                return latest === null || eventTimestamp > latest ? eventTimestamp : latest;
            }, null);

            const currentStatusId = normalizeId(lead.currentStatus?._id ?? lead.currentStatus);
            const fallbackUpdatedAt = extractTimestamp(lead.updatedAt);
            const hasFinalStatus = bookingStatusIds.length
                ? (currentStatusId ? bookingStatusIds.includes(currentStatusId) : false)
                : false;
            const hasSiteVisitStatus = effectiveSiteVisitIds.length
                ? (currentStatusId ? effectiveSiteVisitIds.includes(currentStatusId) : false)
                : false;
            const hasSiteVisitFlag =
                lead.customData?.is_site_visit_done === true ||
                lead.customData?.is_site_visit_done === 'true' ||
                lead.customData?.siteVisitDone === true ||
                lead.customData?.siteVisitDone === 'true' ||
                lead.customData?.site_visit_done === true ||
                lead.customData?.site_visit_done === 'true';

            const bookingTimestamp = latestBookingAt ?? (hasFinalStatus && fallbackUpdatedAt ? fallbackUpdatedAt : null);
            const siteVisitEligible = siteVisitEvents.length > 0 || hasSiteVisitStatus || hasSiteVisitFlag;
            const siteVisitTimestamp = latestSiteVisitAt ?? (siteVisitEligible && fallbackUpdatedAt ? fallbackUpdatedAt : null);

            return {
                ...lead,
                latestBookingAt: bookingTimestamp,
                latestSiteVisitAt: siteVisitTimestamp,
                hasFinalStatus,
                hasSiteVisitHistory: siteVisitEvents.length > 0,
                hasSiteVisitStatus,
                hasSiteVisitFlag,
                siteVisitEligible,
            };
        });

        if (filter) {
            const filtered = enrichedLeads.filter(lead => {
                const projectMatch = !projectId || lead.project?._id === projectId;
                if (!projectMatch) return false;

                if (filter === 'bookings') {
                    if (!lead.hasFinalStatus) return false;
                    if (hasDateRange) {
                        if (!lead.latestBookingAt) return false;
                        return isWithinRange(lead.latestBookingAt);
                    }
                    return true;
                }

                if (filter === 'siteVisits') {
                    if (!lead.siteVisitEligible) return false;
                    if (hasDateRange) {
                        if (!lead.latestSiteVisitAt) return false;
                        return isWithinRange(lead.latestSiteVisitAt);
                    }
                    return true;
                }

                if (filter === 'projectImpact') {
                    const hasRelevantHistory = lead.hasSiteVisitHistory || lead.hasSiteVisitStatus || lead.hasSiteVisitFlag;
                    if (!hasRelevantHistory) return false;
                    if (hasDateRange) {
                        if (!lead.latestSiteVisitAt) return false;
                        return isWithinRange(lead.latestSiteVisitAt);
                    }
                    return true;
                }

                return true;
            });
            return transformLeadData(filtered);
        }

        if (!statusId && !projectId && !userId && !hasDateRange && !filter) {
            return transformLeadData(enrichedLeads);
        }

        const filtered = enrichedLeads.filter(lead => {
            const statusMatch = !statusId || lead.currentStatus?._id === statusId;
            const projectMatch = !projectId || lead.project?._id === projectId;
            const userMatch = !userId || lead.user?._id === userId;

            return statusMatch && projectMatch && userMatch;
        });

        return transformLeadData(filtered);
    }, [leads, searchParams, siteVisitStatusIds, bookingStatusIds]);




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
