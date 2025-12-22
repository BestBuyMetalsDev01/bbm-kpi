import React, { useEffect, useState } from 'react';
import './ChristmasLights.css';

const ChristmasLights = () => {
    const [lights, setLights] = useState([]);

    useEffect(() => {
        const calculateLights = () => {
            const lightSpacing = 36;
            const width = window.innerWidth;
            const count = Math.ceil(width / lightSpacing) + 2;
            setLights(new Array(count).fill(0));
        };

        calculateLights();
        window.addEventListener('resize', calculateLights);
        return () => window.removeEventListener('resize', calculateLights);
    }, []);

    // Only render in December
    const isDecember = new Date().getMonth() === 11;
    if (!isDecember) return null;

    return (
        <ul className="light-wire">
            {lights.map((_, i) => (
                <li key={i} />
            ))}
        </ul>
    );
};

export default ChristmasLights;
