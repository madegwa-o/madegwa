'use client'

import React, { useRef, useEffect, useState } from 'react'

export default function Component() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mousePositionRef = useRef({ x: -9999, y: -9999 })
  const isTouchingRef = useRef(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let particles: {
      x: number; y: number; baseX: number; baseY: number
      size: number; color: string; scatteredColor: string
      life: number; isCAR: boolean
    }[] = []

    let textImageData: ImageData | null = null
    let carStartX = 0

    const updateCanvasSize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      setIsMobile(window.innerWidth < 768)
    }

    updateCanvasSize()

    function createTextImage() {
      if (!ctx || !canvas) return
      const W = canvas.width, H = canvas.height
      const isMob = W < 768
      const fontSize = isMob ? 80 : 140
      const gap = isMob ? 30 : 60

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = 'white'
      ctx.font = `900 ${fontSize}px Arial Black, Arial, sans-serif`
      ctx.textBaseline = 'middle'
      ctx.textAlign = 'center'

      const osW = ctx.measureText('OS').width
      const carW = ctx.measureText('CAR').width
      const totalW = osW + gap + carW
      const startX = W / 2 - totalW / 2

      ctx.fillText('OS', startX + osW / 2, H / 2)
      ctx.fillText('CAR', startX + osW + gap + carW / 2, H / 2)

      textImageData = ctx.getImageData(0, 0, W, H)
      ctx.clearRect(0, 0, W, H)

      carStartX = startX + osW + gap
    }

    function createParticle() {
      if (!ctx || !canvas || !textImageData) return null
      const W = canvas.width, H = canvas.height
      const data = textImageData.data

      for (let attempt = 0; attempt < 150; attempt++) {
        const x = Math.floor(Math.random() * W)
        const y = Math.floor(Math.random() * H)
        if (data[(y * W + x) * 4 + 3] > 128) {
          const isCAR = x >= carStartX
          return {
            x, y, baseX: x, baseY: y,
            size: Math.random() * 1.2 + 0.4,
            color: 'white',
            scatteredColor: isCAR ? '#FF9900' : '#00DCFF',
            isCAR,
            life: Math.floor(Math.random() * 120 + 60)
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
        const p = createParticle()
        if (p) particles.push(p)
      }
    }

    let animationFrameId: number

    function animate() {
      if (!ctx || !canvas) return
      ctx.fillStyle = 'black'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const { x: mouseX, y: mouseY } = mousePositionRef.current
      const maxDistance = 200

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        const dx = mouseX - p.x
        const dy = mouseY - p.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < maxDistance && (isTouchingRef.current || !('ontouchstart' in window))) {
          const force = (maxDistance - distance) / maxDistance
          const angle = Math.atan2(dy, dx)
          p.x = p.baseX - Math.cos(angle) * force * 55
          p.y = p.baseY - Math.sin(angle) * force * 55
          ctx.fillStyle = p.scatteredColor
        } else {
          p.x += (p.baseX - p.x) * 0.1
          p.y += (p.baseY - p.y) * 0.1
          ctx.fillStyle = 'white'
        }

        ctx.fillRect(p.x, p.y, p.size, p.size)

        p.life--
        if (p.life <= 0) {
          const np = createParticle()
          if (np) particles[i] = np
          else { particles.splice(i, 1); i-- }
        }
      }

      const base = 7000
      const target = Math.floor(base * Math.sqrt((canvas.width * canvas.height) / (1920 * 1080)))
      while (particles.length < target) {
        const np = createParticle()
        if (np) particles.push(np)
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

    const handleMouseMove = (e: MouseEvent) => {
      mousePositionRef.current = { x: e.clientX, y: e.clientY }
    }
    const handleMouseLeave = () => {
      mousePositionRef.current = { x: -9999, y: -9999 }
    }
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        e.preventDefault()
        mousePositionRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      }
    }
    const handleTouchStart = () => { isTouchingRef.current = true }
    const handleTouchEnd = () => {
      isTouchingRef.current = false
      mousePositionRef.current = { x: -9999, y: -9999 }
    }

    window.addEventListener('resize', handleResize)
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseleave', handleMouseLeave)
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
    canvas.addEventListener('touchstart', handleTouchStart)
    canvas.addEventListener('touchend', handleTouchEnd)

    return () => {
      window.removeEventListener('resize', handleResize)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseleave', handleMouseLeave)
      canvas.removeEventListener('touchmove', handleTouchMove)
      canvas.removeEventListener('touchstart', handleTouchStart)
      canvas.removeEventListener('touchend', handleTouchEnd)
      cancelAnimationFrame(animationFrameId)
    }
  }, [isMobile])

  return (
      <div className="relative w-full h-dvh bg-black">
        <canvas
            ref={canvasRef}
            className="w-full h-full absolute top-0 left-0 touch-none"
            aria-label="Interactive particle effect spelling OS and CAR"
        />
      </div>
  )
}