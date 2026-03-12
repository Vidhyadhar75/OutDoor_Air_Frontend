import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { io } from 'socket.io-client';
import { 
  Thermometer, Droplets, Wind, Activity, 
  Gauge, Cloud, Sun, Moon, ShieldCheck, School
} from 'lucide-react';

// Production Socket Config
const socket = io('https://outdoor-air-backend.onrender.com', {
  transports: ['websocket', 'polling'],
  withCredentials: true
});

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

const getColorByValue = (type, value) => {
  const thresholds = {
    co2: { warn: 1000, max: 2000 },
    temp: { warn: 32, max: 40 },
    humidity: { warn: 70, max: 90 },
    pm25: { warn: 15, max: 35 },
    voc: { warn: 150, max: 300 },
    nox: { warn: 50, max: 100 },
  };
  const limit = thresholds[type] || { warn: 100, max: 200 };
  if (value >= limit.max) return "text-rose-500 bg-rose-500/10 border-rose-500/40 shadow-rose-500/20";
  if (value >= limit.warn) return "text-amber-500 bg-amber-500/10 border-amber-500/40 shadow-amber-500/20";
  return "text-emerald-500 bg-emerald-500/10 border-emerald-500/40 shadow-emerald-500/10";
};

const App = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  
  const [data, setData] = useState(() => {
    const savedData = localStorage.getItem('klu_air_data');
    return savedData ? JSON.parse(savedData) : {
      temp: 0, humidity: 0, co2: 0, pm1: 0, pm25: 0, pm4: 0, pm10: 0, voc: 0, nox: 0
    };
  });

  useEffect(() => {
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('sensor_update', (newData) => {
      setData(newData);
      localStorage.setItem('klu_air_data', JSON.stringify(newData));
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('sensor_update');
    };
  }, []);

  const aqi = calculateAQI(data);
  const theme = {
    bg: darkMode ? 'bg-[#050505] text-slate-200' : 'bg-[#f8fafc] text-slate-900',
    card: darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm',
    title: darkMode ? 'text-white' : 'text-slate-900',
    textMuted: darkMode ? 'text-slate-500' : 'text-slate-400'
  };

  return (
    <div className={`min-h-screen ${theme.bg} p-4 md:p-8 transition-colors duration-500`}>
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-600 rounded-2xl text-white shadow-lg shadow-rose-600/30">
              <School size={28} />
            </div>
            <div>
              <h1 className={`text-2xl md:text-3xl font-black tracking-tighter uppercase ${theme.title}`}>
                KLU <span className="text-rose-500 italic">IoT</span> DEPT
              </h1>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                <p className="text-[10px] font-mono opacity-50 uppercase tracking-widest italic">
                  {isConnected ? 'System Live' : 'Connecting to Node...'}
                </p>
              </div>
            </div>
          </div>
          <button onClick={() => setDarkMode(!darkMode)} className={`p-3 rounded-2xl border transition-all ${theme.card}`}>
            {darkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-indigo-600" />}
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <motion.div className={`md:col-span-12 lg:col-span-4 p-8 rounded-[2.5rem] border ${theme.card} ${aqi.color} flex flex-col justify-between shadow-2xl`}>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Master AQI Score</span>
              <h2 className="text-8xl font-black mt-4 leading-none tracking-tighter">{aqi.score}</h2>
              <p className="text-2xl font-bold uppercase mt-2 italic">{aqi.status}</p>
            </div>
          </motion.div>

          <motion.div className={`md:col-span-8 lg:col-span-8 p-8 md:p-10 rounded-[2.5rem] border ${theme.card} ${getColorByValue('co2', data.co2)}`}>
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Carbon Dioxide</span>
            <div className="flex items-baseline gap-4 mt-2">
              <h2 className={`text-6xl md:text-[9rem] font-black leading-none tracking-tighter ${theme.title}`}>{data.co2}</h2>
              <span className="text-xl md:text-3xl font-light italic opacity-40 uppercase">ppm</span>
            </div>
          </motion.div>

          <div className="md:col-span-4 grid grid-cols-1 gap-6">
            <StatCard label="Temp" value={data.temp} unit="°C" type="temp" icon={<Thermometer/>} theme={theme} />
            <StatCard label="Humidity" value={data.humidity} unit="%" type="humidity" icon={<Droplets/>} theme={theme} />
          </div>

          <div className={`md:col-span-12 p-8 md:p-10 rounded-[2.5rem] border ${theme.card}`}>
            <h3 className="text-xs font-black tracking-[0.4em] uppercase opacity-30 mb-8 flex items-center gap-3"><Wind size={18}/> Particulate Matter Analysis</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
              <PMValue label="PM 1.0" val={data.pm1} type="pm25" theme={theme} />
              <PMValue label="PM 2.5" val={data.pm25} type="pm25" theme={theme} />
              <PMValue label="PM 4.0" val={data.pm4} type="pm25" theme={theme} />
              <PMValue label="PM 10.0" val={data.pm10} type="pm25" theme={theme} />
            </div>
          </div>

          <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6">
              <StatCard label="VOC Index" value={data.voc} unit="idx" icon={<Activity/>} type="voc" theme={theme} />
              <StatCard label="NOx Level" value={data.nox} unit="idx" icon={<Gauge/>} type="nox" theme={theme} />
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, unit, type, icon, theme }) => {
  const status = getColorByValue(type, value);
  return (
    <div className={`border p-6 md:p-8 rounded-[2rem] flex items-center justify-between transition-all duration-500 ${theme.card} ${status}`}>
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-2xl border border-current/20">{icon}</div>
        <span className={`font-bold text-sm tracking-tight ${theme.textMuted}`}>{label}</span>
      </div>
      <div className="text-right">
        <span className={`text-2xl md:text-3xl font-black ${theme.title}`}>{value}</span>
        <span className="text-[10px] opacity-40 font-bold italic">{unit}</span>
      </div>
    </div>
  );
};

const PMValue = ({ label, val, type, theme }) => {
  const status = getColorByValue(type, val);
  const colorOnly = status.split(' ')[0];
  return (
    <div className="flex flex-col">
      <span className={`text-3xl md:text-5xl font-black tracking-tighter ${colorOnly}`}>{val}</span>
      <span className={`text-[10px] font-black opacity-30 uppercase tracking-[0.2em] mt-2`}>{label}</span>
    </div>
  );
};

export default App;