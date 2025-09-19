"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Card, Label, Select, TextInput, Button, Modal, Table, Badge } from 'flowbite-react';
import { Icon } from '@iconify/react';
import { API_ENDPOINTS } from '@/lib/config';
import { useAuth } from '@/app/context/AuthContext';
import { useSearchParams } from 'next/navigation';

type TeamType = 'superadmin' | 'project';

interface UserItem {
  _id: string;
  name: string;
  email?: string;
}

interface ReportsToRow {
  userId: string;
  teamType: TeamType;
  projectId?: string;
  context: string;
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
  const [projects, setProjects] = useState<{_id: string; name: string}[]>([]);
  const [targetUser, setTargetUser] = useState<string>('');
  const [reportsTo, setReportsTo] = useState<ReportsToRow[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');
  
  // Existing reporting data
  const [existingReporting, setExistingReporting] = useState<UserReportingData[]>([]);
  const [loadingReporting, setLoadingReporting] = useState(false);
  
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

  // Fetch projects and derive users from them
  useEffect(() => {
    if (!token) return;
    const fetchData = async () => {
      try {
        const resp = await fetch(API_ENDPOINTS.PROJECTS, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (resp.ok) {
          const data = await resp.json();
          const list = data.projects || data || [];
          const userMap = new Map<string, UserItem>();
          list.forEach((p: any) => {
            if (p.owner) userMap.set(p.owner._id, { _id: p.owner._id, name: p.owner.name, email: p.owner.email });
            if (p.members && Array.isArray(p.members)) p.members.forEach((m: any) => userMap.set(m._id, { _id: m._id, name: m.name, email: m.email }));
            if (p.managers && Array.isArray(p.managers)) p.managers.forEach((mm: any) => userMap.set(mm._id, { _id: mm._id, name: mm.name, email: mm.email }));
          });
          setUsers(Array.from(userMap.values()));
          setProjects(list.map((pp: any) => ({ _id: pp._id, name: pp.name })));
        } else {
          setUsers([]);
          setProjects([]);
        }
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
  const fetchExistingReporting = async () => {
    if (!token) return;
    setLoadingReporting(true);
    try {
      const resp = await fetch(API_ENDPOINTS.USER_REPORTING_GET, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resp.ok) {
        const data = await resp.json();
        console.log('Existing reporting data:', data);
        setExistingReporting(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch reporting data:', resp.status);
        setExistingReporting([]);
      }
    } catch (err) {
      console.error('Error fetching reporting data:', err);
      setExistingReporting([]);
    } finally {
      setLoadingReporting(false);
    }
  };

  // Fetch reporting data on component mount
  useEffect(() => {
    if (token) {
      fetchExistingReporting();
    }
  }, [token]);

  const addRow = () => {
    setReportsTo(prev => [
      ...prev,
      { userId: users[0]?._id ?? '', teamType: 'superadmin', projectId: '', context: '' },
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
        fetchExistingReporting();
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
        fetchExistingReporting();
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
                <Select value={row.userId} onChange={(e) => updateRow(idx, { userId: e.target.value })} className="w-full mt-1">
                  <option value="">Select Reporter</option>
                  {users.map(u => (
                    <option key={u._id} value={u._id}>{u.name} {u.email ? `(${u.email})` : ''}</option>
                  ))}
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
                  <Select value={row.projectId || ''} onChange={(e) => updateRow(idx, { projectId: e.target.value })} className="w-full mt-1">
                    <option value="">Select Project</option>
                    {projects.map(p => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
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
          <Button size="xs" color="gray" onClick={fetchExistingReporting} disabled={loadingReporting}>
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
                {existingReporting.map((reporting) => (
                  <Table.Row key={reporting._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <Table.Cell>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {reporting.user.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {reporting.user.email}
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
                      <Badge color="gray" className="text-xs">
                        Level {reporting.level}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="text-sm text-gray-500">
                        {new Date(reporting.createdAt).toLocaleDateString()}
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex gap-1">
                        <Button 
                          size="xs" 
                          color="info" 
                          onClick={() => openDetails(reporting.user._id)}
                          title="View Details"
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
                          onClick={() => fetchHierarchy(reporting.user._id)}
                          title="View Hierarchy"
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
                ))}
              </Table.Body>
            </Table>
          </div>
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
