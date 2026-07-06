import { SessionTracker } from "@/components/session-tracker";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SessionTracker sessionId={Number(id)} />;
}
