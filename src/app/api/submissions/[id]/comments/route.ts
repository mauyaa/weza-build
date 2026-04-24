import { NextRequest } from "next/server";
import { z } from "zod";
import { created } from "@/lib/api";
import { handleDomain, requireSession } from "@/lib/guard";
import { addComment } from "@/lib/repo";

const schema = z.object({ body: z.string().min(1).max(4000) });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireSession();
  if (!("profile" in guard)) return guard;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return handleDomain(new Error("Invalid comment"));
  try {
    const comment = await addComment({
      submissionId: params.id,
      actor: guard.profile,
      body: parsed.data.body,
    });
    return created({ comment }, "Comment added", "commented");
  } catch (err) {
    return handleDomain(err);
  }
}
