"use client";

import { useEffect, useRef } from "react";

export default function VoiceVisualizer({ audioContext, source }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    if (!audioContext || !source) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const drawVisualizer = () => {
      animRef.current = requestAnimationFrame(drawVisualizer);
      analyser.getByteFrequencyData(dataArray);

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Modern clean background
      const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      bgGradient.addColorStop(0, 'rgba(248, 250, 252, 0.95)');
      bgGradient.addColorStop(1, 'rgba(241, 245, 249, 0.95)');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add subtle grid lines
      ctx.strokeStyle = "rgba(100, 116, 139, 0.05)";
      ctx.lineWidth = 1;
      
      // Horizontal lines
      for (let i = 0; i < canvas.height; i += 20) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }
      
      // Vertical lines
      for (let i = 0; i < canvas.width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }

      const barWidth = (canvas.width / bufferLength) * 2.2;
      let x = 0;

      // Draw modern visualizer bars
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = dataArray[i] / 2;
        
        // Create a smooth gradient for each bar
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
        
        // Use primary and secondary color gradients
        if (i % 3 === 0) {
          gradient.addColorStop(0, 'rgba(37, 99, 235, 0.2)');
          gradient.addColorStop(1, 'rgba(37, 99, 235, 0.8)');
        } else if (i % 3 === 1) {
          gradient.addColorStop(0, 'rgba(109, 40, 217, 0.2)');
          gradient.addColorStop(1, 'rgba(109, 40, 217, 0.8)');
        } else {
          gradient.addColorStop(0, 'rgba(16, 185, 129, 0.2)');
          gradient.addColorStop(1, 'rgba(16, 185, 129, 0.8)');
        }
        
        ctx.fillStyle = gradient;
        
        // Draw rounded bars
        ctx.beginPath();
        ctx.moveTo(x, canvas.height);
        ctx.lineTo(x, canvas.height - barHeight);
        
        // Round the top corners
        const radius = barWidth / 2;
        ctx.arcTo(x, canvas.height - barHeight - radius, x + radius, canvas.height - barHeight - radius, radius);
        ctx.arcTo(x + barWidth, canvas.height - barHeight - radius, x + barWidth, canvas.height - barHeight, radius);
        
        ctx.lineTo(x + barWidth, canvas.height);
        ctx.closePath();
        ctx.fill();
        
        // Add a subtle reflection
        const reflectionGradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height - barHeight - 10);
        reflectionGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        reflectionGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = reflectionGradient;
        ctx.fillRect(x, canvas.height - barHeight - 10, barWidth, 10);
        
        x += barWidth + 1;
      }
    };

    drawVisualizer();

    return () => {
      cancelAnimationFrame(animRef.current);
      source.disconnect(analyser);
    };
  }, [audioContext, source]);

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={100}
      className="mx-auto rounded-xl shadow-modern"
      style={{
        border: "1px solid rgba(226, 232, 240, 0.5)",
      }}
    />
  );
}
