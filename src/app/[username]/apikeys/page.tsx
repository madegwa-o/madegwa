// app/[username]/apikeys/page.tsx
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getUserProfile } from "@/lib/DataFetchingFromDb/user/profile";
import { getOwnedApiKeysVisibleToViewer } from "@/lib/access/keys";
import { getProjects } from "@/lib/DataFetchingFromDb/project/profile";
import { ApiKeysPageClient } from "@/components/apikeys/ApiKeysPageClient";

export default async function ApiKeysPage({ params }: { params: Promise<{ username: string }> }) {
    const { username } = await params;
  const viewer = await getCurrentUser();

  console.log("viewer: ", viewer)

    const profileUser = await getUserProfile({ by: "username", value: username.toLowerCase(), fields: ["_id", "username"] });
    if (!profileUser) notFound();

    const ownerId = String(profileUser._id);
    const isOwner = viewer?.id === ownerId;

    const [keys, myProjects] = await Promise.all([
        getOwnedApiKeysVisibleToViewer(ownerId, viewer?.id ?? null),
        isOwner ? getProjects({ filter: { ownerId }, fields: ["_id", "name"] }) : Promise.resolve([]),
    ]);

    return (
        <ApiKeysPageClient
            apiKeys={JSON.parse(JSON.stringify(keys))}
            projects={JSON.parse(JSON.stringify(myProjects))}
            isOwner={isOwner}
        />
    );
}
