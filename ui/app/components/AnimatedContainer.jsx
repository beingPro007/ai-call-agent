"use client";
import { motion } from 'framer-motion';
import React from 'react';

export default function AnimatedContainer({ 
  children, 
  className = "",
  variant = "default", // default, glass, raised, bordered
  hoverEffect = true,
  pulseEffect = false,
  floatEffect = false,
  delay = 0,
  noAnimation = false,
  onClick = null,
}) {
  const getBaseClass = () => {
    switch(variant) {
      case 'glass':
        return 'glassmorphism';
      case 'raised':
        return 'card shadow-premium';
      case 'bordered':
        return 'border border-neutral-200 dark:border-neutral-800 bg-surface';
      default:
        return 'card';
    }
  };
  
  const animationProps = noAnimation ? {} : {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 15 },
    transition: { 
      duration: 0.5,
      delay: delay,
      ease: [0.16, 1, 0.3, 1]
    },
  };

  // Hover animation properties - subtle and premium
  const hoverAnimations = (hoverEffect && !noAnimation) ? {
    whileHover: { 
      y: -5,
      transition: { 
        duration: 0.3,
        ease: [0.34, 1.56, 0.64, 1]
      } 
    },
    whileTap: onClick ? { 
      scale: 0.98,
      transition: { 
        duration: 0.2,
      } 
    } : {}
  } : {};

  // Combine all animations
  const allAnimations = {
    ...animationProps,
    ...hoverAnimations,
    className: `${getBaseClass()} ${className} 
      ${pulseEffect && !noAnimation ? 'animate-pulse-slow' : ''} 
      ${floatEffect && !noAnimation ? 'animate-float' : ''}
      ${onClick ? 'cursor-pointer' : ''}`.trim(),
    onClick: onClick
  };

  return (
    <motion.div {...allAnimations}>
      {children}
    </motion.div>
  );
} 