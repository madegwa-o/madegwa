"use client"

import React, { useRef, useEffect, useState } from "react"

export interface LogoConfig {
    /** Raw SVG path `d` attribute data */
    path: string

    /** Color particles turn when scattered by the cursor/touch */
    color: string

    /** Target rendered height of this specific logo on desktop */
    height?: number

    /** Target rendered height of this specific logo on mobile */
    mobileHeight?: number
}

interface LogoParticlesProps {
    /** Logos to render left-to-right */
    logos: LogoConfig[]

    /** Gap between logos, in px, at desktop size */
    gap?: number

    /** Gap between logos, in px, at mobile size */
    mobileGap?: number

    /** Default target rendered height of each logo, in px */
    height?: number

    /** Default target rendered height of each logo, in px, at mobile size */
    mobileHeight?: number
}

interface Region {
    startX: number
    endX: number
    color: string
}

/**
 * Computes a path's bounding box using the browser's native SVG geometry.
 */
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

    return {
        minX: box.x,
        minY: box.y,
        maxX: box.x + box.width,
        maxY: box.y + box.height,
    }
}

export default function LogoParticles({
                                          logos,
                                          gap = 60,
                                          mobileGap = 30,
                                          height = 140,
                                          mobileHeight = 80,
                                      }: LogoParticlesProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    const mousePositionRef = useRef({
        x: -9999,
        y: -9999,
    })

    const isTouchingRef = useRef(false)

    const [isMobile, setIsMobile] = useState(false)

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

        // Build Path2D + bbox once per logo
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

            const defaultHeight = isMob
                ? mobileHeight
                : height

            const g = isMob
                ? mobileGap
                : gap

            ctx.clearRect(0, 0, W, H)

            ctx.fillStyle = "white"

            /*
             * Pass 1:
             * Calculate each logo's width independently based on
             * its own height.
             */
            const widths = bboxes.map((bbox, i) => {
                const pathHeight = bbox.maxY - bbox.minY

                if (pathHeight <= 0) return 0

                const logo = logos[i]

                const logoHeight = isMob
                    ? (logo.mobileHeight ?? defaultHeight)
                    : (logo.height ?? defaultHeight)

                const scale = logoHeight / pathHeight

                return (bbox.maxX - bbox.minX) * scale
            })

            const totalW =
                widths.reduce((sum, width) => sum + width, 0) +
                g * Math.max(logos.length - 1, 0)

            /*
             * Pass 2:
             * Draw each logo and record its x-region.
             */
            let cursorX = W / 2 - totalW / 2

            regions = []

            logos.forEach((logo, i) => {
                const bbox = bboxes[i]

                const pathHeight = bbox.maxY - bbox.minY

                if (pathHeight <= 0) return

                /*
                 * Use the specific logo height if supplied.
                 * Otherwise fall back to the global default.
                 */
                const logoHeight = isMob
                    ? (logo.mobileHeight ?? defaultHeight)
                    : (logo.height ?? defaultHeight)

                const scale = logoHeight / pathHeight

                const width = widths[i]

                const destX = cursorX

                const destY =
                    H / 2 - logoHeight / 2

                const tx =
                    destX - bbox.minX * scale

                const ty =
                    destY - bbox.minY * scale

                ctx.save()

                ctx.translate(tx, ty)

                ctx.scale(scale, scale)

                ctx.fill(path2Ds[i])

                ctx.restore()

                regions.push({
                    startX: destX,
                    endX: destX + width,
                    color: logo.color,
                })

                cursorX += width + g
            })

            /*
             * Capture the rendered logos so particles can
             * be generated from their pixels.
             */
            textImageData = ctx.getImageData(
                0,
                0,
                W,
                H
            )

            ctx.clearRect(0, 0, W, H)
        }

        function colorForX(x: number): string {
            for (const region of regions) {
                if (
                    x >= region.startX &&
                    x <= region.endX
                ) {
                    return region.color
                }
            }

            // Fallback to the nearest/last region
            return (
                regions[regions.length - 1]?.color ??
                "#ffffff"
            )
        }

        function createParticle() {
            if (!ctx || !canvas || !textImageData) {
                return null
            }

            const W = canvas.width
            const H = canvas.height

            const data = textImageData.data

            for (let attempt = 0; attempt < 150; attempt++) {
                const x = Math.floor(Math.random() * W)

                const y = Math.floor(Math.random() * H)

                const alpha =
                    data[(y * W + x) * 4 + 3]

                if (alpha > 128) {
                    return {
                        x,
                        y,

                        baseX: x,
                        baseY: y,

                        size:
                            Math.random() * 1.2 + 0.4,

                        scatteredColor:
                            colorForX(x),

                        life:
                            Math.floor(
                                Math.random() * 120 + 60
                            ),
                    }
                }
            }

            return null
        }

        function createInitialParticles() {
            if (!canvas) return

            const base = 7000

            const count = Math.floor(
                base *
                Math.sqrt(
                    (canvas.width * canvas.height) /
                    (1920 * 1080)
                )
            )

            for (let i = 0; i < count; i++) {
                const particle = createParticle()

                if (particle) {
                    particles.push(particle)
                }
            }
        }

        let animationFrameId: number

        function animate() {
            if (!ctx || !canvas) return

            ctx.fillStyle = "black"

            ctx.fillRect(
                0,
                0,
                canvas.width,
                canvas.height
            )

            const {
                x: mouseX,
                y: mouseY,
            } = mousePositionRef.current

            const maxDistance = 200

            for (
                let i = 0;
                i < particles.length;
                i++
            ) {
                const particle = particles[i]

                const dx =
                    mouseX - particle.x

                const dy =
                    mouseY - particle.y

                const distance = Math.sqrt(
                    dx * dx + dy * dy
                )

                if (
                    distance < maxDistance &&
                    (
                        isTouchingRef.current ||
                        !("ontouchstart" in window)
                    )
                ) {
                    const force =
                        (maxDistance - distance) /
                        maxDistance

                    const angle =
                        Math.atan2(dy, dx)

                    particle.x =
                        particle.baseX -
                        Math.cos(angle) *
                        force *
                        55

                    particle.y =
                        particle.baseY -
                        Math.sin(angle) *
                        force *
                        55

                    ctx.fillStyle =
                        particle.scatteredColor
                } else {
                    particle.x +=
                        (particle.baseX -
                            particle.x) *
                        0.1

                    particle.y +=
                        (particle.baseY -
                            particle.y) *
                        0.1

                    ctx.fillStyle = "white"
                }

                ctx.fillRect(
                    particle.x,
                    particle.y,
                    particle.size,
                    particle.size
                )

                particle.life--

                if (particle.life <= 0) {
                    const newParticle =
                        createParticle()

                    if (newParticle) {
                        particles[i] = newParticle
                    } else {
                        particles.splice(i, 1)
                        i--
                    }
                }
            }

            /*
             * Maintain the desired number of particles.
             */
            const base = 7000

            const target = Math.floor(
                base *
                Math.sqrt(
                    (canvas.width * canvas.height) /
                    (1920 * 1080)
                )
            )

            while (particles.length < target) {
                const newParticle =
                    createParticle()

                if (newParticle) {
                    particles.push(newParticle)
                } else {
                    break
                }
            }

            animationFrameId =
                requestAnimationFrame(animate)
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

        // Tracked on `window`, not the canvas, so the cursor is still
        // picked up when a card (or any element) sits on top of the
        // canvas and intercepts the pointer.
        const handleMouseMove = (
            event: MouseEvent
        ) => {
            mousePositionRef.current = {
                x: event.clientX,
                y: event.clientY,
            }
        }

        const handleMouseLeave = () => {
            mousePositionRef.current = {
                x: -9999,
                y: -9999,
            }
        }

        const handleTouchMove = (
            event: TouchEvent
        ) => {
            if (event.touches.length > 0) {
                mousePositionRef.current = {
                    x: event.touches[0].clientX,
                    y: event.touches[0].clientY,
                }
            }
        }

        const handleTouchStart = () => {
            isTouchingRef.current = true
        }

        const handleTouchEnd = () => {
            isTouchingRef.current = false

            mousePositionRef.current = {
                x: -9999,
                y: -9999,
            }
        }

        window.addEventListener(
            "resize",
            handleResize
        )

        window.addEventListener(
            "mousemove",
            handleMouseMove
        )

        document.documentElement.addEventListener(
            "mouseleave",
            handleMouseLeave
        )

        // passive: true (no preventDefault) so pages with real content
        // on top of this background keep normal touch-scroll behavior.
        window.addEventListener(
            "touchmove",
            handleTouchMove,
            { passive: true }
        )

        window.addEventListener(
            "touchstart",
            handleTouchStart,
            { passive: true }
        )

        window.addEventListener(
            "touchend",
            handleTouchEnd
        )

        return () => {
            window.removeEventListener(
                "resize",
                handleResize
            )

            window.removeEventListener(
                "mousemove",
                handleMouseMove
            )

            document.documentElement.removeEventListener(
                "mouseleave",
                handleMouseLeave
            )

            window.removeEventListener(
                "touchmove",
                handleTouchMove
            )

            window.removeEventListener(
                "touchstart",
                handleTouchStart
            )

            window.removeEventListener(
                "touchend",
                handleTouchEnd
            )

            cancelAnimationFrame(
                animationFrameId
            )
        }
    }, [
        logos,
        gap,
        mobileGap,
        height,
        mobileHeight,
        isMobile,
    ])

    return (
        <div className="fixed inset-0 w-full h-dvh bg-black -z-10">
            <canvas
                ref={canvasRef}
                className="w-full h-full pointer-events-none"
                aria-hidden="true"
            />
        </div>
    )
}