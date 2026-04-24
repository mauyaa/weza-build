import { NextRequest } from "next/server";
import { z } from "zod";
import { ok } from "@/lib/api";
import { handleDomain, requireSession } from "@/lib/guard";
import { decide } from "@/lib/repo";

const schema = z.object({
  action: z.enum(["request_revision", "approve", "reject"]),
  note: z.string().max(2000).default(""),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireSession();
  if (!("profile" in guard)) return guard;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return handleDomain(new Error("Invalid decision"));
  try {
    const result = await decide({
      submissionId: params.id,
      actor: guard.profile,
      action: parsed.data.action,
      note: parsed.data.note,
    });
    return ok(result, "Decision recorded", "decided");
  } catch (err) {
    return handleDomain(err);
  }
}
