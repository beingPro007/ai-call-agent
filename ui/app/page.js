'use client';

import { motion } from 'framer-motion';
import React from 'react';
import ChatAgent from './components/ChatAgent.jsx';
import AnimatedContainer from './components/AnimatedContainer.jsx';

export default function Home() {
  // Staggered animation for child elements
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.2,
        duration: 0.3,
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12
      }
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-neutral-50 dark:bg-neutral-950">
      {/* Background elements */}
      <div className="fixed inset-0 -z-10">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-neutral-50 to-neutral-100 dark:from-neutral-900 dark:via-neutral-950 dark:to-neutral-900"></div>
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGZpbGw9IiMzMzMiIGZpbGwtb3BhY2l0eT0iLjAyIiBkPSJNMCAwaDYwdjYwSDB6Ii8+PHBhdGggZD0iTTYwIDBoLTFWNjBoMXpNMCAwdjFoNjBWMHptMCA2MHYtMWg2MHYxem0tMS02MHY2MGgxVjB6IiBzdHJva2U9IiMzMzMiIHN0cm9rZS1vcGFjaXR5PSIuMDIiLz48L2c+PC9zdmc+')] opacity-30 dark:opacity-20"></div>
      
        {/* Gradient orbs */}
        {/* <div className="absolute top-20 right-1/4 w-96 h-96 bg-primary-300/20 dark:bg-primary-600/5 rounded-full mix-blend-multiply blur-3xl animate-float opacity-70" 
          style={{ animationDelay: '0s', animationDuration: '15s' }}></div>
        <div className="absolute bottom-10 left-1/4 w-80 h-80 bg-secondary-300/20 dark:bg-secondary-600/5 rounded-full mix-blend-multiply blur-3xl animate-float opacity-70" 
          style={{ animationDelay: '2s', animationDuration: '18s' }}></div>
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-accent-300/20 dark:bg-accent-600/5 rounded-full mix-blend-multiply blur-3xl animate-float opacity-70" 
          style={{ animationDelay: '1s', animationDuration: '20s' }}></div> */}
      </div>
      
      {/* Content container */}
      <div className="relative z-10 container mx-auto max-w-5xl px-6 py-16 md:py-24">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-16"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center">
            <div className="inline-block mx-auto mb-3">
              <AnimatedContainer variant="glass" className="py-2 px-4 rounded-full">
                <span className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 dark:text-neutral-300">
                  <span className="w-2 h-2 bg-accent-500 rounded-full"></span>
                  AI-Powered Voice Interface
                </span>
              </AnimatedContainer>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 tracking-tight">
              <span className="gradient-text">Duply Talk</span>
            </h1>
            
            <p className="text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto text-lg">
              Experience seamless voice interaction with advanced AI technology. 
              Just speak naturally and get instant, intelligent responses.
            </p>
          </motion.div>
          
          {/* Main app interface */}
          <motion.div variants={itemVariants}>
            <ChatAgent />
          </motion.div>
          
          {/* Features section */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: (
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 4.75V6.25M12 17.75V19.25M18.25 12H19.75M4.25 12H5.75M7.34 7.34L6.16 6.16M17.84 17.84L16.66 16.66M17.84 6.16L16.66 7.34M7.34 16.66L6.16 17.84M16 12C16 14.2091 14.2091 16 12 16C9.79086 16 8 14.2091 8 12C8 9.79086 9.79086 8 12 8C14.2091 8 16 9.79086 16 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
                title: "Intelligent Responses",
                description: "Advanced AI understands context and provides thoughtful, helpful answers to your questions."
              },
              {
                icon: (
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 18.5V19.38C12 21.25 13.36 22.75 15.23 22.75H19.77C21.64 22.75 23 21.25 23 19.38V18.5M1 18.5V19.38C1 21.25 2.36 22.75 4.23 22.75H8.77M8 10.5V4.5C8 2.84 9.34 1.5 11 1.5C12.66 1.5 14 2.84 14 4.5V10.5C14 12.16 12.66 13.5 11 13.5C9.34 13.5 8 12.16 8 10.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
                title: "Natural Voice Interface",
                description: "Talk normally as you would to a person. No need for special commands or keywords."
              },
              {
                icon: (
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 11.0851V6.50708C22 5.11938 20.8807 4 19.4929 4H4.50708C3.11938 4 2 5.11938 2 6.50708V17.4929C2 18.8807 3.11938 20 4.50708 20H13.9149M8 9L13 14M10 9H8V11M18.5 17.5L21 20M19.5 15.5C19.5 17.7091 17.7091 19.5 15.5 19.5C13.2909 19.5 11.5 17.7091 11.5 15.5C11.5 13.2909 13.2909 11.5 15.5 11.5C17.7091 11.5 19.5 13.2909 19.5 15.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ),
                title: "Real-time Processing",
                description: "Experience minimal latency with our advanced processing that delivers responses instantly."
              }
            ].map((feature, idx) => (
              <AnimatedContainer 
                key={idx}
                variant="bordered" 
                className="p-6 h-full" 
                hoverEffect={true}
              >
                <div className="flex flex-col h-full">
                  <div className="mb-4 p-3 bg-primary-100/50 dark:bg-primary-900/20 rounded-xl w-fit">
                    <div className="text-primary-600 dark:text-primary-400">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-neutral-800 dark:text-neutral-200">{feature.title}</h3>
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm leading-relaxed">{feature.description}</p>
                </div>
              </AnimatedContainer>
            ))}
          </motion.div>
          
          {/* Footer */}
        </motion.div>
      </div>
    </div>
  );
}
