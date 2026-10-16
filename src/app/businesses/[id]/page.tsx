import { redirect } from "next/navigation";

export default async function BusinessIndexPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/businesses/${id}/catalog`);
}