"use client"

import React, { useRef, useEffect, useState } from "react"
import { useTheme } from "@/components/theme-provider"

export interface LogoConfig {
    path: string
    color: string
    height?: number
    mobileHeight?: number
}

interface LogoParticlesProps {
    logos: LogoConfig[]
    gap?: number
    mobileGap?: number
    height?: number
    mobileHeight?: number
}

interface Region {
    startX: number
    endX: number
    color: string
}

// Mirrors :root / .dark in globals.css. Kept as literal hex here so
// the canvas never has to round-trip through getComputedStyle — that
// read raced against ThemeProvider's own class-toggling effect and
// could grab a stale value on the exact render the theme changed.
const THEME_COLORS = {
    light: { background: "#ffffff", foreground: "#0a0a0a" }, // --background 0 0% 100%, --foreground 0 0% 3.9%
    dark: { background: "#000000", foreground: "#fafafa" },  // --background 0 0% 0%, --foreground 0 0% 98%
} as const

function resolveEffectiveTheme(theme: "light" | "dark" | "system"): "light" | "dark" {
    if (theme === "light" || theme === "dark") return theme
    if (typeof window === "undefined") return "light"
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function getPathBBox(d: string) {
    const svgNS = "http://www.w3.org/2000/svg"
    const svg = document.createElementNS(svgNS, "svg")
    svg.setAttribute("width", "0")
    svg.setAttribute("height", "0")
    svg.style.position = "absolute"
    svg.style.overflow = "hidden"
    svg.style.pointerEvents = "none"

    const path = document.createElementNS(svgNS, "path")
    path.setAttribute("d", d)
    svg.appendChild(path)
    document.body.appendChild(svg)

    const box = path.getBBox()
    document.body.removeChild(svg)

    return { minX: box.x, minY: box.y, maxX: box.x + box.width, maxY: box.y + box.height }
}

export default function LogoParticles({
                                          logos,
                                          gap = 60,
                                          mobileGap = 30,
                                          height = 140,
                                          mobileHeight = 80,
                                      }: LogoParticlesProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const mousePositionRef = useRef({ x: -9999, y: -9999 })
    const isTouchingRef = useRef(false)
    const [isMobile, setIsMobile] = useState(false)
    const { theme } = useTheme()

    // Resolved "system" once per render, outside the effect, so both
    // the effect's dependency array and its body agree on the same value.
    const effectiveTheme = resolveEffectiveTheme(theme)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext("2d")
        if (!ctx) return
        if (logos.length === 0) return

        let particles: {
            x: number
            y: number
            baseX: number
            baseY: number
            size: number
            scatteredColor: string
            life: number
        }[] = []

        let textImageData: ImageData | null = null
        let regions: Region[] = []

        const { background: bgColor, foreground: fgColor } = THEME_COLORS[effectiveTheme]

        const path2Ds = logos.map((logo) => new Path2D(logo.path))
        const bboxes = logos.map((logo) => getPathBBox(logo.path))

        const updateCanvasSize = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
            setIsMobile(window.innerWidth < 768)
        }

        updateCanvasSize()

        function createTextImage() {
            if (!ctx || !canvas) return

            const W = canvas.width
            const H = canvas.height
            const isMob = W < 768
            const defaultHeight = isMob ? mobileHeight : height
            const g = isMob ? mobileGap : gap

            ctx.clearRect(0, 0, W, H)
            ctx.fillStyle = fgColor

            const widths = bboxes.map((bbox, i) => {
                const pathHeight = bbox.maxY - bbox.minY
                if (pathHeight <= 0) return 0
                const logo = logos[i]
                const logoHeight = isMob ? (logo.mobileHeight ?? defaultHeight) : (logo.height ?? defaultHeight)
                const scale = logoHeight / pathHeight
                return (bbox.maxX - bbox.minX) * scale
            })

            const totalW = widths.reduce((sum, w) => sum + w, 0) + g * Math.max(logos.length - 1, 0)
            let cursorX = W / 2 - totalW / 2
            regions = []

            logos.forEach((logo, i) => {
                const bbox = bboxes[i]
                const pathHeight = bbox.maxY - bbox.minY
                if (pathHeight <= 0) return

                const isMob = W < 768
                const logoHeight = isMob ? (logo.mobileHeight ?? defaultHeight) : (logo.height ?? defaultHeight)
                const scale = logoHeight / pathHeight
                const width = widths[i]
                const destX = cursorX
                const destY = H / 2 - logoHeight / 2
                const tx = destX - bbox.minX * scale
                const ty = destY - bbox.minY * scale

                ctx.save()
                ctx.translate(tx, ty)
                ctx.scale(scale, scale)
                ctx.fill(path2Ds[i])
                ctx.restore()

                regions.push({ startX: destX, endX: destX + width, color: logo.color })
                cursorX += width + g
            })

            textImageData = ctx.getImageData(0, 0, W, H)
            ctx.clearRect(0, 0, W, H)
        }

        function colorForX(x: number): string {
            for (const region of regions) {
                if (x >= region.startX && x <= region.endX) return region.color
            }
            return regions[regions.length - 1]?.color ?? fgColor
        }

        function createParticle() {
            if (!ctx || !canvas || !textImageData) return null
            const W = canvas.width
            const H = canvas.height
            const data = textImageData.data

            for (let attempt = 0; attempt < 150; attempt++) {
                const x = Math.floor(Math.random() * W)
                const y = Math.floor(Math.random() * H)
                const alpha = data[(y * W + x) * 4 + 3]

                if (alpha > 128) {
                    return {
                        x, y,
                        baseX: x, baseY: y,
                        size: Math.random() * 1.2 + 0.4,
                        scatteredColor: colorForX(x),
                        life: Math.floor(Math.random() * 120 + 60),
                    }
                }
            }
            return null
        }

        function createInitialParticles() {
            if (!canvas) return
            const base = 7000
            const count = Math.floor(base * Math.sqrt((canvas.width * canvas.height) / (1920 * 1080)))
            for (let i = 0; i < count; i++) {
                const particle = createParticle()
                if (particle) particles.push(particle)
            }
        }

        let animationFrameId: number

        function animate() {
            if (!ctx || !canvas) return

            ctx.fillStyle = bgColor
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            const { x: mouseX, y: mouseY } = mousePositionRef.current
            const maxDistance = 200

            for (let i = 0; i < particles.length; i++) {
                const particle = particles[i]
                const dx = mouseX - particle.x
                const dy = mouseY - particle.y
                const distance = Math.sqrt(dx * dx + dy * dy)

                if (distance < maxDistance && (isTouchingRef.current || !("ontouchstart" in window))) {
                    const force = (maxDistance - distance) / maxDistance
                    const angle = Math.atan2(dy, dx)
                    particle.x = particle.baseX - Math.cos(angle) * force * 55
                    particle.y = particle.baseY - Math.sin(angle) * force * 55
                    ctx.fillStyle = particle.scatteredColor
                } else {
                    particle.x += (particle.baseX - particle.x) * 0.1
                    particle.y += (particle.baseY - particle.y) * 0.1
                    ctx.fillStyle = fgColor
                }

                ctx.fillRect(particle.x, particle.y, particle.size, particle.size)
                particle.life--

                if (particle.life <= 0) {
                    const newParticle = createParticle()
                    if (newParticle) {
                        particles[i] = newParticle
                    } else {
                        particles.splice(i, 1)
                        i--
                    }
                }
            }

            const base = 7000
            const target = Math.floor(base * Math.sqrt((canvas.width * canvas.height) / (1920 * 1080)))
            while (particles.length < target) {
                const newParticle = createParticle()
                if (newParticle) particles.push(newParticle)
                else break
            }

            animationFrameId = requestAnimationFrame(animate)
        }

        createTextImage()
        createInitialParticles()
        animate()

        const handleResize = () => {
            updateCanvasSize()
            createTextImage()
            particles = []
            createInitialParticles()
        }

        const handleMouseMove = (event: MouseEvent) => {
            mousePositionRef.current = { x: event.clientX, y: event.clientY }
        }
        const handleMouseLeave = () => {
            mousePositionRef.current = { x: -9999, y: -9999 }
        }
        const handleTouchMove = (event: TouchEvent) => {
            if (event.touches.length > 0) {
                mousePositionRef.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }
            }
        }
        const handleTouchStart = () => { isTouchingRef.current = true }
        const handleTouchEnd = () => {
            isTouchingRef.current = false
            mousePositionRef.current = { x: -9999, y: -9999 }
        }

        window.addEventListener("resize", handleResize)
        window.addEventListener("mousemove", handleMouseMove)
        document.documentElement.addEventListener("mouseleave", handleMouseLeave)
        window.addEventListener("touchmove", handleTouchMove, { passive: true })
        window.addEventListener("touchstart", handleTouchStart, { passive: true })
        window.addEventListener("touchend", handleTouchEnd)

        return () => {
            window.removeEventListener("resize", handleResize)
            window.removeEventListener("mousemove", handleMouseMove)
            document.documentElement.removeEventListener("mouseleave", handleMouseLeave)
            window.removeEventListener("touchmove", handleTouchMove)
            window.removeEventListener("touchstart", handleTouchStart)
            window.removeEventListener("touchend", handleTouchEnd)
            cancelAnimationFrame(animationFrameId)
        }
        // effectiveTheme (not raw `theme`) drives the rebuild — this way
        // "system" flips correctly too, without a DOM read.
    }, [logos, gap, mobileGap, height, mobileHeight, isMobile, effectiveTheme])

    return (
        <div className="fixed inset-0 w-full h-dvh -z-10">
            <canvas ref={canvasRef} className="w-full h-full pointer-events-none" aria-hidden="true" />
        </div>
    )
}