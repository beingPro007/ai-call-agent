"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Lottie from "react-lottie";
import { useConversationLiveKit } from "../../hooks/useConversationLiveKit.jsx";
import AnimatedContainer from "./AnimatedContainer";
import ModernMicVisual from "./ModernMicVisual.jsx";
import assistantAnimation from "../animations/idle.json";

export default function ChatAgent() {
  const url =
    process.env.NEXT_PUBLIC_ENV !== "production"
      ? "http://localhost:3000"
      : process.env.NEXT_PUBLIC_WHISPER_SERVER_URI;
  const {
    isConnected,
    isConnecting,
    isDisconnecting,
    responseText,
    connectLiveKit,
    disconnectLiveKit,
    isRecording
  } = useConversationLiveKit(
    "default",
    url,
    process.env.NEXT_PUBLIC_LIVEKIT_URL
  );

  // Show mic visual when connected
  const [showMicVisual, setShowMicVisual] = useState(false);
  // Control Lottie animation
  const [animationState, setAnimationState] = useState({
    isStopped: false,
    isPaused: false,
  });

  // Toggle mic visualization when connection state changes
  useEffect(() => {
    if (isConnected) {
      setShowMicVisual(true);
      setAnimationState((prev) => ({ ...prev, isStopped: false }));
    } else {
      setShowMicVisual(false);
      setAnimationState((prev) => ({ ...prev, isStopped: true }));
    }
  }, [isConnected]);

  // Button click handler
  const handleButton = () => {
    if (isConnected) {
      disconnectLiveKit();
    } else {
      connectLiveKit();
    }
  };

  // Determine button label
  const label = isConnecting
    ? "Connecting..."
    : isDisconnecting
    ? "Disconnecting..."
    : isConnected
    ? "Disconnect"
    : "Join Session";

  const statusText = isConnecting
    ? "Connecting to session..."
    : isDisconnecting
    ? "Disconnecting from session..."
    : isRecording
    ? isConnected
      ? "Listening and transcribing..."
      : "Starting recording..."
    : "Ready to assist you";

  // Lottie options
  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: assistantAnimation,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

  return (
    <div className="max-w-6xl mx-auto w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4 sm:px-0">
        {/* Left Column - Microphone Interface */}
        <div className="space-y-6">
          {/* Controls */}
          <AnimatedContainer
            variant="glass"
            className="p-6 flex flex-col sm:flex-row gap-4 items-center justify-between"
            floatEffect={true}
          >
            <div className="flex-1 text-left">
              <h3 className="text-lg font-semibold gradient-text mb-1">
                Voice Assistant
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {isConnected
                  ? "I'm listening to you..."
                  : "Press the button to start speaking"}
              </p>
            </div>

            <motion.button
              className={`premium-button ${
                isConnected ? "accent" : ""
              } min-w-[160px]`}
              onClick={handleButton}
              whileTap={{ scale: 0.97 }}
              initial={{ scale: 1 }}
              disabled={isConnecting || isDisconnecting}
            >
              <div className="relative">
                {/* Mic icon */}
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className={isConnected ? "animate-pulse" : ""}
                >
                  <path
                    d="M12 2C13.6569 2 15 3.34315 15 5V12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12V5C9 3.34315 10.3431 2 12 2Z"
                    fill="white"
                  />
                  <path
                    d="M7 12C7 11.4477 6.55228 11 6 11C5.44772 11 5 11.4477 5 12C5 15.3137 7.68629 18 11 18H13C16.3137 18 19 15.3137 19 12C19 11.4477 18.5523 11 18 11C17.4477 11 17 11.4477 17 12C17 14.2091 15.2091 16 13 16H11C8.79086 16 7 14.2091 7 12Z"
                    fill="white"
                  />
                  <path
                    d="M12 18V22M8 22H16"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>

                {isConnected && (
                  <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-white animate-ping"></span>
                )}
              </div>

              {label}
            </motion.button>
          </AnimatedContainer>

          {/* Microphone Visualization */}
          <AnimatePresence>
            {showMicVisual && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <ModernMicVisual isRecording={isConnected} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column — Response and Animation */}
        <div className="space-y-6">
          <AnimatedContainer
            variant="raised"
            className="overflow-hidden"
            delay={0.2}
          >
            <div className="flex items-center border-b border-neutral-200 dark:border-neutral-800 p-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white shadow-md">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M19.0001 9.9999L19 16M19.0001 9.9999C19.0001 8.33317 16.5001 5.49988 12.0001 5.5C7.50014 5.50012 5.00014 8.33341 5.00014 9.99986L5 16C5 20.4183 8.58172 22 12 22C15.4183 22 19 20.4183 19 16M19.0001 9.9999C19.0001 8.89533 18.1048 7.9999 17.0001 7.9999C15.8955 7.9999 15.0001 8.89533 15.0001 9.9999V14.0002C15.0001 15.1048 15.8955 16.0002 17.0001 16.0002C18.1048 16.0002 19.0001 15.1048 19.0001 14.0002V9.9999Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 5.5L12 3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M7 6.5L5.5 4.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M17 6.5L18.5 4.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className="ml-3 font-semibold text-neutral-800 dark:text-neutral-200">
                AI Assistant
              </h3>
              <div className="ml-auto">
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    isConnecting
                      ? "bg-yellow-100 text-yellow-700"
                      : isDisconnecting
                      ? "bg-red-100 text-red-700"
                      : isRecording
                      ? "bg-accent-100 text-accent-700"
                      : "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {statusText}
                </span>
              </div>
            </div>

            <div className="p-5">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="min-h-32 flex items-start"
              >
                {!responseText ? (
                  <p className="text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
                    <span>Ready to assist you</span>
                    {!isConnected && (
                      <span className="inline-flex gap-1">
                        <span
                          className="w-1 h-1 bg-neutral-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        />
                        <span
                          className="w-1 h-1 bg-neutral-400 rounded-full animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        />
                        <span
                          className="w-1 h-1 bg-neutral-400 rounded-full animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        />
                      </span>
                    )}
                  </p>
                ) : (
                  <div className="relative text-neutral-800 dark:text-neutral-100">
                    <div className="absolute -left-5 top-0 h-full w-1 bg-primary-300 dark:bg-primary-600 rounded-full opacity-50" />
                    <p className="pl-2 text-lg leading-relaxed">
                      {responseText}
                    </p>
                  </div>
                )}
              </motion.div>
            </div>
          </AnimatedContainer>

          {/* Animation Container */}
          <AnimatedContainer
            variant="glass"
            className="overflow-hidden h-64 flex items-center justify-center"
            floatEffect={true}
          >
            <div
              className={`transition-opacity duration-300 ${
                isConnected ? "opacity-100" : "opacity-60"
              }`}
            >
              <Lottie
                options={defaultOptions}
                height={200}
                width={200}
                isStopped={animationState.isStopped}
                isPaused={animationState.isPaused}
              />
            </div>
          </AnimatedContainer>
        </div>
      </div>

      {/* Recent Conversations */}
      <div className="mt-8 px-4 sm:px-0">
        <AnimatedContainer variant="bordered" className="p-6" delay={0.4}>
          <h3 className="text-lg font-semibold gradient-text mb-4">
            Recent Conversations
          </h3>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-3 bg-neutral-100 dark:bg-neutral-800/50 rounded-lg flex items-center"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-800 flex items-center justify-center">
                  <span className="text-xs font-medium">{i}</span>
                </div>
                <p className="ml-3 text-sm truncate">
                  Sample conversation history item {i}
                </p>
                <button className="ml-auto text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 text-sm">
                  Play
                </button>
              </div>
            ))}
          </div>
        </AnimatedContainer>
      </div>
    </div>
  );
}
