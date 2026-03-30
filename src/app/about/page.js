"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";

export default function AboutPage() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div ref={containerRef} className="bg-slate-950 min-h-screen text-white overflow-x-hidden">
      {/* Floating cursor glow effect */}
      <div 
        className="fixed w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none z-50 transition-all duration-700 ease-out"
        style={{ 
          left: mousePos.x - 192, 
          top: mousePos.y - 192,
        }}
      />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-black tracking-tighter">
            <span className="text-blue-400">SWELL</span>
            <span className="text-white">.AI</span>
          </Link>
          <Link 
            href="/" 
            className="px-6 py-2 bg-blue-500 hover:bg-blue-400 text-black font-bold rounded-full transition-all"
          >
            Check the Waves →
          </Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        {/* Animated wave background */}
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" viewBox="0 0 1440 800" preserveAspectRatio="none">
            <motion.path
              d="M0,400 C240,300 480,500 720,400 C960,300 1200,500 1440,400 L1440,800 L0,800 Z"
              fill="url(#gradient1)"
              animate={{
                d: [
                  "M0,400 C240,300 480,500 720,400 C960,300 1200,500 1440,400 L1440,800 L0,800 Z",
                  "M0,400 C240,500 480,300 720,400 C960,500 1200,300 1440,400 L1440,800 L0,800 Z",
                  "M0,400 C240,300 480,500 720,400 C960,300 1200,500 1440,400 L1440,800 L0,800 Z"
                ]
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <defs>
              <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
                <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <motion.div style={{ opacity }} className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-4 py-1 mb-6 text-xs font-bold tracking-widest text-cyan-400 border border-cyan-400/30 rounded-full bg-cyan-400/10">
              BUILT BY SURFERS FOR SURFERS
            </span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-6xl md:text-8xl font-black tracking-tight mb-6 leading-none"
          >
            WE DON'T GUESS.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400">
              WE CALCULATE.
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed"
          >
            While other apps estimate wind from weather stations 50 miles inland, 
            we fuse real-time NOAA buoy data with beach geometry to tell you exactly 
            how offshore that wind really is.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link 
              href="/"
              className="px-8 py-4 bg-blue-500 hover:bg-blue-400 text-black font-bold text-lg rounded-full transition-all transform hover:scale-105"
            >
              Find Your Session →
            </Link>
            <button 
              onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 border border-slate-700 hover:border-slate-500 text-white font-bold text-lg rounded-full transition-all"
            >
              See How It Works
            </button>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-slate-500"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </motion.div>
      </section>

      {/* THE PROBLEM SECTION */}
      <section id="how-it-works" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-16 items-center"
          >
            <div>
              <h2 className="text-4xl md:text-5xl font-black mb-6">
                WHY YOUR CURRENT FORECAST IS LYING TO YOU
              </h2>
              <div className="space-y-6 text-lg text-slate-400">
                <p>
                  Traditional surf apps show you wind direction from the nearest airport. 
                  But here's the thing: <span className="text-white font-bold">wind at LAX has nothing to do with wind at Malibu.</span>
                </p>
                <p>
                  They don't know which way your beach faces. They don't know if that 15kt 
                  "west wind" is actually side-offshore and groomed to perfection, or straight 
                  onshore and blown out.
                </p>
                <div className="flex items-center gap-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <span className="text-3xl">🤥</span>
                  <p className="text-red-400 font-bold m-0">
                    Result: You drive 45 minutes for waves that looked good online but are actually unrideable.
                  </p>
                </div>
              </div>
            </div>

            {/* Visual comparison */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-3xl" />
              <div className="relative bg-slate-900/80 border border-slate-800 rounded-3xl p-8">
                <div className="flex justify-between items-center mb-6 text-sm font-bold text-slate-500 uppercase tracking-wider">
                  <span>Traditional App</span>
                  <span>SWELL.AI</span>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl opacity-50">
                    <div className="flex justify-between items-center">
                      <span className="text-red-400 font-bold">Wind</span>
                      <span className="text-slate-400">15kts W (LAX Airport)</span>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-blue-500/20 border border-blue-500/50 rounded-xl transform scale-105 shadow-2xl shadow-blue-500/20">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-blue-400 font-bold">Wind Quality</span>
                      <span className="text-emerald-400 font-black">87/100 OFFSHORE</span>
                    </div>
                    <div className="text-xs text-slate-400">
                      Beach faces 95° (East) • Wind 270° (West) • Vector calculated • Buoy 46221 live
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* THE SCIENCE SECTION */}
      <section className="py-32 bg-slate-900/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-6xl font-black mb-6">
              THE MATH BEHIND THE STOKE
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              We built a physics engine that calculates exactly how the wind interacts with your specific break.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: "🎯",
                title: "Beach Geometry",
                desc: "Every spot in our database has a precise facing angle. We know if your break faces 73° or 247°.",
                color: "blue"
              },
              {
                icon: "🌊",
                title: "Dual Buoy Fusion",
                desc: "We pull swell from offshore waveriders AND wind from coastal stations, then merge them in real-time.",
                color: "cyan"
              },
              {
                icon: "⚡",
                title: "Vector Scoring",
                desc: "Dot products calculate offshore vs onshore. Gust penalties subtract points for variable wind.",
                color: "emerald"
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`p-8 rounded-2xl bg-slate-900 border border-slate-800 hover:border-${item.color}-500/50 transition-all group`}
              >
                <div className={`text-4xl mb-4 group-hover:scale-110 transition-transform`}>
                  {item.icon}
                </div>
                <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                <p className="text-slate-400 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-2 md:order-1"
            >
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xl shrink-0">
                    1
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Real NOAA Buoy Data</h3>
                    <p className="text-slate-400">Not interpolated weather models. Actual sensors in the water right now.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-xl shrink-0">
                    2
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">0-100 Surf Quality Score</h3>
                    <p className="text-slate-400">No more guessing what "fair with poor periods" means. Green means go.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xl shrink-0">
                    3
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Global Wind Visualization</h3>
                    <p className="text-slate-400">See the wind patterns moving across the ocean. Know where the glass is before you go.</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-1 md:order-2 relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-3xl blur-3xl" />
              <div className="relative bg-slate-900 border border-slate-800 rounded-3xl p-8 aspect-square flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800&q=80')] bg-cover bg-center opacity-30" />
                <div className="relative z-10 text-center">
                  <div className="text-8xl font-black text-white mb-2">87</div>
                  <div className="text-emerald-400 font-bold text-xl uppercase tracking-widest">Fire</div>
                  <div className="mt-4 text-slate-400 text-sm">Trestles • 4.2ft @ 15s • 8kts offshore</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/20 to-slate-950" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto px-6 relative z-10 text-center"
        >
          <h2 className="text-5xl md:text-7xl font-black mb-6">
            STOP CHECKING.
            <br />
            START SURFING.
          </h2>
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
            Join the surfers who use physics instead of guesses. 
            Your next session is one click away.
          </p>
          
          <Link 
            href="/"
            className="inline-block px-12 py-6 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-black font-black text-xl rounded-full transition-all transform hover:scale-105 shadow-2xl shadow-blue-500/25"
          >
            Get The Real Forecast →
          </Link>

          <div className="mt-12 flex justify-center gap-8 text-slate-500 text-sm">
            <span>✓ Free forever</span>
            <span>✓ No account needed</span>
            <span>✓ Real buoy data</span>
          </div>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-800 py-12 bg-slate-950">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-2xl font-black tracking-tighter">
            <span className="text-blue-400">SWELL</span>
            <span className="text-white">.AI</span>
          </div>
          <div className="text-slate-500 text-sm">
            Built with stoke • Powered by NOAA • Fueled by waves
          </div>
          <div className="flex gap-6 text-slate-400">
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
            <a href="#" className="hover:text-white transition-colors">Instagram</a>
          </div>
        </div>
      </footer>
    </div>
  );
}