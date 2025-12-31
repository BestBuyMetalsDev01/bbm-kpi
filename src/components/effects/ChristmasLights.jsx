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

    // Date Logic: Day after Thanksgiving until Day after Christmas (Dec 26)
    const today = new Date();
    const year = today.getFullYear();

    // Calculate Thanksgiving (4th Thursday in November)
    const getThanksgiving = (yr) => {
        const nov1 = new Date(yr, 10, 1);
        const dayOfWeek = nov1.getDay();
        // Calculate days to add to get to the first Thursday (Thursday is index 4)
        const offset = (4 - dayOfWeek + 7) % 7;
        // 1st Thursday is 1 + offset
        // 4th Thursday is 1 + offset + 21
        return new Date(yr, 10, 1 + offset + 21);
    };

    const thanksgiving = getThanksgiving(year);
    const startDate = new Date(thanksgiving);
    startDate.setDate(startDate.getDate() + 1); // Day after Thanksgiving
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(year, 11, 26); // Dec 26
    endDate.setHours(23, 59, 59, 999);

    const shouldShow = today >= startDate && today <= endDate;

    if (!shouldShow) return null;

    return (
        <ul className="light-wire">
            {lights.map((_, i) => (
                <li key={i} />
            ))}
        </ul>
    );
};

export default ChristmasLights;
