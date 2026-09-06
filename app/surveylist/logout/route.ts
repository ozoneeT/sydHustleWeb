import { NextResponse } from "next/server";

import { deleteSurveyListSession } from "@/lib/surveylist/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  await deleteSurveyListSession();
  return NextResponse.redirect(new URL("/surveylist", request.url), 303);
}
