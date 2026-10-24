import { notFound } from "next/navigation";
import { getSpaceById } from "@/lib/spaces";
import SpaceForm from "@/components/admin/SpaceForm";

export const dynamic = "force-dynamic";

export default async function EditSpacePage(props: PageProps<"/admin/spaces/[id]/edit">) {
  const { id } = await props.params;
  const space = await getSpaceById(id);
  if (!space) notFound();

  return (
    <div className="max-w-2xl">
      <h1 className="mb-4 text-xl font-semibold">Edit {space.name}</h1>
      <SpaceForm initial={space} spaceId={space.id} />
    </div>
  );
}
