import { useState, useEffect } from 'react';

const LOCATION_COORDS = {
    "Knoxville": { lat: 35.9606, lon: -83.9207 },
    "Cleveland": { lat: 35.1595, lon: -84.8766 },
    "Chattanooga": { lat: 35.0456, lon: -85.3097 },
    "Dalton": { lat: 34.7698, lon: -84.9702 }, // Dalton, GA
    "Asheville": { lat: 35.5951, lon: -82.5515 },
    "Greenville": { lat: 34.8526, lon: -82.3940 }, // Greenville, SC
    "Charlotte": { lat: 35.2271, lon: -80.8431 },
    "National": { lat: 35.9606, lon: -83.9207 }, // Default to HQ
    "Corporate": { lat: 35.9606, lon: -83.9207 }
};

export const useWeather = (locationName) => {
    const [weather, setWeather] = useState({ tempF: null, isSnowing: false, loading: true });

    useEffect(() => {
        if (!locationName || !LOCATION_COORDS[locationName]) {
            setWeather({ tempF: null, isSnowing: false, loading: false });
            return;
        }

        const coords = LOCATION_COORDS[locationName];

        const fetchWeather = async () => {
            try {
                // Open-Meteo API (Free, No Key)
                // Units: imperial (Fahrenheit)
                const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch`;

                const res = await fetch(url);
                const data = await res.json();

                if (data.current) {
                    const temp = data.current.temperature_2m;
                    const code = data.current.weather_code;

                    // WMO Weather Codes: 71, 73, 75 (Snow fall), 77 (Snow grains), 85, 86 (Snow showers)
                    // Or implies cold? User said "if its cold in that area".
                    // Let's enable snow if Temp < 40F OR if actual snow code.
                    const isCold = temp < 40;
                    const isSnowingCode = [71, 73, 75, 77, 85, 86].includes(code);

                    console.log(`Weather at ${locationName}: ${temp}F, Snowing: ${isCold || isSnowingCode}`);

                    setWeather({
                        tempF: temp,
                        isSnowing: isCold || isSnowingCode, // Show snow effect if cold!
                        loading: false
                    });
                }
            } catch (err) {
                console.error("Weather fetch failed:", err);
                setWeather({ tempF: null, isSnowing: false, loading: false });
            }
        };

        fetchWeather();
    }, [locationName]);

    return weather;
};
