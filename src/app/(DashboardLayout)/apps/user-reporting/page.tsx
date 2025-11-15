"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Card, Label, Select, TextInput, Button, Modal, Table, Badge, Pagination } from 'flowbite-react';
import { Icon } from '@iconify/react';
import { API_ENDPOINTS, API_BASE_URL } from '@/lib/config';
import { useAuth } from '@/app/context/AuthContext';
import { useSearchParams } from 'next/navigation';

type TeamType = 'superadmin' | 'project';

interface UserItem {
  _id: string;
  name: string;
  email?: string;
  level?: number;
  projectIds: string[];
}

interface ReportsToRow {
  userId: string;
  teamType: TeamType;
  projectId?: string;
  context: string;
  level?: number;
}

interface UserReportingData {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;

  };
  reportsTo: Array<{
    user: {
      _id: string;
      name: string;
      email: string;
    };
    teamType: TeamType;
    project?: {
      _id: string;
      name: string;
    };
    context: string;
    path: string;
    _id: string;
  }>;
  level: number;
  createdAt: string;
  updatedAt: string;
}

const UserReportingPage: React.FC = () => {
  const { token } = useAuth();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [projects, setProjects] = useState<{ _id: string; name: string }[]>([]);
  const [targetUser, setTargetUser] = useState<string>('');
  const [reportsTo, setReportsTo] = useState<ReportsToRow[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Existing reporting data
  const [existingReporting, setExistingReporting] = useState<UserReportingData[]>([]);
  const [loadingReporting, setLoadingReporting] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState<{
    currentPage: number;
    totalPages: number;
    totalItems: number;
    limit: number;
  } | null>(null);

  // Details modal state
  const [detailOpenUserId, setDetailOpenUserId] = useState<string | null>(null);
  const [detailNotes, setDetailNotes] = useState<Record<string, string>>({});

  // Edit state
  const [editingReporting, setEditingReporting] = useState<UserReportingData | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Hierarchy modal state
  const [hierarchyModalOpen, setHierarchyModalOpen] = useState(false);
  const [hierarchyData, setHierarchyData] = useState<any>(null);
  const [hierarchyLoading, setHierarchyLoading] = useState(false);

  // Fetch projects and derive users from them with level and project assignments
  useEffect(() => {
    if (!token) return;
    const fetchData = async () => {
      try {
        // Fetch both projects and users to get complete user data with levels
        const [projectsResp, usersResp] = await Promise.all([
          fetch(API_ENDPOINTS.PROJECTS, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/api/superadmin/users/with-projects`, {
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => null) // If users endpoint fails, continue without it
        ]);

        // Process projects
        let projectsList: any[] = [];
        if (projectsResp.ok) {
          const projectsData = await projectsResp.json();
          projectsList = projectsData.projects || projectsData || [];
        }

        // Process users to get level information
        const usersLevelMap = new Map<string, number>();
        if (usersResp && usersResp.ok) {
          try {
            const usersData = await usersResp.json();
            const usersList = usersData.users || usersData || [];
            usersList.forEach((u: any) => {
              if (u._id) {
                // Level can be in currentRole.level or directly on user
                const level = u.currentRole?.level ?? u.level;
                if (level !== undefined && level !== null) {
                  usersLevelMap.set(u._id, level);
                }
              }
            });
          } catch (err) {
            console.warn('Failed to parse users data:', err);
          }
        }

        const userMap = new Map<string, UserItem>();

        // Helper function to get level from user object (check multiple possible locations)
        const getUserLevel = (userObj: any): number | undefined => {
          // Check direct level property
          if (userObj.level !== undefined && userObj.level !== null) {
            return userObj.level;
          }
          // Check currentRole.level
          if (userObj.currentRole?.level !== undefined && userObj.currentRole?.level !== null) {
            return userObj.currentRole.level;
          }
          // Check from usersLevelMap
          if (userObj._id && usersLevelMap.has(userObj._id)) {
            return usersLevelMap.get(userObj._id);
          }
          return undefined;
        };

        // Build user map with level and project assignments
        projectsList.forEach((p: any) => {
          const projectId = p._id;

          // Skip if project doesn't have a valid ID
          if (!projectId) return;

          // Process owner
          if (p.owner && p.owner._id) {
            const existingUser = userMap.get(p.owner._id);
            const ownerLevel = getUserLevel(p.owner);
            if (existingUser) {
              // Ensure projectIds is an array
              if (!Array.isArray(existingUser.projectIds)) {
                existingUser.projectIds = [];
              }
              if (!existingUser.projectIds.includes(projectId)) {
                existingUser.projectIds.push(projectId);
              }
              // Update level if not set or if this one is higher priority
              if (ownerLevel !== undefined && (existingUser.level === undefined || ownerLevel > existingUser.level)) {
                existingUser.level = ownerLevel;
              }
            } else {
              userMap.set(p.owner._id, {
                _id: p.owner._id,
                name: p.owner.name || '',
                email: p.owner.email || '',
                level: ownerLevel,
                projectIds: [projectId]
              });
            }
          }

          // Process members
          if (p.members && Array.isArray(p.members)) {
            p.members.forEach((m: any) => {
              if (!m || !m._id) return; // Skip invalid members

              const existingUser = userMap.get(m._id);
              const memberLevel = getUserLevel(m);
              if (existingUser) {
                // Ensure projectIds is an array
                if (!Array.isArray(existingUser.projectIds)) {
                  existingUser.projectIds = [];
                }
                if (!existingUser.projectIds.includes(projectId)) {
                  existingUser.projectIds.push(projectId);
                }
                // Update level if not set or if this one is higher priority
                if (memberLevel !== undefined && (existingUser.level === undefined || memberLevel > existingUser.level)) {
                  existingUser.level = memberLevel;
                }
              } else {
                userMap.set(m._id, {
                  _id: m._id,
                  name: m.name || '',
                  email: m.email || '',
                  level: memberLevel,
                  projectIds: [projectId]
                });
              }
            });
          }

          // Process managers
          if (p.managers && Array.isArray(p.managers)) {
            p.managers.forEach((mm: any) => {
              if (!mm || !mm._id) return; // Skip invalid managers

              const existingUser = userMap.get(mm._id);
              const managerLevel = getUserLevel(mm);
              if (existingUser) {
                // Ensure projectIds is an array
                if (!Array.isArray(existingUser.projectIds)) {
                  existingUser.projectIds = [];
                }
                if (!existingUser.projectIds.includes(projectId)) {
                  existingUser.projectIds.push(projectId);
                }
                // Update level if not set or if this one is higher priority
                if (managerLevel !== undefined && (existingUser.level === undefined || managerLevel > existingUser.level)) {
                  existingUser.level = managerLevel;
                }
              } else {
                userMap.set(mm._id, {
                  _id: mm._id,
                  name: mm.name || '',
                  email: mm.email || '',
                  level: managerLevel,
                  projectIds: [projectId]
                });
              }
            });
          }
        });

        // Filter out any users with empty projectIds before setting
        const usersWithProjects = Array.from(userMap.values()).filter(user =>
          Array.isArray(user.projectIds) && user.projectIds.length > 0
        );

        console.log('📊 [User Reporting] Loaded users with levels:', usersWithProjects.map(u => ({
          name: u.name,
          level: u.level,
          projects: u.projectIds.length
        })));

        setUsers(usersWithProjects);
        setProjects(projectsList.map((pp: any) => ({ _id: pp._id, name: pp.name })));
      } catch (err) {
        console.error('Failed to fetch projects for user reporting:', err);
        setUsers([]);
        setProjects([]);
      }
    };
    fetchData();
  }, [token]);

  // Auto-select user from URL parameter
  useEffect(() => {
    const userIdFromUrl = searchParams.get('userId');
    if (userIdFromUrl && users.length > 0) {
      const userExists = users.find(u => u._id === userIdFromUrl);
      if (userExists) {
        setTargetUser(userIdFromUrl);
      }
    }
  }, [searchParams, users]);

  // Fetch existing reporting data
  const fetchExistingReporting = async (page: number, limit: number) => {
    if (!token) return;
    setLoadingReporting(true);
    try {
      // Build URL with pagination params
      const baseUrl = API_ENDPOINTS.USER_REPORTING_GET;
      const url = new URL(baseUrl);
      url.searchParams.set('page', String(page));
      url.searchParams.set('limit', String(limit));

      const resp = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resp.ok) {
        const data = await resp.json();
        console.log('Existing reporting data:', data);

        // Extract pagination metadata (check both nested and root level)
        const paginationData = data.pagination || (data.currentPage !== undefined ? data : null);
        if (paginationData && typeof paginationData === 'object') {
          setPagination({
            currentPage: Number(paginationData.currentPage) || page,
            totalPages: Number(paginationData.totalPages) || 1,
            totalItems: Number(paginationData.totalItems) || 0,
            limit: Number(paginationData.limit) || limit,
          });
        } else {
          setPagination(null);
        }

        // Handle both array format and object with reportings property
        if (Array.isArray(data)) {
          setExistingReporting(data);
        } else if (data.reportings && Array.isArray(data.reportings)) {
          setExistingReporting(data.reportings);
        } else if (data.data && Array.isArray(data.data)) {
          setExistingReporting(data.data);
        } else {
          setExistingReporting([]);
        }
      } else {
        console.error('Failed to fetch reporting data:', resp.status);
        setExistingReporting([]);
        setPagination(null);
      }
    } catch (err) {
      console.error('Error fetching reporting data:', err);
      setExistingReporting([]);
      setPagination(null);
    } finally {
      setLoadingReporting(false);
    }
  };

  // Fetch reporting data on component mount and when pagination changes
  useEffect(() => {
    if (token) {
      fetchExistingReporting(currentPage, pageSize);
    }
  }, [token, currentPage, pageSize]);

  const addRow = () => {
    // Use first available reporter if user is selected, otherwise first user
    const defaultReporter = selectedUser && availableReporters.length > 0
      ? availableReporters[0]._id
      : users[0]?._id ?? '';

    setReportsTo(prev => [
      ...prev,
      { userId: defaultReporter, teamType: 'superadmin', projectId: '', context: '' },
    ]);
  };

  const updateRow = (index: number, patch: Partial<ReportsToRow>) => {
    setReportsTo(prev => prev.map((r, i) => i === index ? { ...r, ...patch } : r));
  };

  const removeRow = (index: number) => {
    setReportsTo(prev => prev.filter((_, i) => i !== index));
  };

  // Details modal handlers
  const openDetails = (userId: string) => {
    if (!userId) {
      console.warn('Attempted to open details modal without a valid user ID');
      return;
    }

    const userExists = users.some((u) => u._id === userId);
    if (!userExists) {
      console.warn('Details requested for user not in users list:', userId);
      return;
    }

    setDetailOpenUserId(userId);
    setDetailNotes(prev => ({
      ...prev,
      [userId]: prev[userId] ?? ''
    }));
  };

  const closeDetails = () => {
    setDetailOpenUserId(null);
  };

  const saveDetailNotes = () => {
    // Here you can add API call to persist the notes if needed
    console.log('Saving notes for user:', detailOpenUserId, detailNotes[detailOpenUserId || '']);
    closeDetails();
  };

  // Edit reporting
  const startEdit = (reporting: UserReportingData) => {
    if (!reporting?.user?._id) {
      console.warn('Cannot edit reporting without a user object:', reporting);
      return;
    }

    setEditingReporting(reporting);
    setTargetUser(reporting.user._id);

    // Convert existing reportsTo to form format
    const formReportsTo = reporting.reportsTo.map(report => ({
      userId: report.user._id,
      teamType: report.teamType,
      projectId: report.project?._id || '',
      context: report.context
    }));
    setReportsTo(formReportsTo);

    // Scroll to form
    document.getElementById('reporting-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingReporting(null);
    setTargetUser('');
    setReportsTo([]);
  };

  // Delete reporting
  const confirmDelete = (reportingId: string) => {
    setDeleteConfirmId(reportingId);
  };

  const cancelDelete = () => {
    setDeleteConfirmId(null);
  };

  const handleDelete = async (reportingId: string) => {
    if (!token) return;

    try {
      const resp = await fetch(API_ENDPOINTS.USER_REPORTING_DELETE(reportingId), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (resp.ok) {
        setSuccessMessage('User reporting deleted successfully!');
        setTimeout(() => setSuccessMessage(''), 5000);
        fetchExistingReporting(currentPage, pageSize);
        setDeleteConfirmId(null);
      } else {
        const err = await resp.json().catch(() => ({}));
        setError(err.message || `Failed to delete reporting: ${resp.status}`);
      }
    } catch (err) {
      console.error('Error deleting reporting:', err);
      setError('Failed to delete reporting');
    }
  };

  // Fetch hierarchy
  const fetchHierarchy = async (userId: string) => {
    if (!token) return;

    setHierarchyLoading(true);
    setHierarchyModalOpen(true);

    try {
      const resp = await fetch(API_ENDPOINTS.USER_REPORTING_HIERARCHY(userId), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (resp.ok) {
        const data = await resp.json();
        console.log('Hierarchy data:', data);
        setHierarchyData(data);
      } else {
        console.error('Failed to fetch hierarchy:', resp.status);
        setError('Failed to fetch hierarchy');
        setHierarchyModalOpen(false);
      }
    } catch (err) {
      console.error('Error fetching hierarchy:', err);
      setError('Failed to fetch hierarchy');
      setHierarchyModalOpen(false);
    } finally {
      setHierarchyLoading(false);
    }
  };

  const closeHierarchyModal = () => {
    setHierarchyModalOpen(false);
    setHierarchyData(null);
  };

  // Tree structure component for hierarchy
  const TreeNode = ({ node, level = 0 }: { node: any; level?: number }) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = true; // You can add state for expand/collapse if needed

    const indentStyle = {
      marginLeft: `${level * 20}px`
    };

    return (
      <div style={indentStyle}>
        <div className="flex items-start gap-3 py-3 px-4 rounded-lg bg-gray-50 dark:bg-gray-700 mb-2 border border-gray-200 dark:border-gray-600">
          <div className="flex items-center gap-2">
            {hasChildren ? (
              <Icon
                icon="solar:alt-arrow-down-line-duotone"
                className="text-blue-500 text-sm mt-1"
              />
            ) : (
              <Icon
                icon="solar:user-line-duotone"
                className="text-gray-400 text-sm mt-1"
              />
            )}
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-blue-600 dark:text-blue-300">
                {node.user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 dark:text-white text-base">
                  {node.user?.name || 'Unknown User'}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {node.user?.email || 'No email'}
                </div>

                {/* User Details */}
                <div className="mb-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon icon="solar:user-line-duotone" className="text-green-500 text-sm" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">User Details:</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-6">
                    {/* Role */}
                    {node.user?.role && (
                      <div className="flex items-center gap-2">
                        <Icon icon="solar:shield-user-line-duotone" className="text-green-400 text-xs" />
                        <span className="text-xs text-gray-600 dark:text-gray-400">Role:</span>
                        <Badge color="success" className="text-xs">
                          {node.user.role}
                        </Badge>
                      </div>
                    )}

                    {/* Mobile */}
                    {node.user?.mobile && (
                      <div className="flex items-center gap-2">
                        <Icon icon="solar:phone-line-duotone" className="text-blue-400 text-xs" />
                        <span className="text-xs text-gray-600 dark:text-gray-400">Mobile:</span>
                        <span className="text-xs text-gray-700 dark:text-gray-300">
                          {node.user.mobile}
                        </span>
                      </div>
                    )}

                    {/* Company */}
                    {node.user?.companyName && (
                      <div className="flex items-center gap-2">
                        <Icon icon="solar:buildings-2-line-duotone" className="text-purple-400 text-xs" />
                        <span className="text-xs text-gray-600 dark:text-gray-400">Company:</span>
                        <span className="text-xs text-gray-700 dark:text-gray-300">
                          {node.user.companyName}
                        </span>
                      </div>
                    )}

                    {/* Level */}
                    {node.user?.level && (
                      <div className="flex items-center gap-2">
                        <Icon icon="solar:layers-line-duotone" className="text-orange-400 text-xs" />
                        <span className="text-xs text-gray-600 dark:text-gray-400">Level:</span>
                        <Badge color="warning" className="text-xs">
                          {node.user.level}
                        </Badge>
                      </div>
                    )}

                    {/* Active Status */}
                    {node.user?.isActive !== undefined && (
                      <div className="flex items-center gap-2">
                        <Icon icon="solar:check-circle-line-duotone" className="text-green-400 text-xs" />
                        <span className="text-xs text-gray-600 dark:text-gray-400">Status:</span>
                        <Badge
                          color={node.user.isActive ? 'success' : 'failure'}
                          className="text-xs"
                        >
                          {node.user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    )}

                    {/* Created Date */}
                    {node.user?.createdAt && (
                      <div className="flex items-center gap-2">
                        <Icon icon="solar:calendar-add-line-duotone" className="text-gray-400 text-xs" />
                        <span className="text-xs text-gray-600 dark:text-gray-400">Created:</span>
                        <span className="text-xs text-gray-700 dark:text-gray-300">
                          {new Date(node.user.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Custom Permissions */}
                  {node.user?.customPermissions && (
                    <div className="mt-2 ml-6">
                      <div className="flex items-start gap-2">
                        <Icon icon="solar:shield-check-line-duotone" className="text-blue-400 text-xs mt-0.5" />
                        <div>
                          <span className="text-xs text-gray-600 dark:text-gray-400">Custom Permissions:</span>
                          <div className="mt-1 space-y-1">
                            {node.user.customPermissions.allowed && node.user.customPermissions.allowed.length > 0 && (
                              <div className="flex items-center gap-1">
                                <Badge color="success" className="text-xs">Allowed:</Badge>
                                <div className="flex flex-wrap gap-1">
                                  {node.user.customPermissions.allowed.map((perm: string, index: number) => (
                                    <Badge key={index} color="success" className="text-xs">
                                      {perm}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            {node.user.customPermissions.denied && node.user.customPermissions.denied.length > 0 && (
                              <div className="flex items-center gap-1">
                                <Badge color="failure" className="text-xs">Denied:</Badge>
                                <div className="flex flex-wrap gap-1">
                                  {node.user.customPermissions.denied.map((perm: string, index: number) => (
                                    <Badge key={index} color="failure" className="text-xs">
                                      {perm}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Restrictions */}
                  {node.user?.restrictions && (
                    <div className="mt-2 ml-6">
                      <div className="flex items-start gap-2">
                        <Icon icon="solar:lock-line-duotone" className="text-red-400 text-xs mt-0.5" />
                        <div>
                          <span className="text-xs text-gray-600 dark:text-gray-400">Restrictions:</span>
                          <div className="mt-1 space-y-1">
                            {node.user.restrictions.maxProjects && (
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                Max Projects: {node.user.restrictions.maxProjects}
                              </div>
                            )}
                            {node.user.restrictions.allowedProjects && node.user.restrictions.allowedProjects.length > 0 && (
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                Allowed Projects: {node.user.restrictions.allowedProjects.length}
                              </div>
                            )}
                            {node.user.restrictions.deniedProjects && node.user.restrictions.deniedProjects.length > 0 && (
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                Denied Projects: {node.user.restrictions.deniedProjects.length}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Project Details */}
                {node.project && (
                  <div className="mb-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon icon="solar:buildings-line-duotone" className="text-blue-500 text-sm" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Project Details:</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 ml-6">
                      {/* Project Name */}
                      <div className="flex items-center gap-2">
                        <Icon icon="solar:tag-line-duotone" className="text-blue-400 text-xs" />
                        <span className="text-xs text-gray-600 dark:text-gray-400">Name:</span>
                        <Badge color="info" className="text-xs">
                          {node.project.name}
                        </Badge>
                      </div>

                      {/* Project Location */}
                      {node.project.location && (
                        <div className="flex items-center gap-2">
                          <Icon icon="solar:map-point-line-duotone" className="text-orange-400 text-xs" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">Location:</span>
                          <span className="text-xs text-gray-700 dark:text-gray-300">
                            📍 {node.project.location}
                          </span>
                        </div>
                      )}

                      {/* Developer */}
                      {node.project.developBy && (
                        <div className="flex items-center gap-2">
                          <Icon icon="solar:code-line-duotone" className="text-purple-400 text-xs" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">Developer:</span>
                          <Badge color="purple" className="text-xs">
                            {node.project.developBy}
                          </Badge>
                        </div>
                      )}

                      {/* Project Owner */}
                      {node.project.owner && (
                        <div className="flex items-center gap-2">
                          <Icon icon="solar:crown-line-duotone" className="text-yellow-400 text-xs" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">Owner ID:</span>
                          <span className="text-xs text-gray-700 dark:text-gray-300 font-mono">
                            {node.project.owner}
                          </span>
                        </div>
                      )}

                      {/* Members Count */}
                      {node.project.members && (
                        <div className="flex items-center gap-2">
                          <Icon icon="solar:users-group-rounded-line-duotone" className="text-green-400 text-xs" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">Members:</span>
                          <Badge color="success" className="text-xs">
                            {node.project.members.length}
                          </Badge>
                        </div>
                      )}

                      {/* Managers Count */}
                      {node.project.managers && (
                        <div className="flex items-center gap-2">
                          <Icon icon="solar:user-check-line-duotone" className="text-blue-400 text-xs" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">Managers:</span>
                          <Badge color="info" className="text-xs">
                            {node.project.managers.length}
                          </Badge>
                        </div>
                      )}

                      {/* Created Date */}
                      {node.project.createdAt && (
                        <div className="flex items-center gap-2">
                          <Icon icon="solar:calendar-add-line-duotone" className="text-gray-400 text-xs" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">Created:</span>
                          <span className="text-xs text-gray-700 dark:text-gray-300">
                            {new Date(node.project.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}

                      {/* Version */}
                      {node.project.__v !== undefined && (
                        <div className="flex items-center gap-2">
                          <Icon icon="solar:version-line-duotone" className="text-cyan-400 text-xs" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">Version:</span>
                          <Badge color="gray" className="text-xs">
                            v{node.project.__v}
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Project Members List */}
                    {node.project.members && node.project.members.length > 0 && (
                      <div className="mt-2 ml-6">
                        <div className="flex items-start gap-2">
                          <Icon icon="solar:users-group-rounded-line-duotone" className="text-green-400 text-xs mt-0.5" />
                          <div>
                            <span className="text-xs text-gray-600 dark:text-gray-400">Members ({node.project.members.length}):</span>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {node.project.members.slice(0, 5).map((memberId: string, index: number) => (
                                <Badge key={index} color="success" className="text-xs font-mono">
                                  {memberId.substring(0, 8)}...
                                </Badge>
                              ))}
                              {node.project.members.length > 5 && (
                                <Badge color="gray" className="text-xs">
                                  +{node.project.members.length - 5} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Project Managers List */}
                    {node.project.managers && node.project.managers.length > 0 && (
                      <div className="mt-2 ml-6">
                        <div className="flex items-start gap-2">
                          <Icon icon="solar:user-check-line-duotone" className="text-blue-400 text-xs mt-0.5" />
                          <div>
                            <span className="text-xs text-gray-600 dark:text-gray-400">Managers ({node.project.managers.length}):</span>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {node.project.managers.slice(0, 5).map((managerId: string, index: number) => (
                                <Badge key={index} color="info" className="text-xs font-mono">
                                  {managerId.substring(0, 8)}...
                                </Badge>
                              ))}
                              {node.project.managers.length > 5 && (
                                <Badge color="gray" className="text-xs">
                                  +{node.project.managers.length - 5} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Project Description */}
                    {node.project.description && (
                      <div className="mt-2 ml-6">
                        <div className="flex items-start gap-2">
                          <Icon icon="solar:document-text-line-duotone" className="text-gray-400 text-xs mt-0.5" />
                          <div>
                            <span className="text-xs text-gray-600 dark:text-gray-400">Description:</span>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 bg-gray-100 dark:bg-gray-700 p-2 rounded">
                              {node.project.description}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Project Tags */}
                    {node.project.tags && node.project.tags.length > 0 && (
                      <div className="mt-2 ml-6">
                        <div className="flex items-center gap-2">
                          <Icon icon="solar:tag-line-duotone" className="text-gray-400 text-xs" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">Tags:</span>
                          <div className="flex flex-wrap gap-1">
                            {node.project.tags.map((tag: string, index: number) => (
                              <Badge key={index} color="gray" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Team Type and Level */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1">
                    <Icon icon="solar:users-group-rounded-line-duotone" className="text-purple-500 text-sm" />
                    <Badge
                      color={node.teamType === 'superadmin' ? 'failure' : 'info'}
                      className="text-xs"
                    >
                      {node.teamType || 'user'}
                    </Badge>
                  </div>

                  {node.level && (
                    <div className="flex items-center gap-1">
                      <Icon icon="solar:layers-line-duotone" className="text-orange-500 text-sm" />
                      <Badge color="warning" className="text-xs">
                        Level {node.level}
                      </Badge>
                    </div>
                  )}

                  {node.context && (
                    <div className="flex items-center gap-1">
                      <Icon icon="solar:document-text-line-duotone" className="text-gray-500 text-sm" />
                      <span className="text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded">
                        {node.context}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Info */}
              <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                {node.createdAt && (
                  <div>Created: {new Date(node.createdAt).toLocaleDateString()}</div>
                )}
                {node.updatedAt && (
                  <div>Updated: {new Date(node.updatedAt).toLocaleDateString()}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {hasChildren && (
          <div>
            {node.children.map((child: any, index: number) => (
              <TreeNode key={index} node={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Get selected user's data
  const selectedUser = useMemo(() => {
    return users.find(u => u._id === targetUser);
  }, [users, targetUser]);

  // Filter reporters based on level and shared projects
  // Rules:
  // 1. Reporter level must be LESS than user level (e.g., user level 2 → reporter can be 1)
  // 2. Reporter must share at least one project with user
  // 
  // LOGIC FLOW:
  // 1. User selects a user (e.g., User A with level 2, projects: ["abc", "xyz"])
  // 2. Get User A's level (2) and projectIds array: ["abc", "xyz"]
  // 3. Loop through all users to find reporters
  // 4. For each reporter, check:
  //    - Reporter level < User level? (e.g., level 1 < level 2 → ✅)
  //    - Reporter shares at least ONE project with User A?
  //    - Reporter with level 1 and ["abc"] → ✅ Match
  //    - Reporter with level 2 and ["abc"] → ❌ No match (level not lower)
  //    - Reporter with level 1 and ["def"] → ❌ No match (no shared project)
  //    - Reporter with [] → ❌ No match (no projects)

  

  const availableReporters = useMemo(() => {
    if (!selectedUser) {
      console.log('🔍 [Reporter Filter] No user selected');
      return []; // If no user selected, show none (wait for user selection)
    }

    const userLevel = selectedUser.level;
    const userProjectIds = selectedUser.projectIds || [];

    console.log('🔍 [Reporter Filter] Selected User:', selectedUser.name);
    console.log('🔍 [Reporter Filter] User Level:', userLevel);
    console.log('🔍 [Reporter Filter] User Projects:', userProjectIds);

    // If user has no projects, return empty (can't match projects)
    if (!Array.isArray(userProjectIds) || userProjectIds.length === 0) {
      console.log('❌ [Reporter Filter] User has no projects');
      return [];
    }

    const reporterList: UserItem[] = [];

    users.forEach(user => {
      // Skip if it's the same user
      if (user._id === selectedUser._id) {
        return;
      }

      // Reporter must have projects
      const reporterProjectIds = user.projectIds || [];
      if (!Array.isArray(reporterProjectIds) || reporterProjectIds.length === 0) {
        return; // Reporter has no projects - skip
      }

      const reporterLevel = user.level;

      // Condition 1: Reporter level must be LESS than user level
      // If user has a level defined, reporter must have a lower level
      // If user has no level, show all reporters (no level restriction)
      let levelCheck = true;
      if (userLevel !== undefined && userLevel !== null) {
        // User has a level - reporter must have a lower level
        if (reporterLevel === undefined || reporterLevel === null) {
          levelCheck = false; // Reporter has no level, can't be lower
        } else {
          levelCheck = reporterLevel < userLevel; // Reporter level must be strictly less
        }
      }
      // If user has no level, levelCheck remains true (show all)

      // Condition 2: Reporter must share at least one project with user
      // For multiple projects, at least one project must match
      const hasSharedProject = reporterProjectIds.some(reporterProjId => {
        const reporterProjIdStr = String(reporterProjId);
        return userProjectIds.some(userProjId => String(userProjId) === reporterProjIdStr);
      });

      console.log(`🔍 [Reporter Filter] Checking: ${user.name}`, {
        reporterLevel,
        userLevel,
        levelCheck,
        reporterProjects: reporterProjectIds,
        hasSharedProject
      });

      if (levelCheck && hasSharedProject) {
        console.log(`✅ [Reporter Filter] Match! ${user.name} (Level: ${reporterLevel}, Projects: ${reporterProjectIds.length})`);
        reporterList.push(user);
      } else {
        if (!levelCheck) {
          console.log(`❌ [Reporter Filter] Level check failed for ${user.name}: ${reporterLevel} >= ${userLevel}`);
        }
        if (!hasSharedProject) {
          console.log(`❌ [Reporter Filter] No shared projects for ${user.name}`);
        }
      }
    });

    console.log('🔍 [Reporter Filter] Final list:', reporterList.map(r => `${r.name} (Level: ${r.level})`));
    return reporterList;
  }, [users, selectedUser]);



  // Helper function to get available projects for a specific row
  const getAvailableProjectsForRow = (rowUserId: string) => {
    if (!selectedUser || !rowUserId) {
      return projects; // If no user or reporter selected, show all
    }

    const reporter = users.find(u => u._id === rowUserId);
    if (!reporter) {
      return projects; // If reporter not found, show all
    }

    const userProjectIds = selectedUser.projectIds || [];
    const reporterProjectIds = reporter.projectIds || [];

    if (userProjectIds.length === 0 || reporterProjectIds.length === 0) {
      return []; // No projects means no available projects
    }

    // Filter projects that BOTH user and reporter have (shared projects only)
    // Convert to strings for comparison to handle ObjectId vs string
    return projects.filter(project => {
      const projectIdStr = String(project._id);
      const userHasProject = userProjectIds.some(id => String(id) === projectIdStr);
      const reporterHasProject = reporterProjectIds.some(id => String(id) === projectIdStr);
      return userHasProject && reporterHasProject;
    });
  };

  // Clear invalid reporter/project selections when user changes
  useEffect(() => {
    if (!selectedUser) {
      return;
    }

    setReportsTo(prev => prev.map(row => {
      if (!row.userId) return row;

      const reporter = users.find(u => u._id === row.userId);
      if (!reporter) {
        return { ...row, userId: '', projectId: '' }; // Clear if reporter not found
      }

      // Check if reporter is valid:
      // 1. Reporter level must be LESS than user level
      // 2. Reporter must share at least one project with user
      const reporterLevel = reporter.level;
      const userLevel = selectedUser.level;
      console.log(' user Level:', userLevel);
      const reporterProjectIds = reporter.projectIds || [];
      const userProjectIds = selectedUser.projectIds || [];

      // Check level: If user has a level defined, reporter must have a lower level
      let levelValid = true;
      if (userLevel !== undefined && userLevel !== null) {
        // User has a level - reporter must have a lower level
        if (reporterLevel === undefined || reporterLevel === null) {
          levelValid = false; // Reporter has no level, can't be lower
        } else {
          levelValid = reporterLevel < userLevel; // Reporter level must be strictly less
        }
      }
      // If user has no level, levelValid remains true (no level restriction)

      // Check shared projects: Reporter must share at least one project with user
      const projectValid = reporterProjectIds.length > 0 &&
        userProjectIds.length > 0 &&
        reporterProjectIds.some(reporterProjId => {
          const reporterProjIdStr = String(reporterProjId);
          return userProjectIds.some(userProjId => String(userProjId) === reporterProjIdStr);
        });

      const isValid = levelValid && projectValid;

      if (!isValid) {
        return { ...row, userId: '', projectId: '' }; // Clear invalid reporter
      }

      // Clear project if it's no longer valid (not shared between user and reporter)
      if (row.projectId && row.teamType === 'project') {
        const rowProjectIdStr = String(row.projectId);
        const isSharedProject = reporterProjectIds.some(reporterProjId => {
          const reporterProjIdStr = String(reporterProjId);
          return userProjectIds.some(userProjId => {
            const userProjIdStr = String(userProjId);
            return userProjIdStr === reporterProjIdStr && reporterProjIdStr === rowProjectIdStr;
          });
        });
        if (!isSharedProject) {
          return { ...row, projectId: '' }; // Clear invalid project
        }
      }

      return row;
    }));
  }, [selectedUser, users, projects]);

  const canSubmit = useMemo(() => {
    if (!targetUser) return false;
    if (!reportsTo.length) return false;
    for (const r of reportsTo) {
      if (!r.userId || !r.context) return false;
      if (r.teamType === 'project' && !r.projectId) return false;
    }
    return true;
  }, [targetUser, reportsTo]);

  const handleSubmit = async () => {
    if (!token) return;
    if (!canSubmit) {
      setError('Please complete all required fields.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        userId: targetUser,
        reportsTo: reportsTo.map(r => ({
          userId: r.userId,
          teamType: r.teamType,
          ...(r.teamType === 'project' && r.projectId && { projectId: r.projectId }),
          context: r.context
        }))
      };

      console.log('=== USER REPORTING PAYLOAD ===');
      console.log('Sending payload:', JSON.stringify(payload, null, 2));
      console.log('API Endpoint:', API_ENDPOINTS.USER_REPORTING);

      const url = editingReporting
        ? API_ENDPOINTS.USER_REPORTING_UPDATE(editingReporting._id)
        : API_ENDPOINTS.USER_REPORTING;

      const method = editingReporting ? 'PUT' : 'POST';

      const resp = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      console.log('Response status:', resp.status);
      console.log('Response ok:', resp.ok);

      if (resp.ok) {
        const responseData = await resp.json();
        console.log('Success response:', responseData);
        setTargetUser('');
        setReportsTo([]);
        setEditingReporting(null);
        setError(null);
        setSuccessMessage(editingReporting ? 'User reporting updated successfully!' : 'User reporting saved successfully!');
        setTimeout(() => setSuccessMessage(''), 5000);
        // Refresh existing reporting data
        fetchExistingReporting(currentPage, pageSize);
      } else {
        const err = await resp.json().catch(() => ({}));
        console.error('Error response:', err);
        setError(err.message || `Failed to save reporting: ${resp.status}`);
      }
    } catch (err) {
      console.error('Network error:', err);
      setError('Network error while saving reporting.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card id="reporting-form">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon icon="solar:chart-line-duotone" className="text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {editingReporting ? 'Edit User Reporting' : 'User Reporting'}
            </h2>
            {editingReporting && (
              <Badge color="warning" className="text-xs">
                Editing: {editingReporting.user.name}
              </Badge>
            )}
          </div>
          {editingReporting && (
            <Button size="xs" color="gray" onClick={cancelEdit}>
              <Icon icon="solar:close-circle-line-duotone" className="mr-1" />
              Cancel Edit
            </Button>
          )}
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <Icon icon="solar:check-circle-line-duotone" className="text-green-500 mr-2" />
              <span className="text-green-800">{successMessage}</span>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="targetUser" value="User" />
            <Select id="targetUser" value={targetUser} onChange={(e) => setTargetUser(e.target.value)} className="w-full" required>
              <option value="">Select a user</option>
              {users.map(u => (
                <option key={u._id} value={u._id}>{u.name} {u.email ? `(${u.email})` : ''}</option>
              ))}
            </Select>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Reports To</h3>
            <Button size="xs" onClick={addRow}>Add Reporter</Button>
          </div>
          {reportsTo.length === 0 && (
            <div className="text-sm text-gray-500 dark:text-gray-400">No reporting rules added yet.</div>
          )}
          {reportsTo.map((row, idx) => (
            <div key={idx} className="border rounded-md p-4 mb-4 flex flex-col md:flex-row gap-4 items-start">
              <div className="flex-1 w-full">
                <Label value="Reporter" className="text-sm font-medium text-gray-700 dark:text-gray-300" />
                <Select
                  value={row.userId}
                  onChange={(e) => {
                    updateRow(idx, { userId: e.target.value, projectId: '' }); // Clear project when reporter changes
                  }}
                  className="w-full mt-1"
                  disabled={!targetUser || !selectedUser}
                >
                  <option value="">Select Reporter</option>
                  {!targetUser || !selectedUser ? (
                    <option value="" disabled>Select a user first</option>
                  ) : availableReporters.length === 0 ? (
                    <option value="" disabled>No eligible reporters (must have lower level & shared projects)</option>
                  ) : (
                    availableReporters.map(u => (
                      <option key={u._id} value={u._id}>
                        {u.name} {u.email ? `(${u.email})` : ''}
                        {u.level !== undefined ? ` [Level: ${u.level}]` : ''}
                      </option>
                    ))
                  )}
                </Select>
              </div>
              <div className="flex-1 w-full">
                <Label value="Team Type" className="text-sm font-medium text-gray-700 dark:text-gray-300" />
                <Select value={row.teamType} onChange={(e) => updateRow(idx, { teamType: e.target.value as TeamType })} className="w-full mt-1">
                  <option value="superadmin">Superadmin</option>
                  <option value="project">Project</option>
                </Select>
              </div>
              {row.teamType === 'project' && (
                <div className="flex-1 w-full">
                  <Label value="Project" className="text-sm font-medium text-gray-700 dark:text-gray-300" />
                  <Select
                    value={row.projectId || ''}
                    onChange={(e) => updateRow(idx, { projectId: e.target.value })}
                    className="w-full mt-1"
                    disabled={!row.userId || !targetUser}
                  >
                    <option value="">Select Project</option>
                    {!row.userId || !targetUser ? (
                      <option value="" disabled>Select user and reporter first</option>
                    ) : (() => {
                      const availableProjects = getAvailableProjectsForRow(row.userId);
                      return availableProjects.length === 0 ? (
                        <option value="" disabled>No shared projects between user and reporter</option>
                      ) : (
                        availableProjects.map(p => (
                          <option key={p._id} value={p._id}>{p.name}</option>
                        ))
                      );
                    })()}
                  </Select>
                </div>
              )}
              <div className="flex-1 w-full">
                <Label value="Context" className="text-sm font-medium text-gray-700 dark:text-gray-300" />
                <TextInput value={row.context} onChange={(e) => updateRow(idx, { context: e.target.value })} className="w-full mt-1" placeholder="Context or notes" />
              </div>
              <div className="self-end flex gap-2">
                <Button size="xs" color="gray" onClick={() => openDetails(row.userId)} title="User Details">
                  <Icon icon="solar:info-circle-line-duotone" />
                </Button>
                <Button size="xs" color="gray" onClick={() => removeRow(idx)}>Remove</Button>
              </div>
            </div>
          ))}
        </div>

        {error && <div className="text-sm text-red-600 mb-2">{error}</div>}
        <Button onClick={handleSubmit} disabled={submitting} color="primary">
          {submitting ? 'Saving...' : editingReporting ? 'Update Reporting' : 'Save Reporting'}
        </Button>
      </Card>

      {/* Existing Reporting Data */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon icon="solar:list-line-duotone" className="text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Existing User Reporting</h2>
          </div>
          <Button size="xs" color="gray" onClick={() => fetchExistingReporting(currentPage, pageSize)} disabled={loadingReporting}>
            <Icon icon="solar:refresh-line-duotone" className="mr-1" />
            {loadingReporting ? 'Loading...' : 'Refresh'}
          </Button>
        </div>

        {loadingReporting ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-gray-600">Loading reporting data...</span>
          </div>
        ) : existingReporting.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Icon icon="solar:file-text-line-duotone" className="text-4xl mb-2 mx-auto" />
            <p>No user reporting data found.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table className="w-full">
                <Table.Head>
                  <Table.HeadCell>User</Table.HeadCell>
                  <Table.HeadCell>Reports To</Table.HeadCell>
                  <Table.HeadCell>Level</Table.HeadCell>
                  <Table.HeadCell>Created</Table.HeadCell>
                  <Table.HeadCell>Actions</Table.HeadCell>
                </Table.Head>
                <Table.Body>
                  {existingReporting.map((reporting) => {
                    const reportingUser = reporting?.user ?? null;
                    const reportingUserId = reportingUser?._id ?? reporting?._id ?? 'unknown';
                    return (
                      <Table.Row key={reporting._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <Table.Cell>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {reportingUser?.name ?? 'Unknown User'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {reportingUser?.email ?? 'No email'}
                            </div>
                          </div>
                        </Table.Cell>
                        <Table.Cell>
                          <div className="space-y-1">
                            {reporting.reportsTo.length === 0 ? (
                              <span className="text-sm text-gray-500">No reporting relationships</span>
                            ) : (
                              reporting.reportsTo.map((report, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <Badge
                                    color={report.teamType === 'superadmin' ? 'failure' : 'info'}
                                    className="text-xs"
                                  >
                                    {report.teamType}
                                  </Badge>
                                  <div className="text-sm">
                                    <div className="font-medium">{report.user.name}</div>
                                    {report.project && (
                                      <div className="text-xs text-gray-500">Project: {report.project.name}</div>
                                    )}
                                    <div className="text-xs text-gray-500">{report.context}</div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </Table.Cell>
                        <Table.Cell>
                          {typeof reporting.level === 'number' ? (
                            <Badge color="gray" className="text-xs">
                              Level {reporting.level}
                            </Badge>
                          ) : (
                            <span className="text-xs text-gray-500">-</span>
                          )}
                        </Table.Cell>
                        <Table.Cell>
                          <div className="text-sm text-gray-500">
                            {reporting.createdAt ? new Date(reporting.createdAt).toLocaleDateString() : '-'}
                          </div>
                        </Table.Cell>
                        <Table.Cell>
                          <div className="flex gap-1">
                            <Button
                              size="xs"
                              color="info"
                              onClick={() => reportingUserId !== 'unknown' && openDetails(reportingUserId)}
                              title="View Details"
                              disabled={reportingUserId === 'unknown'}
                            >
                              <Icon icon="solar:info-circle-line-duotone" />
                            </Button>
                            <Button
                              size="xs"
                              color="warning"
                              onClick={() => startEdit(reporting)}
                              title="Edit Reporting"
                            >
                              <Icon icon="solar:pen-line-duotone" />
                            </Button>
                            <Button
                              size="xs"
                              color="purple"
                              onClick={() => reportingUserId !== 'unknown' && fetchHierarchy(reportingUserId)}
                              title="View Hierarchy"
                              disabled={reportingUserId === 'unknown'}
                            >
                              <Icon icon="solar:tree-line-duotone" />
                            </Button>
                            <Button
                              size="xs"
                              color="failure"
                              onClick={() => confirmDelete(reporting._id)}
                              title="Delete Reporting"
                            >
                              <Icon icon="solar:trash-bin-minimalistic-line-duotone" />
                            </Button>
                          </div>
                        </Table.Cell>
                      </Table.Row>
                    )
                  })}
                </Table.Body>
              </Table>
            </div>

            {/* Pagination Footer */}
            {pagination && pagination.totalPages > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-4 border-t border-gray-200 dark:border-gray-700 mt-4">
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left">
                  {(() => {
                    const start = (pagination.currentPage - 1) * pagination.limit + 1;
                    const end = Math.min(start + existingReporting.length - 1, pagination.totalItems);
                    return (
                      <span>
                        Showing {start}-{end} of {pagination.totalItems} item{pagination.totalItems !== 1 ? 's' : ''}
                      </span>
                    );
                  })()}
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                  <div className="flex items-center gap-2 text-xs sm:text-sm w-full sm:w-auto justify-center">
                    <span className="text-gray-600 dark:text-gray-400 whitespace-nowrap">Rows:</span>
                    <Select 
                      value={String(pageSize)} 
                      onChange={(e) => { 
                        setPageSize(parseInt(e.target.value, 10)); 
                        setCurrentPage(1); 
                      }} 
                      className="w-20"
                    >
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </Select>
                  </div>
                  <Pagination
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    onPageChange={(page) => setCurrentPage(Math.max(page, 1))}
                    showIcons
                  />
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Details Modal */}
      {detailOpenUserId && (
        <Modal show={true} onClose={closeDetails} size="md">
          <Modal.Header>
            Details for {users.find(u => u._id === detailOpenUserId)?.name ?? 'User'}
          </Modal.Header>
          <Modal.Body className="space-y-4">
            <div>
              <Label value="User Information" />
              <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p><strong>Name:</strong> {users.find(u => u._id === detailOpenUserId)?.name}</p>
                <p><strong>Email:</strong> {users.find(u => u._id === detailOpenUserId)?.email || 'N/A'}</p>
                <p><strong>User ID:</strong> {detailOpenUserId}</p>
              </div>
            </div>
            <div>
              <Label value="Reporting Context" />
              <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  This user is configured to report to others in the reporting structure.
                  Use the context field in the main form to specify the reporting relationship details.
                </p>
              </div>
            </div>
            <div>
              <Label value="Additional Notes / Context" />
              <TextInput
                value={detailNotes[detailOpenUserId] || ''}
                onChange={(e) => setDetailNotes(prev => ({ ...prev, [detailOpenUserId]: e.target.value }))}
                placeholder="Enter additional details about this user's reporting role..."
                className="w-full"
              />
            </div>
          </Modal.Body>
          <Modal.Footer className="flex justify-end">
            <Button color="gray" onClick={closeDetails} className="mr-2">
              Cancel
            </Button>
            <Button onClick={saveDetailNotes}>
              Save Notes
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <Modal show={true} onClose={cancelDelete} size="md">
          <Modal.Header>Confirm Delete</Modal.Header>
          <Modal.Body>
            <div className="text-center">
              <Icon icon="solar:danger-triangle-line-duotone" className="text-red-500 text-4xl mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Are you sure you want to delete this user reporting?
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This action cannot be undone.
              </p>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button color="failure" onClick={() => handleDelete(deleteConfirmId)}>
              <Icon icon="solar:trash-bin-minimalistic-line-duotone" className="mr-2" />
              Delete
            </Button>
            <Button color="gray" onClick={cancelDelete}>
              Cancel
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Hierarchy Tree Modal */}
      {hierarchyModalOpen && (
        <Modal show={true} onClose={closeHierarchyModal} size="4xl">
          <Modal.Header>
            <div className="flex items-center gap-2">
              <Icon icon="solar:tree-line-duotone" className="text-purple-600" />
              <span>User Hierarchy Tree</span>
            </div>
          </Modal.Header>
          <Modal.Body>
            {hierarchyLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <span className="ml-3 text-gray-600">Loading hierarchy...</span>
              </div>
            ) : hierarchyData ? (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon icon="solar:info-circle-line-duotone" className="text-purple-600" />
                    <span className="font-medium text-gray-900 dark:text-white">Hierarchy Structure</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    This tree shows the complete reporting structure for the selected user.
                  </p>
                </div>

                <div className="max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  {Array.isArray(hierarchyData) ? (
                    hierarchyData.map((item: any, index: number) => (
                      <TreeNode key={index} node={item} />
                    ))
                  ) : (
                    <TreeNode node={hierarchyData} />
                  )}
                </div>

                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <Icon icon="solar:info-circle-line-duotone" />
                    <span className="font-medium">Legend:</span>
                  </div>

                  {/* User Information */}
                  <div className="mb-3">
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">User Information:</div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Icon icon="solar:shield-user-line-duotone" className="text-green-500" />
                        <Badge color="success" className="text-xs">Role</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon icon="solar:phone-line-duotone" className="text-blue-400" />
                        <span className="text-gray-600 dark:text-gray-400">Mobile</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon icon="solar:buildings-2-line-duotone" className="text-purple-400" />
                        <span className="text-gray-600 dark:text-gray-400">Company</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon icon="solar:layers-line-duotone" className="text-orange-400" />
                        <Badge color="warning" className="text-xs">Level</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon icon="solar:check-circle-line-duotone" className="text-green-400" />
                        <span className="text-gray-600 dark:text-gray-400">Status</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon icon="solar:shield-check-line-duotone" className="text-blue-400" />
                        <span className="text-gray-600 dark:text-gray-400">Permissions</span>
                      </div>
                    </div>
                  </div>

                  {/* Project Information */}
                  <div className="mb-3">
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Project Information:</div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Icon icon="solar:buildings-line-duotone" className="text-blue-500" />
                        <Badge color="info" className="text-xs">Project</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon icon="solar:map-point-line-duotone" className="text-orange-400" />
                        <span className="text-gray-600 dark:text-gray-400">Location</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon icon="solar:code-line-duotone" className="text-purple-400" />
                        <span className="text-gray-600 dark:text-gray-400">Developer</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon icon="solar:crown-line-duotone" className="text-yellow-400" />
                        <span className="text-gray-600 dark:text-gray-400">Owner</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon icon="solar:users-group-rounded-line-duotone" className="text-green-400" />
                        <span className="text-gray-600 dark:text-gray-400">Members</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon icon="solar:user-check-line-duotone" className="text-blue-400" />
                        <span className="text-gray-600 dark:text-gray-400">Managers</span>
                      </div>
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div>
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Additional Information:</div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Icon icon="solar:document-text-line-duotone" className="text-gray-500" />
                        <span className="text-gray-600 dark:text-gray-400">Context</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon icon="solar:calendar-line-duotone" className="text-gray-500" />
                        <span className="text-gray-600 dark:text-gray-400">Dates</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Icon icon="solar:tag-line-duotone" className="text-gray-500" />
                        <span className="text-gray-600 dark:text-gray-400">Tags</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Icon icon="solar:file-text-line-duotone" className="text-4xl text-gray-400 mb-2" />
                <p className="text-gray-500">No hierarchy data available</p>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button color="gray" onClick={closeHierarchyModal}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
};

export default UserReportingPage;
