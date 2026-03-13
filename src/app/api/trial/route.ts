import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTrialStatus } from "@/lib/trial";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ active: false, daysLeft: 0, started: false });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { freeTrialStartedAt: true, credits: true },
  });

  if (!user) {
    return NextResponse.json({ active: false, daysLeft: 0, started: false });
  }

  const trial = getTrialStatus(user.freeTrialStartedAt);

  return NextResponse.json({
    ...trial,
    credits: user.credits,
  });
}
