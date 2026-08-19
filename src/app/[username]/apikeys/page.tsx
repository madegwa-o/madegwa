// app/apikeys/page.tsx
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { getUserByEmail } from "@/lib/users"
import { getApiKeysForUser, type ApiKeySummary } from "@/lib/apikeys"
import { getProjectsForUser } from "@/lib/projects"
import CreateApiKeyDialog from "@/components/apikeys/CreateApiKeyDialog";

function StatusBadge({ apiKey }: { apiKey: ApiKeySummary }) {
    if (apiKey.revoked) {
        return <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Revoked</span>
    }
    if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
        return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Expired</span>
    }
    return <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Active</span>
}

export default async function ApiKeysPage() {
    const session = await getServerSession()
    if (!session?.user?.email) {
        redirect("/auth/login")
    }

    const user = await getUserByEmail(session.user.email)
    if (!user) {
        redirect("/auth/login")
    }

    const [keys, projects] = await Promise.all([
        getApiKeysForUser(user._id.toString()),
        getProjectsForUser(user._id.toString()),
    ])

    return (
        <div className="mx-auto max-w-4xl px-6 py-10">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">API Keys</h1>
                    <p className="text-sm text-gray-500">Keys you own across all your projects.</p>
                </div>
                <CreateApiKeyDialog projects={projects} />
            </div>

            {projects.length === 0 && (
                <p className="mb-4 text-sm text-gray-500">
                    You don&apos;t have any projects yet — create one before generating a key.
                </p>
            )}

            {keys.length === 0 ? (
                <div className="rounded-lg border border-dashed p-10 text-center text-sm text-gray-500">
                    You don&apos;t have any API keys yet.
                </div>
            ) : (
                <div className="overflow-hidden rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                        <tr>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Project</th>
                            <th className="px-4 py-3">Key</th>
                            <th className="px-4 py-3">Scopes</th>
                            <th className="px-4 py-3">Last used</th>
                            <th className="px-4 py-3">Status</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y">
                        {keys.map((key) => (
                            <tr key={key._id}>
                                <td className="px-4 py-3 font-medium">{key.name}</td>
                                <td className="px-4 py-3 text-gray-500">{key.projectName ?? "—"}</td>
                                <td className="px-4 py-3 font-mono text-gray-500">{key.prefix}••••••••••••••••</td>
                                <td className="px-4 py-3 text-gray-500">{key.scopes.join(", ")}</td>
                                <td className="px-4 py-3 text-gray-500">
                                    {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : "Never"}
                                </td>
                                <td className="px-4 py-3">
                                    <StatusBadge apiKey={key} />
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}