import { NextRequest, NextResponse } from 'next/server';

// Mock data - replace with your backend API calls
const mockRoles = [
  {
    id: "1",
    name: "Super Admin",
    description: "Full access to all system features and settings",
    permissions: ["all"],
    status: "active",
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01"
  },
  {
    id: "2",
    name: "Admin",
    description: "Administrative access to most system features",
    permissions: ["users.view", "users.create", "users.edit", "roles.view", "content.view", "content.create", "reports.view"],
    status: "active",
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01"
  },
  {
    id: "3",
    name: "Manager",
    description: "Management access to team and project features",
    permissions: ["team.view", "projects.view", "projects.create", "reports.view"],
    status: "active",
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01"
  },
  {
    id: "4",
    name: "User",
    description: "Basic user access to assigned features",
    permissions: ["profile.view", "assigned-tasks.view"],
    status: "active",
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01"
  }
];

// GET /api/roles - Get all roles
export async function GET(request: NextRequest) {
  try {
    // In real app, fetch from your backend
    // const response = await fetch('your-backend-url/api/roles');
    // const roles = await response.json();
    
    return NextResponse.json({ 
      success: true, 
      data: mockRoles 
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch roles' },
      { status: 500 }
    );
  }
}

// POST /api/roles - Create new role
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { success: false, error: 'Role name is required' },
        { status: 400 }
      );
    }

    // In real app, send to your backend
    // const response = await fetch('your-backend-url/api/roles', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(body)
    // });

    const newRole = {
      id: Date.now().toString(),
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({ 
      success: true, 
      data: newRole,
      message: 'Role created successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create role' },
      { status: 500 }
    );
  }
}
