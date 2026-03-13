import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Thermometer, Droplets, Wind, Activity,
  Gauge, Sun, Moon, School
} from 'lucide-react';

/* -------- Simulated Vijayawada Sensor Data -------- */

const generateAirData = () => {
  return {
    temp: (30 + Math.random() * 6).toFixed(1),        // 30–36°C
    humidity: Math.floor(55 + Math.random() * 25),    // 55–80 %
    co2: Math.floor(420 + Math.random() * 200),       // 420–620 ppm
    pm1: Math.floor(5 + Math.random() * 15),
    pm25: Math.floor(10 + Math.random() * 40),
    pm4: Math.floor(15 + Math.random() * 45),
    pm10: Math.floor(20 + Math.random() * 70),
    voc: Math.floor(60 + Math.random() * 120),
    nox: Math.floor(10 + Math.random() * 60)
  };
};

/* -------- AQI Calculation -------- */

const calculateAQI = (data) => {
  const pm25 = data.pm25 || 0;
  let score = 0;
  let status = "Good";
  let color = "text-emerald-500 bg-emerald-500/10 border-emerald-500/40 shadow-emerald-500/20";

  if (pm25 <= 12) score = (pm25 / 12) * 50;
  else if (pm25 <= 35) score = 50 + ((pm25 - 12) / 23) * 50;
  else score = 100 + ((pm25 - 35) / 20) * 100;

  const finalScore = Math.round(score);

  if (finalScore > 100) {
    status = "Unhealthy";
    color = "text-rose-500 bg-rose-500/10 border-rose-500/40 shadow-rose-500/20";
  } else if (finalScore > 50) {
    status = "Moderate";
    color = "text-amber-500 bg-amber-500/10 border-amber-500/40 shadow-amber-500/20";
  }

  return { score: finalScore, status, color };
};

/* -------- Status Color Logic -------- */

const getColorByValue = (type, value) => {
  const thresholds = {
    co2: { warn: 1000, max: 2000 },
    temp: { warn: 34, max: 40 },
    humidity: { warn: 70, max: 90 },
    pm25: { warn: 15, max: 35 },
    voc: { warn: 150, max: 300 },
    nox: { warn: 50, max: 100 }
  };

  const limit = thresholds[type] || { warn: 100, max: 200 };

  if (value >= limit.max)
    return "text-rose-500 bg-rose-500/10 border-rose-500/40";

  if (value >= limit.warn)
    return "text-amber-500 bg-amber-500/10 border-amber-500/40";

  return "text-emerald-500 bg-emerald-500/10 border-emerald-500/40";
};

/* -------- Main App -------- */

const App = () => {

  const [darkMode, setDarkMode] = useState(true);

  const [data, setData] = useState(() => {
    const saved = localStorage.getItem("klu_air_data");
    return saved ? JSON.parse(saved) : generateAirData();
  });

  /* -------- Update Every 1 Hour -------- */

  useEffect(() => {

    const updateData = () => {
      const newData = generateAirData();
      setData(newData);
      localStorage.setItem("klu_air_data", JSON.stringify(newData));
    };

    updateData(); // initial load

    const interval = setInterval(updateData, 3600000); // 1 hour

    return () => clearInterval(interval);

  }, []);

  const aqi = calculateAQI(data);

  const theme = {
    bg: darkMode ? 'bg-[#050505] text-slate-200' : 'bg-[#f8fafc] text-slate-900',
    card: darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200',
    title: darkMode ? 'text-white' : 'text-slate-900',
    textMuted: darkMode ? 'text-slate-500' : 'text-slate-400'
  };

  return (
    <div className={`min-h-screen ${theme.bg} p-4 md:p-8`}>

      <div className="max-w-7xl mx-auto">

        {/* Header */}

        <header className="mb-8 flex justify-between items-center">

          <div className="flex items-center gap-4">

            <div className="p-3 bg-rose-600 rounded-2xl text-white">
              <School size={26}/>
            </div>

            <div>
              <h1 className="text-3xl font-black">
                KLU <span className="text-rose-500 italic">IoT</span>
              </h1>

              <p className="text-xs opacity-50">
                Vijayawada Air Monitoring
              </p>

            </div>

          </div>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-3 rounded-xl border ${theme.card}`}
          >
            {darkMode ? <Sun size={18}/> : <Moon size={18}/>}
          </button>

        </header>

        {/* AQI */}

        <motion.div className={`p-10 rounded-[2.5rem] border ${theme.card} ${aqi.color} mb-6`}>

          <span className="text-xs uppercase opacity-60">
            Master AQI Score
          </span>

          <h2 className="text-8xl font-black mt-3">
            {aqi.score}
          </h2>

          <p className="text-2xl italic">{aqi.status}</p>

        </motion.div>

        {/* CO2 */}

        <div className={`p-10 rounded-[2.5rem] border ${theme.card} ${getColorByValue('co2',data.co2)}`}>

          <span className="text-xs uppercase opacity-50">
            Carbon Dioxide
          </span>

          <h2 className="text-[7rem] font-black">
            {data.co2}
          </h2>

          <span className="text-xl opacity-40">ppm</span>

        </div>

        {/* Other Stats */}

        <div className="grid md:grid-cols-2 gap-6 mt-6">

          <StatCard label="Temperature" value={data.temp} unit="°C" icon={<Thermometer/>} type="temp" theme={theme}/>
          <StatCard label="Humidity" value={data.humidity} unit="%" icon={<Droplets/>} type="humidity" theme={theme}/>
          <StatCard label="VOC Index" value={data.voc} unit="idx" icon={<Activity/>} type="voc" theme={theme}/>
          <StatCard label="NOx Level" value={data.nox} unit="idx" icon={<Gauge/>} type="nox" theme={theme}/>

        </div>

        {/* PM */}

        <div className={`p-10 rounded-[2.5rem] border mt-6 ${theme.card}`}>

          <h3 className="text-xs uppercase opacity-40 flex items-center gap-2 mb-6">
            <Wind size={16}/> Particulate Matter
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">

            <PMValue label="PM1" val={data.pm1}/>
            <PMValue label="PM2.5" val={data.pm25}/>
            <PMValue label="PM4" val={data.pm4}/>
            <PMValue label="PM10" val={data.pm10}/>

          </div>

        </div>

      </div>
    </div>
  );
};

/* -------- Components -------- */

const StatCard = ({label,value,unit,type,icon,theme}) => {

  const status = getColorByValue(type,value);

  return (

    <div className={`p-6 rounded-2xl border flex justify-between ${theme.card} ${status}`}>

      <div className="flex items-center gap-3">
        {icon}
        <span>{label}</span>
      </div>

      <div>
        <span className="text-2xl font-black">{value}</span>
        <span className="text-xs opacity-40 ml-1">{unit}</span>
      </div>

    </div>

  );

};

const PMValue = ({label,val}) => {

  return (
    <div className="flex flex-col">
      <span className="text-4xl font-black">{val}</span>
      <span className="text-xs opacity-40">{label}</span>
    </div>
  );

};

export default App;
