'use client';

import React, { useEffect, useState } from 'react';
import Lottie from 'lottie-react';
import { motion } from 'framer-motion';

// We'll create a component that cycles through different animations based on state
export default function VoiceAnimation({ isRecording, responseText }) {
  const [animationData, setAnimationData] = useState(null);
  const [currentAnimation, setCurrentAnimation] = useState('idle');

  useEffect(() => {
    // Determine which animation to show
    const animationToShow = isRecording ? 'listening' : 
                           responseText ? 'speaking' : 'idle';
    
    if (animationToShow !== currentAnimation) {
      setCurrentAnimation(animationToShow);
      
      // Dynamic import the appropriate animation JSON
      import(`../animations/${animationToShow}.json`)
        .then(data => {
          setAnimationData(data.default);
        })
        .catch(err => {
          console.error(`Failed to load animation: ${animationToShow}`, err);
          // Fallback to the idle animation if loading fails
          import('../animations/idle.json')
            .then(data => setAnimationData(data.default))
            .catch(() => console.error('Failed to load fallback animation'));
        });
    }
  }, [isRecording, responseText, currentAnimation]);

  // Animated background elements
  const backgroundElements = [
    { 
      className: "absolute -right-16 top-20 w-64 h-64 bg-primary-300/25 dark:bg-primary-600/10 rounded-full mix-blend-multiply blur-3xl",
      animationDelay: "0s",
      animationDuration: "20s"
    },
    { 
      className: "absolute right-20 bottom-10 w-56 h-56 bg-secondary-300/20 dark:bg-secondary-600/10 rounded-full mix-blend-multiply blur-3xl",
      animationDelay: "3s",
      animationDuration: "15s"
    },
    { 
      className: "absolute right-40 top-40 w-24 h-24 bg-accent-300/30 dark:bg-accent-600/15 rounded-full mix-blend-multiply blur-2xl",
      animationDelay: "2s",
      animationDuration: "12s"
    }
  ];

  // Wave animations for when recording
  const waveElements = Array(6).fill(0).map((_, i) => ({
    delay: i * 0.2,
    size: 40 + i * 40,
  }));

  return (
    <div className="relative w-full h-full min-h-[400px] flex items-center justify-center">
      {/* Dynamic background gradient */}
      <div className={`absolute inset-0 transition-colors duration-1000 rounded-3xl overflow-hidden 
        ${isRecording ? 'bg-gradient-to-br from-accent-50/30 to-primary-50/30 dark:from-accent-950/30 dark:to-primary-950/30' : 
        'bg-gradient-to-br from-primary-50/30 to-secondary-50/30 dark:from-primary-950/30 dark:to-secondary-950/30'}`}>
        
        {/* Animated background elements */}
        {backgroundElements.map((el, i) => (
          <motion.div
            key={i}
            className={el.className}
            animate={{
              y: ["0%", "5%", "-5%", "0%"],
              x: ["0%", "-5%", "5%", "0%"],
              scale: [1, 1.05, 0.95, 1]
            }}
            transition={{
              duration: parseInt(el.animationDuration),
              delay: parseInt(el.animationDelay),
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(145,181,254,0.05)_1px,transparent_1px),linear-gradient(to_right,rgba(145,181,254,0.05)_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>
      
      {/* Ripple effect when recording */}
      {isRecording && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {waveElements.map((wave, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full border border-primary-400/30 dark:border-primary-400/20"
              initial={{ width: 0, height: 0, opacity: 0.8 }}
              animate={{ 
                width: wave.size, 
                height: wave.size, 
                opacity: 0 
              }}
              transition={{
                duration: 2,
                delay: wave.delay,
                repeat: Infinity,
                ease: "easeOut"
              }}
            />
          ))}
        </div>
      )}
      
      {/* Main animation container */}
      <div className="relative z-10 w-full max-w-md">
        {animationData ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Lottie 
              animationData={animationData} 
              loop={true}
              style={{ width: '100%', height: '100%' }}
            />
          </motion.div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="animate-pulse flex space-x-2">
              <div className="w-3 h-3 bg-primary-400 rounded-full"></div>
              <div className="w-3 h-3 bg-primary-400 rounded-full"></div>
              <div className="w-3 h-3 bg-primary-400 rounded-full"></div>
            </div>
          </div>
        )}
      </div>
      
      {/* Status indicator */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 py-2 rounded-full bg-surface shadow-modern inline-flex items-center gap-2"
        >
          <span className={`w-2 h-2 rounded-full ${isRecording ? "bg-accent-500 animate-pulse" : 
            responseText ? "bg-primary-500" : "bg-neutral-400"}`} />
          <span className="text-sm text-neutral-600 dark:text-neutral-300">
            {isRecording ? "Listening..." : 
             responseText ? "Responding" : "Ready"}
          </span>
        </motion.div>
      </div>
    </div>
  );
} 