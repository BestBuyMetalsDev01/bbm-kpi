import React, { useEffect, useRef } from 'react';

const SnowEffect = ({ weather }) => {
    const canvasRef = useRef(null);

    // Don't show snow if weather data exists and temp is above 40°F
    const shouldShowSnow = !weather || weather.temp === null || weather.temp <= 40;

    useEffect(() => {
        if (!shouldShowSnow) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let animationFrameId;

        // Set dimensions
        const updateSize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        updateSize();
        window.addEventListener('resize', updateSize);

        // Flake Config
        const maxFlakes = 100;
        const flakes = [];

        // Initialize Flakes
        for (let i = 0; i < maxFlakes; i++) {
            flakes.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                r: Math.random() * 3 + 1, // Radius 1-4px
                d: Math.random() // Density
            });
        }

        let angle = 0;

        const drawFlakes = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
            ctx.beginPath();

            for (let i = 0; i < maxFlakes; i++) {
                const f = flakes[i];
                ctx.moveTo(f.x, f.y);
                ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2, true);
            }
            ctx.fill();
            moveFlakes();
            animationFrameId = requestAnimationFrame(drawFlakes);
        };

        const moveFlakes = () => {
            angle += 0.01;
            for (let i = 0; i < maxFlakes; i++) {
                const f = flakes[i];

                // Fall down
                f.y += Math.pow(f.d, 2) + 1; // 1px + density squared (so heavier ones fall faster)
                // Sway
                f.x += Math.sin(angle + f.d * 10) * 0.5;

                // Reset if out of bounds
                if (f.y > canvas.height) {
                    flakes[i] = { x: Math.random() * canvas.width, y: 0, r: f.r, d: f.d };
                }

                // Wrap horizontal
                if (f.x > canvas.width + 5) flakes[i].x = -5;
                if (f.x < -5) flakes[i].x = canvas.width + 5;
            }
        };

        drawFlakes();

        return () => {
            window.removeEventListener('resize', updateSize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [shouldShowSnow]);

    // Don't render canvas if too warm
    if (!shouldShowSnow) return null;

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 0 // Background effect
            }}
        />
    );
};

export default SnowEffect;
