import { NextResponse } from "next/server";

import { auth } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";

import {
  PLAN_LIMITS,
  type Plan,
} from "@/lib/plans";

import { isAdmin } from "@/lib/admin";

import { styles } from "@/lib/demo";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          error: "You must be signed in.",
        },
        { status: 401 }
      );
    }

    const admin = await isAdmin(userId);

    let user = await prisma.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          clerkUserId: userId,
          plan: "free",
          generationsUsed: 0,
        },
      });
    }

    const plan = user.plan as Plan;

    const limits = PLAN_LIMITS[plan];

    const remaining = Math.max(
      limits.generations -
        user.generationsUsed,
      0
    );

    if (admin) {
      return NextResponse.json({
        plan,
        generationsUsed: user.generationsUsed,
        generationsLimit: null,
        remaining: null,
        designsPerGeneration:
          styles.length,
        isAdmin: true,
      });
    }

    return NextResponse.json({
      plan,
      generationsUsed: user.generationsUsed,
      generationsLimit:
        limits.generations,
      remaining,
      designsPerGeneration:
        limits.designs,
      isAdmin: false,
    });
  } catch (error) {
    console.error(
      "Failed to load user usage:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load account usage.",
      },
      { status: 500 }
    );
  }
}