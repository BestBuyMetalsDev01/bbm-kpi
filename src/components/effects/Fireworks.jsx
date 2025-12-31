import React, { useEffect, useRef } from 'react';

const Fireworks = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let cw = window.innerWidth;
        let ch = window.innerHeight;
        canvas.width = cw;
        canvas.height = ch;

        const particles = [];
        const confettiElements = [];
        let hue = 120;
        let timerTotal = 60;
        let timerTick = 0;
        let mousedown = false;
        let mx, my;
        let animationFrameId;

        const random = (min, max) => Math.random() * (max - min) + min;

        class Particle {
            constructor(x, y) {
                this.x = x;
                this.y = y;
                this.coordinates = [];
                this.coordinateCount = 5;
                while (this.coordinateCount--) {
                    this.coordinates.push([this.x, this.y]);
                }
                this.angle = random(0, Math.PI * 2);
                this.speed = random(1, 8);
                this.friction = 0.96;
                this.gravity = 0.5;
                this.hue = random(hue - 20, hue + 20);
                this.brightness = random(50, 80);
                this.alpha = 1;
                this.decay = random(0.005, 0.015);
            }

            update(index) {
                this.coordinates.pop();
                this.coordinates.unshift([this.x, this.y]);
                this.speed *= this.friction;
                this.x += Math.cos(this.angle) * this.speed;
                this.y += Math.sin(this.angle) * this.speed + this.gravity;
                this.alpha -= this.decay;
                if (this.alpha <= this.decay) particles.splice(index, 1);
            }

            draw() {
                ctx.beginPath();
                ctx.moveTo(this.coordinates[this.coordinates.length - 1][0], this.coordinates[this.coordinates.length - 1][1]);
                ctx.lineTo(this.x, this.y);
                ctx.strokeStyle = `hsla(${this.hue}, 100%, ${this.brightness}%, ${this.alpha})`;
                ctx.stroke();
            }
        }

        class Confetti {
            constructor() {
                this.x = random(0, cw);
                this.y = random(0, ch);
                this.size = random(5, 12);
                this.color = `hsla(${random(0, 360)}, 100%, 50%, 0.8)`;
                this.speed = random(1, 3);
                this.angle = random(0, 360);
                this.spin = random(-0.2, 0.2);
                this.wobble = random(0, 10);
                this.wobbleSpeed = random(0.05, 0.1);
            }

            update() {
                this.y += this.speed;
                this.angle += this.spin;
                this.wobble += this.wobbleSpeed;
                this.x += Math.sin(this.wobble) * 1;
                if (this.y > ch) {
                    this.y = -this.size;
                    this.x = random(0, cw);
                }
            }

            draw() {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.angle);
                ctx.fillStyle = this.color;
                ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
                ctx.restore();
            }
        }

        const initConfetti = () => {
            for (let i = 0; i < 100; i++) {
                confettiElements.push(new Confetti());
            }
        };

        const createParticles = (x, y) => {
            let particleCount = 100;
            while (particleCount--) {
                particles.push(new Particle(x, y));
            }
        };

        const loop = () => {
            animationFrameId = requestAnimationFrame(loop);
            hue += 0.5;

            ctx.globalCompositeOperation = 'destination-out';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, cw, ch);

            ctx.globalCompositeOperation = 'lighter';
            let j = particles.length;
            while (j--) {
                particles[j].draw();
                particles[j].update(j);
            }

            ctx.globalCompositeOperation = 'source-over';
            let k = confettiElements.length;
            while (k--) {
                confettiElements[k].draw();
                confettiElements[k].update();
            }

            if (timerTick >= timerTotal) {
                if (!mousedown) {
                    createParticles(random(0, cw), random(0, ch / 2));
                    timerTick = 0;
                }
            } else {
                timerTick++;
            }

            if (mousedown) {
                createParticles(mx, my);
            }
        };

        const handleResize = () => {
            cw = window.innerWidth;
            ch = window.innerHeight;
            canvas.width = cw;
            canvas.height = ch;
        };

        const handleMouseDown = (e) => {
            e.preventDefault();
            mousedown = true;
            mx = e.clientX || e.touches[0].clientX;
            my = e.clientY || e.touches[0].clientY;
        };

        const handleMouseUp = (e) => {
            e.preventDefault();
            mousedown = false;
        };

        const handleMouseMove = (e) => {
            mx = e.clientX;
            my = e.clientY;
        };

        window.addEventListener('resize', handleResize);
        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('touchstart', handleMouseDown);
        canvas.addEventListener('touchend', handleMouseUp);

        initConfetti();
        loop();

        return () => {
            window.removeEventListener('resize', handleResize);
            canvas.removeEventListener('mousedown', handleMouseDown);
            canvas.removeEventListener('mouseup', handleMouseUp);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('touchstart', handleMouseDown);
            canvas.removeEventListener('touchend', handleMouseUp);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none' }}>
            <canvas ref={canvasRef} style={{ display: 'block', pointerEvents: 'auto' }} />
        </div>
    );
};

export default Fireworks;
