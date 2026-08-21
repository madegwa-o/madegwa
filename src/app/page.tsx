

import { getCurrentUser} from "@/lib/auth/getCurrentUser";
import {redirect} from "next/navigation";

export default async function HomePage() {
    const user = await getCurrentUser();

    console.log("user: ", user)
    if (user) {
        redirect(`/${user.username}`);
    }



    return (
        <main className="min-h-dvh px-8 py-12 text-foreground lg:px-16 flex items-center justify-center p-6">
            <div className="mx-auto max-w-3xl w-full">
                <header className="mb-12 flex flex-col gap-6 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="mb-3 font-mono text-xs uppercase tracking-[0.28em] text-primary">
                            Secure workspace
                        </p>
                        <h1 className="text-4xl font-semibold tracking-tight">Projects</h1>
                        <p className="mt-3 max-w-xl text-muted-foreground">
                            Organize API credentials by product, environment, and team access.
                        </p>
                    </div>


                </header>


                <div className="flex min-h-96 flex-col items-center justify-center rounded-lg  text-center">
                    {/* empty state content */}
                </div>

            </div>
        </main>
    )
}
