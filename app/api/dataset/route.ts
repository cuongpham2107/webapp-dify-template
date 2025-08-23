import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createDataset, getDatasetByUserId } from "@/lib/models/dataset";
import { getUserIdByAsglId } from '@/lib/models/user';
import { getInfo } from "../utils/common";
import { getCurrentUserWithPermissions, hasPermission } from '@/lib/permissions';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parent_id = searchParams.get("parent_id") || null;

    // Get user with permissions
    const userWithPermissions = await getCurrentUserWithPermissions();
    if (!userWithPermissions) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to view datasets
    if (!userWithPermissions.isAdmin && !userWithPermissions.isSuperAdmin && !hasPermission(userWithPermissions, 'datasets.view')) {
      return NextResponse.json({ error: "Insufficient permissions to view datasets" }, { status: 403 });
    }

    const userId = await getUserIdByAsglId(userWithPermissions.asgl_id);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch datasets with permission filtering
    const datasets = await getDatasetByUserId(userId, parent_id);

    return NextResponse.json({ datasets });
  } catch (err: any) {
    console.error('❌ [Dataset API GET] Error:', err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

const datasetSchema = z.object({
  name: z.string().min(1),
  parent_id: z.string().nullable()
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = datasetSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    // Get user with permissions
    const userWithPermissions = await getCurrentUserWithPermissions();
    if (!userWithPermissions) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to create datasets
    if (!userWithPermissions.isAdmin && !userWithPermissions.isSuperAdmin && !hasPermission(userWithPermissions, 'datasets.create')) {
      return NextResponse.json({ error: "Insufficient permissions to create datasets" }, { status: 403 });
    }

    const { name, parent_id } = result.data;
    const dataset = await createDataset(userWithPermissions.asgl_id, name, parent_id);

    return NextResponse.json({ dataset });
  } catch (err: any) {
    console.error('❌ [Dataset API POST] Error:', err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
