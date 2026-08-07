"use client"

import React from "react"

interface GlassCardProps {
    children: React.ReactNode

    /** Optional class names to extend/override layout */
    className?: string

    /** Accent color used for the hover glow and top edge highlight */
    accent?: string

    /** Disables the hover lift/glow for static contexts */
    interactive?: boolean
}

/**
 * A frosted-glass surface: translucent fill, blurred backdrop,
 * and a soft top-edge highlight that reads as a light catching
 * a beveled edge. Designed to sit on dark backgrounds.
 */
export default function GlassCard({
                                      children,
                                      className = "",
                                      accent = "#ffffff",
                                      interactive = true,
                                  }: GlassCardProps) {
    return (
        <div
            className={[
                "group relative rounded-2xl",
                "border border-white/10",
                "bg-white/[0.06] backdrop-blur-xl",
                "shadow-[0_8px_32px_rgba(0,0,0,0.35)]",
                interactive
                    ? "transition-all duration-300 ease-out hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.09]"
                    : "",
                className,
            ].join(" ")}
            style={
                interactive
                    ? ({
                        "--accent": accent,
                    } as React.CSSProperties)
                    : undefined
            }
        >
            {/* top-edge light catch */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-white/40 to-transparent"
            />

            {/* soft accent glow on hover */}
            {interactive && (
                <div
                    aria-hidden
                    className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{
                        background: `radial-gradient(120px circle at var(--x, 50%) var(--y, 0%), color-mix(in srgb, var(--accent) 18%, transparent), transparent 70%)`,
                    }}
                    onMouseMove={(e) => {
                        const rect = (
                            e.currentTarget
                                .parentElement as HTMLElement
                        ).getBoundingClientRect()

                        e.currentTarget.style.setProperty(
                            "--x",
                            `${e.clientX - rect.left}px`
                        )

                        e.currentTarget.style.setProperty(
                            "--y",
                            `${e.clientY - rect.top}px`
                        )
                    }}
                />
            )}

            <div className="relative p-6">{children}</div>
        </div>
    )
}