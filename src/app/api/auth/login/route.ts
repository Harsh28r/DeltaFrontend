import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const cookie = req.headers.get("cookie") || "";

    const upstream = await fetch(
      "http://localhost:5000/api/superadmin/admin-login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(cookie ? { Cookie: cookie } : {}),
        },
        body: JSON.stringify(body),
      }
    );

    const text = await upstream.text();
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch {
      // not JSON
    }

    const token: string | undefined = data?.token || data?.accessToken;
    const headers: Record<string, string> = {
      "Content-Type": upstream.headers.get("content-type") || "application/json",
      "Access-Control-Expose-Headers": "Authorization, x-auth-token",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
      headers["x-auth-token"] = token;
    }

    return new NextResponse(token ? JSON.stringify(data) : text, {
      status: upstream.status,
      headers,
    });
  } catch (err: any) {
    return NextResponse.json(
      { message: err?.message || "Proxy error" },
      { status: 500 }
    );
  }
}


