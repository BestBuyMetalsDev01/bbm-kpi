import React, { useEffect, useRef } from 'react';
import './July4thFireworks.css';

const July4thFireworks = () => {
    const canvasRef = useRef(null);

    // Date Logic: Week leading up to July 4th (June 27) until July 4th
    const today = new Date();
    const month = today.getMonth(); // 5 = June, 6 = July
    const date = today.getDate();
    const year = today.getFullYear();

    // Check if within range: June 27-30 OR July 1-4
    // Assumes simple logic for current year.
    const isJune = month === 5;
    const isJuly = month === 6;

    // Range: June 27 - July 4 inclusive
    const inSeason = (isJune && date >= 27) || (isJuly && date <= 4);

    // Uncomment this line to force test the effect
    // const inSeason = true; 

    if (!inSeason) return null;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let cw = window.innerWidth;
        let ch = window.innerHeight;
        canvas.width = cw;
        canvas.height = ch;

        const particles = [];
        let limiterTotal = 5;
        let limiterTick = 0;
        let timerTotal = 60;
        let timerTick = 0;
        let mousedown = false;
        let mx, my;
        let animationFrameId;

        const random = (min, max) => Math.random() * (max - min) + min;

        class Particle {
            constructor(x, y, hue, angleMin, angleMax) {
                this.x = x;
                this.y = y;
                this.coordinates = [];
                this.coordinateCount = 5;

                while (this.coordinateCount--) {
                    this.coordinates.push([this.x, this.y]);
                }

                if (angleMin !== undefined && angleMax !== undefined) {
                    this.angle = random(angleMin, angleMax);
                    this.isSparkler = true;
                } else {
                    this.angle = random(0, Math.PI * 2);
                    this.isSparkler = false;
                }

                if (this.isSparkler) {
                    this.speed = random(5, 20);
                    this.friction = 0.94;
                    this.gravity = 1.5;
                    this.decay = random(0.01, 0.03);
                } else {
                    this.speed = random(1, 10);
                    this.friction = 0.95;
                    this.gravity = 0.5;
                    this.decay = random(0.005, 0.015);
                }

                if (hue !== undefined) {
                    this.hue = hue;
                    this.sat = 100;
                    this.light = random(50, 90);
                } else {
                    const choice = Math.random();
                    if (choice < 0.33) { // Red
                        this.hue = 0; this.sat = 100; this.light = 50;
                    } else if (choice < 0.66) { // Blue
                        this.hue = 240; this.sat = 100; this.light = 50;
                    } else { // White
                        this.hue = 0; this.sat = 0; this.light = 100;
                    }
                }

                this.alpha = 1;
            }

            update(index) {
                this.coordinates.pop();
                this.coordinates.unshift([this.x, this.y]);

                this.speed *= this.friction;
                this.x += Math.cos(this.angle) * this.speed;
                this.y += Math.sin(this.angle) * this.speed + this.gravity;
                this.alpha -= this.decay;

                if (this.alpha <= this.decay) {
                    particles.splice(index, 1);
                }
            }

            draw() {
                ctx.beginPath();
                ctx.moveTo(this.coordinates[this.coordinates.length - 1][0], this.coordinates[this.coordinates.length - 1][1]);
                ctx.lineTo(this.x, this.y);
                ctx.strokeStyle = 'hsla(' + this.hue + ', ' + this.sat + '%, ' + this.light + '%, ' + this.alpha + ')';
                ctx.stroke();
            }
        }

        const createParticles = (x, y) => {
            let particleCount = 100;
            while (particleCount--) {
                particles.push(new Particle(x, y));
            }
        };

        const createSparkles = () => {
            // Gold color = 45
            for (let i = 0; i < 5; i++) {
                particles.push(new Particle(0, 0, 45, 0, Math.PI / 2));
            }
            for (let i = 0; i < 5; i++) {
                particles.push(new Particle(cw, 0, 45, Math.PI / 2, Math.PI));
            }
        };

        const loop = () => {
            animationFrameId = requestAnimationFrame(loop);

            ctx.globalCompositeOperation = 'destination-out';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, cw, ch);

            ctx.globalCompositeOperation = 'lighter';

            let j = particles.length;
            while (j--) {
                particles[j].draw();
                particles[j].update(j);
            }

            createSparkles();

            if (timerTick >= timerTotal) {
                if (!mousedown) {
                    createParticles(random(0, cw), random(0, ch / 2));
                    timerTick = 0;
                }
            } else {
                timerTick++;
            }

            if (limiterTick >= limiterTotal) {
                if (mousedown) {
                    createParticles(mx, my);
                    limiterTick = 0;
                }
            } else {
                limiterTick++;
            }
        };

        // Event Listeners
        const handleResize = () => {
            cw = window.innerWidth;
            ch = window.innerHeight;
            canvas.width = cw;
            canvas.height = ch;
        };

        const handleMouseMove = (e) => {
            mx = e.clientX - canvas.offsetLeft;
            my = e.clientY - canvas.offsetTop;
        };

        const handleMouseDown = (e) => {
            e.preventDefault();
            mousedown = true;
        };

        const handleMouseUp = (e) => {
            e.preventDefault();
            mousedown = false;
        };

        const handleTouchStart = (e) => {
            e.preventDefault();
            mousedown = true;
            mx = e.touches[0].pageX - canvas.offsetLeft;
            my = e.touches[0].pageY - canvas.offsetTop;
        };

        const handleTouchEnd = (e) => {
            e.preventDefault();
            mousedown = false;
        };

        window.addEventListener('resize', handleResize);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('touchstart', handleTouchStart);
        canvas.addEventListener('touchend', handleTouchEnd);

        loop();

        return () => {
            window.removeEventListener('resize', handleResize);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mousedown', handleMouseDown);
            canvas.removeEventListener('mouseup', handleMouseUp);
            canvas.removeEventListener('touchstart', handleTouchStart);
            canvas.removeEventListener('touchend', handleTouchEnd);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div className="july4-container">
            <div className="bunting-container">
                <div className="bunting-layer bunting-back"></div>
                <div className="bunting-layer bunting-front"></div>
            </div>
            <canvas ref={canvasRef} className="july4-canvas" />
        </div>
    );
};

export default July4thFireworks;
