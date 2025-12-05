'use client'

import React from 'react'

interface RetroVisualizerProps {
  isPlaying: boolean
}

export function RetroVisualizer({ isPlaying }: RetroVisualizerProps) {
  return (
    <div className="flex items-end space-x-1 h-8">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className={`
            w-1 bg-gradient-to-t from-primary to-primary/60 rounded-t-sm transition-all duration-300
            ${isPlaying
              ? `animate-pulse opacity-80 animate-bounce-${index % 3 === 0 ? 'slow' : index % 3 === 1 ? 'medium' : 'fast'}`
              : 'opacity-30'
            }
          `}
          style={{
            height: isPlaying ? `${Math.random() * 80 + 20}%` : '20%',
            animationDelay: isPlaying ? `${index * 0.1}s` : '0s',
            animationDuration: isPlaying ? `${1 + Math.random() * 0.5}s` : '2s',
          }}
        />
      ))}
    </div>
  )
}
