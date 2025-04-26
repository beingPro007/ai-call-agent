"use client";
import { motion } from 'framer-motion';
import React from 'react';

export default function ModernMicVisual({ isRecording = false }) {
  // Ripple animation variants
  const rippleVariants = {
    initial: { 
      scale: 0.8,
      opacity: 0 
    },
    animate: {
      scale: [0.8, 1.8],
      opacity: [0.8, 0],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeOut"
      }
    }
  };
  
  // Mic pulse animation
  const micVariants = {
    initial: { 
      scale: 1
    },
    animate: isRecording ? {
      scale: [1, 1.05, 1],
      transition: {
        duration: 1.2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    } : {}
  };
  
  const waveVariants = {
    initial: { 
      pathLength: 0,
      opacity: 0
    },
    animate: {
      pathLength: 1,
      opacity: 1,
      transition: {
        duration: 2,
        ease: "easeInOut"
      }
    }
  };

  // Subtle background animation
  const bgVariants = {
    initial: {
      scale: 1,
    },
    animate: {
      scale: [1, 1.02, 1],
      transition: {
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className="relative w-full h-80 flex items-center justify-center rounded-3xl overflow-hidden">
      {/* Animated background gradient */}
      <motion.div 
        className="absolute inset-0" 
        variants={bgVariants}
        initial="initial"
        animate="animate"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary-100/30 via-secondary-100/20 to-accent-100/20 dark:from-primary-800/20 dark:via-secondary-800/15 dark:to-accent-800/15 rounded-3xl"></div>
        
        {/* Light flares */}
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary-300/20 dark:bg-primary-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-20 w-80 h-80 bg-secondary-300/20 dark:bg-secondary-600/10 rounded-full blur-3xl"></div>
      </motion.div>
      
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(145,181,254,0.03)_1px,transparent_1px),linear-gradient(to_right,rgba(145,181,254,0.03)_1px,transparent_1px)] bg-[size:32px_32px] dark:opacity-30 opacity-70"></div>
      
      {/* Ripple effect when recording */}
      {isRecording && (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            variants={rippleVariants}
            initial="initial"
            animate="animate"
            className="absolute w-32 h-32 rounded-full bg-primary-400/20 dark:bg-primary-500/20"
          />
          <motion.div
            variants={rippleVariants}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.5 }}
            className="absolute w-32 h-32 rounded-full bg-primary-400/20 dark:bg-primary-500/20"
          />
          <motion.div
            variants={rippleVariants}
            initial="initial"
            animate="animate"
            transition={{ delay: 1 }}
            className="absolute w-32 h-32 rounded-full bg-primary-400/20 dark:bg-primary-500/20"
          />
        </div>
      )}
      
      {/* Microphone container */}
      <div className="relative z-10 glassmorphism p-10 rounded-2xl">
        {/* Main microphone icon */}
        <motion.div
          variants={micVariants}
          initial="initial"
          animate="animate"
          className="relative"
        >
          <svg width="64" height="80" viewBox="0 0 64 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Mic glow effect */}
            {isRecording && (
              <motion.ellipse
                cx="32" cy="25" rx="23" ry="20"
                fill="url(#mic-glow)"
                initial={{ opacity: 0.5 }}
                animate={{ opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
            
            {/* Microphone body */}
            <motion.rect
              x="22" y="8" width="20" height="30" rx="10" 
              fill={isRecording ? "url(#mic-gradient-active)" : "url(#mic-gradient)"}
              stroke={isRecording ? "#b91c1c" : "#1d4ed8"}
              strokeWidth="1.5"
              strokeOpacity="0.6"
              initial={{ y: 0 }}
              animate={isRecording ? { y: [0, -2, 0] } : {}}
              transition={{ 
                duration: 0.5, 
                repeat: isRecording ? Infinity : 0,
                ease: "easeInOut"
              }}
            />
            
            {/* Mic stand */}
            <motion.path 
              d="M32 38V50" 
              stroke="currentColor" 
              strokeOpacity="0.7"
              strokeWidth="2" 
              strokeLinecap="round"
            />
            
            {/* Mic base */}
            <motion.path 
              d="M20 50H44" 
              stroke="currentColor" 
              strokeOpacity="0.7"
              strokeWidth="2" 
              strokeLinecap="round"
            />
            
            {/* Sound waves */}
            {isRecording && (
              <>
                <motion.path
                  d="M16 28C16 28 10 28 10 28C10 16 20 8 32 8C44 8 54 16 54 28C54 28 48 28 48 28"
                  stroke="url(#wave-gradient)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  variants={waveVariants}
                  initial="initial"
                  animate="animate"
                  transition={{ 
                    repeat: Infinity,
                    duration: 1.8
                  }}
                />
                <motion.path
                  d="M20 32C20 32 14 32 14 32C14 20 22 12 32 12C42 12 50 20 50 32C50 32 44 32 44 32"
                  stroke="url(#wave-gradient)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  variants={waveVariants}
                  initial="initial"
                  animate="animate"
                  transition={{ 
                    repeat: Infinity,
                    duration: 1.8,
                    delay: 0.4
                  }}
                />
              </>
            )}
            
            {/* Gradients definitions */}
            <defs>
              <linearGradient id="mic-gradient" x1="22" y1="8" x2="42" y2="38" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#608dfc" />
                <stop offset="1" stopColor="#2549eb" />
              </linearGradient>
              <linearGradient id="mic-gradient-active" x1="22" y1="8" x2="42" y2="38" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#ef4444" />
                <stop offset="1" stopColor="#b91c1c" />
              </linearGradient>
              <linearGradient id="wave-gradient" x1="10" y1="20" x2="54" y2="20" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#608dfc" />
                <stop offset="1" stopColor="#a78bfa" />
              </linearGradient>
              <radialGradient id="mic-glow" cx="32" cy="25" r="20" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#ef444460" />
                <stop offset="1" stopColor="#ef444400" />
              </radialGradient>
            </defs>
          </svg>
        </motion.div>
      </div>
      
      {/* Status indicator */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface shadow-modern"
        >
          <span className={`w-2.5 h-2.5 rounded-full ${isRecording ? "bg-accent-500 animate-pulse" : "bg-neutral-400"}`}></span>
          <p className={`text-sm font-medium ${isRecording ? "text-accent-600 dark:text-accent-400" : "text-neutral-600 dark:text-neutral-400"}`}>
            {isRecording ? "Listening..." : "Ready"}
          </p>
        </motion.div>
      </div>
    </div>
  );
} 