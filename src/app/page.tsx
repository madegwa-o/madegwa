import GlassCard from "@/components/glass-card"

export default function HomePage() {
    return (
        <main className="min-h-dvh flex items-center justify-center p-6">
            <GlassCard accent="#0022ff">
                <h3 className="text-white text-lg font-medium">
                    API keys
                </h3>
                <p className="text-white/60 text-sm mt-1">
                    Manage access to your account.
                </p>
            </GlassCard>
        </main>
    )
}