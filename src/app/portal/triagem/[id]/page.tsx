import { redirect } from "next/navigation";

export default function TriagemPage({ params }: { params: { id: string } }) {
  const { id } = params;
  redirect(`/portal/sala-espera/${id}`);
}
