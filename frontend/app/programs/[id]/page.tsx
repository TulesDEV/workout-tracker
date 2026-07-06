import { ProgramDetail } from "@/components/programs/program-detail";

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProgramDetail programId={Number(id)} />;
}
