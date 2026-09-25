"use client"

import { useState } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"

interface ProductGalleryProps {
  images: string[]
  productName: string
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  return (
    <div className="flex flex-col-reverse md:flex-row gap-4">
      {/* Thumbnails - added lazy loading for non-active thumbnails */}
      <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => setActiveIndex(index)}
            className={`relative w-20 h-24 md:w-20 md:h-28 flex-shrink-0 overflow-hidden transition-all duration-300 ${
              activeIndex === index ? "ring-1 ring-foreground" : "opacity-60 hover:opacity-100"
            }`}
          >
            <Image
              src={image || "/placeholder.svg"}
              alt={`${productName} view ${index + 1}`}
              fill
              sizes="80px"
              loading="lazy"
              className="object-cover"
            />
          </button>
        ))}
      </div>

      {/* Main Image - priority for first image, responsive sizes */}
      <div className="relative flex-1 aspect-[3/4] bg-muted overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0"
          >
            <Image
              src={images[activeIndex] || "/placeholder.svg"}
              alt={productName}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              priority={activeIndex === 0}
              className="object-cover"
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
