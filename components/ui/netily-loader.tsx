"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface NetilyLoaderProps {
  className?: string
  size?: number
  text?: string
}

export function NetilyLoader({ className, size = 48, text }: NetilyLoaderProps) {
  // SVG path for the lucide-react Zap icon
  const boltPath = "M13 2L3 14h9l-1 8 10-12h-9l1-8z"
  
  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <div 
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="100%"
          height="100%"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-primary z-10"
        >
          <motion.path
            d={boltPath}
            initial={{ pathLength: 0, fillOpacity: 0 }}
            animate={{ 
              pathLength: [0, 1, 1, 0], 
              fillOpacity: [0, 1, 1, 0]
            }}
            transition={{
              duration: 2.5,
              ease: "easeInOut",
              repeat: Infinity,
              times: [0, 0.4, 0.8, 1]
            }}
          />
        </motion.svg>
        
        {/* Glow effect */}
        <motion.div
          className="absolute inset-0 bg-primary/30 rounded-full blur-md z-0"
          animate={{
            scale: [0.8, 1.4, 0.8],
            opacity: [0.2, 0.7, 0.2],
          }}
          transition={{
            duration: 2.5,
            ease: "easeInOut",
            repeat: Infinity,
          }}
        />
      </div>
      {text && (
        <motion.p 
          className="text-sm font-medium text-muted-foreground animate-pulse"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {text}
        </motion.p>
      )}
    </div>
  )
}