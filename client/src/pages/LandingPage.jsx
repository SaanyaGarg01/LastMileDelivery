import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import InteractiveLogisticsMap from '../components/InteractiveLogisticsMap';
import {
  Truck, Navigation, ShieldCheck, Sparkles, MapPin, Clock, ArrowRight,
  CheckCircle2, Users, AlertTriangle, Calendar, Layers, Activity, Search,
  Lock, Zap, ChevronRight, Menu, X, Star, BarChart3, Bell, ArrowUpRight
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [trackOrderInput, setTrackOrderInput] = useState('');

  // Hero Animated Agent Coordinates
  const [heroAgentPos, setHeroAgentPos] = useState({
    lat: 28.6230,
    lng: 77.2140,
    name: 'Rahul Sharma',
  });

  // Smooth agent movement animation in hero map
  useEffect(() => {
    const interval = setInterval(() => {
      setHeroAgentPos((prev) => ({
        ...prev,
        lat: prev.lat + (Math.random() - 0.45) * 0.0012,
        lng: prev.lng + (Math.random() - 0.45) * 0.0012,
      }));
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    if (!trackOrderInput.trim()) {
      toast.error('Please enter an Order ID or Order Number');
      return;
    }
    navigate(`/customer/orders/${trackOrderInput.trim()}`);
  };

  const pickupHero = { address: 'Connaught Place, Delhi', lat: 28.6139, lng: 77.2090 };
  const dropHero = { address: 'Sector 18, Noida', lat: 28.6320, lng: 77.2190 };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-['Plus_Jakarta_Sans',sans-serif] selection:bg-sky-500 selection:text-white relative overflow-x-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-tr from-sky-600/20 via-indigo-600/10 to-transparent blur-[140px] pointer-events-none" />

      {/* ─── 1. STICKY GLASSMORPHISM NAVBAR ─── */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/25 group-hover:scale-105 transition-transform">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-base text-white tracking-tight block">LAST-MILE TRACKER</span>
              <span className="text-[9px] font-mono font-bold text-sky-400 tracking-widest uppercase block -mt-1">LOGISTICS PLATFORM</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-slate-300">
            <a href="#hero" className="hover:text-sky-400 transition-colors">Home</a>
            <a href="#features" className="hover:text-sky-400 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-sky-400 transition-colors">How It Works</a>
            <a href="#auto-assignment" className="hover:text-sky-400 transition-colors">Smart Assignment</a>
            <a href="#reschedule" className="hover:text-sky-400 transition-colors">Reschedule Flow</a>
          </nav>

          {/* Nav Buttons */}
          <div className="hidden md:flex items-center gap-3 text-xs font-bold">
            <a
              href="#track"
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 hover:border-slate-500 transition-all flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5 text-sky-400" /> Track Shipment
            </a>
            <Link
              to="/login"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-all"
            >
              Login
            </Link>
            <button
              type="button"
              onClick={() => setShowRoleModal(true)}
              className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 transition-all flex items-center gap-1.5"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 py-6 space-y-4 text-sm font-bold text-slate-300">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block py-2">Features</a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block py-2">How It Works</a>
            <a href="#auto-assignment" onClick={() => setMobileMenuOpen(false)} className="block py-2">Smart Assignment</a>
            <a href="#track" onClick={() => setMobileMenuOpen(false)} className="block py-2">Track Shipment</a>
            <div className="pt-4 border-t border-slate-800 flex flex-col gap-2.5">
              <Link to="/login" className="w-full text-center py-3 rounded-xl bg-slate-800 text-white">Login</Link>
              <button
                type="button"
                onClick={() => { setMobileMenuOpen(false); setShowRoleModal(true); }}
                className="w-full py-3 rounded-xl bg-sky-500 text-slate-950 font-extrabold"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ─── 2. HERO SECTION ─── */}
      <section id="hero" className="pt-12 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Hero Content Left */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 font-extrabold text-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Next-Gen Enterprise Logistics SaaS
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1]">
              Smart Logistics. <br />
              <span className="bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-300 bg-clip-text text-transparent">
                Faster Deliveries.
              </span> <br />
              Complete Visibility.
            </h1>

            <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed">
              Track every shipment in real time. Assign the nearest delivery agent automatically. Know exactly where your package is at every single mile.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                type="button"
                onClick={() => setShowRoleModal(true)}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-sky-500/25 hover:shadow-sky-500/40 transition-all flex items-center justify-center gap-2 group"
              >
                <Truck className="w-4 h-4 group-hover:scale-110 transition-transform" /> Create Shipment
              </button>
              <a
                href="#track"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
              >
                <Navigation className="w-4 h-4 text-sky-400" /> Track Shipment
              </a>
            </div>

            {/* Live Indicator Badge */}
            <div className="flex items-center justify-center lg:justify-start gap-4 text-xs font-bold text-slate-400 pt-4">
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-400" /> 100% Immutable History</span>
              <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-amber-400" /> Multi-Factor Proximity Scoring</span>
            </div>
          </div>

          {/* Hero Interactive Map Graphic Right */}
          <div className="lg:col-span-6">
            <div className="p-3 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl relative group">
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 mb-2 text-xs">
                <span className="font-extrabold text-sky-400 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE DISPATCH MAP
                </span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                  ORD-10482
                </span>
              </div>

              <InteractiveLogisticsMap
                pickup={pickupHero}
                drop={dropHero}
                agents={[]}
                isLiveTracking={true}
                assignedAgentLocation={heroAgentPos}
                height="340px"
                showRoute={true}
              />

              {/* Floating Live ETA Banner Overlay */}
              <div className="absolute bottom-6 left-6 right-6 bg-slate-950/90 backdrop-blur-md p-4 rounded-2xl border border-slate-800 flex items-center justify-between text-xs shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center font-bold">
                    🚚
                  </div>
                  <div>
                    <h4 className="font-extrabold text-white">Rahul Sharma <span className="text-emerald-400 text-[10px] ml-1">● Moving</span></h4>
                    <p className="text-[11px] text-slate-400">Heading to Sector 18, Noida</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-extrabold text-amber-400 text-sm block">12 MIN ETA</span>
                  <span className="text-[10px] text-slate-400">2.4 km remaining</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. STATISTICS & TRUST BANNER (Section 4) ─── */}
      <section className="py-12 border-y border-slate-800/80 bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-1">
              <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight block font-mono">10K+</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Deliveries Tracked</span>
            </div>
            <div className="space-y-1">
              <span className="text-3xl sm:text-4xl font-extrabold text-emerald-400 tracking-tight block font-mono">98.4%</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">On-Time Success</span>
            </div>
            <div className="space-y-1">
              <span className="text-3xl sm:text-4xl font-extrabold text-sky-400 tracking-tight block font-mono">24/7</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Real-Time Visibility</span>
            </div>
            <div className="space-y-1">
              <span className="text-3xl sm:text-4xl font-extrabold text-amber-400 tracking-tight block font-mono">Haversine</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Proximity Auto-Assign</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. "WHY LAST-MILE TRACKER?" (Section 5) ─── */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className="text-xs font-mono font-extrabold uppercase tracking-widest text-sky-400">ENGINEERED FOR MODERN LOGISTICS</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Why Choose Last-Mile Tracker?</h2>
          <p className="text-slate-400 text-sm sm:text-base font-medium">
            From dynamic weight pricing to immutable audit trails and real-time Leaflet OpenStreetMap dispatching.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: Navigation,
              color: 'text-emerald-400',
              bg: 'bg-emerald-500/10',
              border: 'border-emerald-500/20',
              title: 'Real-Time Map Tracking',
              desc: 'Follow your package at every single step on Leaflet OpenStreetMap with live moving markers and ETA readouts.',
            },
            {
              icon: Sparkles,
              color: 'text-sky-400',
              bg: 'bg-sky-500/10',
              border: 'border-sky-500/20',
              title: 'Smart Agent Assignment',
              desc: 'Haversine distance calculation auto-assigns the nearest available agent based on proximity and workload penalty.',
            },
            {
              icon: Zap,
              color: 'text-amber-400',
              bg: 'bg-amber-500/10',
              border: 'border-amber-500/20',
              title: 'Volumetric Pricing Engine',
              desc: 'Calculates volumetric weight (L×B×H / 5000), checks B2B/B2C intra/inter zone rate cards, and applies COD surcharges.',
            },
            {
              icon: Bell,
              color: 'text-indigo-400',
              bg: 'bg-indigo-500/10',
              border: 'border-indigo-500/20',
              title: 'Multi-Channel Notifications',
              desc: 'Instant HTML email templates, SMS updates, and in-app notification logs for every single status lifecycle event.',
            },
          ].map((card, i) => (
            <div
              key={i}
              className={`p-6 rounded-3xl bg-slate-900/60 border ${card.border} hover:bg-slate-900 transition-all duration-300 group hover:-translate-y-1 shadow-lg space-y-4`}
            >
              <div className={`w-12 h-12 rounded-2xl ${card.bg} ${card.color} flex items-center justify-center font-bold group-hover:scale-110 transition-transform`}>
                <card.icon className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-white">{card.title}</h3>
              <p className="text-slate-400 text-xs leading-relaxed font-medium">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 5. LIVE DELIVERY VISUAL SHOWCASE (Section 6) ─── */}
      <section className="py-20 bg-slate-900/40 border-y border-slate-800/80 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <span className="text-xs font-mono font-extrabold uppercase tracking-widest text-emerald-400">LIVE TRANSPARENCY</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">"Your delivery. In real time."</h2>
            <p className="text-slate-400 text-sm font-medium leading-relaxed">
              Experience the exact same live tracking environment as leading delivery apps. Customers see real-time updates without exposing other agents or sensitive operations data.
            </p>

            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="font-mono font-bold text-sky-400">#ORD-10482</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold text-[10px]">OUT FOR DELIVERY</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-slate-300">
                <div>Courier: <strong className="text-white">Rahul Sharma</strong></div>
                <div>Distance: <strong className="text-white">2.4 km away</strong></div>
                <div>Pickup: <strong className="text-slate-400">Connaught Place, Delhi</strong></div>
                <div>Destination: <strong className="text-slate-400">Sector 18, Noida</strong></div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-400" /> TIMELINE PROGRESSION
            </h4>
            {[
              { step: 'Order Confirmed', time: '10:30 AM', done: true },
              { step: 'Agent Assigned (Rahul Sharma)', time: '10:35 AM', done: true },
              { step: 'Package Picked Up', time: '11:04 AM', done: true },
              { step: 'In Transit', time: '11:18 AM', done: true },
              { step: 'Out for Delivery', time: '12:10 PM', current: true },
              { step: 'Delivered', time: 'Waiting', pending: true },
            ].map((st, idx) => (
              <div key={idx} className="flex items-center gap-3 text-xs">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                  st.done ? 'bg-emerald-500 text-slate-950' : st.current ? 'bg-sky-500 text-slate-950 ring-4 ring-sky-500/20 animate-pulse' : 'bg-slate-800 text-slate-500'
                }`}>
                  {st.done ? '✓' : idx + 1}
                </div>
                <div className="flex-1 flex justify-between">
                  <span className={`font-bold ${st.current ? 'text-sky-400' : st.done ? 'text-white' : 'text-slate-500'}`}>{st.step}</span>
                  <span className="font-mono text-slate-500 text-[11px]">{st.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 6. SMART AUTO-ASSIGNMENT SHOWCASE (Section 7) ─── */}
      <section id="auto-assignment" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className="text-xs font-mono font-extrabold uppercase tracking-widest text-sky-400">MULTI-FACTOR ALGORITHM</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">"Always assign the right agent."</h2>
          <p className="text-slate-400 text-sm font-medium">
            Our multi-factor assignment engine automatically ranks agents by Haversine proximity distance, active workload penalty, and location freshness.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Sparkles className="w-4 h-4 text-amber-400" /> CANDIDATE AGENT EVALUATION MATRIX
            </h3>
            {[
              { name: 'Rahul Sharma', vehicle: 'EV Bike', dist: '1.2 km', score: '-1', rec: true, status: 'AVAILABLE' },
              { name: 'Amit Patel', vehicle: 'VAN', dist: '3.4 km', score: '3.4', rec: false, status: 'AVAILABLE' },
              { name: 'Deepak Yadav', vehicle: 'EV Bike', dist: '4.8 km', score: 'N/A', rec: false, status: 'BUSY' },
            ].map((ag, i) => (
              <div
                key={i}
                className={`p-4 rounded-2xl border flex items-center justify-between text-xs transition-all ${
                  ag.rec ? 'bg-sky-500/10 border-sky-500/40 ring-1 ring-sky-500/30' : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold">
                    {ag.name[0]}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-white flex items-center gap-1.5">
                      {ag.name} {ag.rec && <span className="text-[10px] bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded font-extrabold">⭐ TOP MATCH</span>}
                    </h4>
                    <p className="text-[11px] text-slate-400">{ag.dist} away • {ag.vehicle}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    ag.status === 'AVAILABLE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {ag.status}
                  </span>
                  <span className="block font-mono text-[10px] text-slate-400 mt-1">Score: {ag.score}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-5 space-y-4 text-xs font-medium text-slate-300">
            <h3 className="font-extrabold text-base text-white">Evaluates 5 Critical Parameters:</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Agent Availability</strong>: Excludes busy, offline, or suspended agents.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Haversine Proximity</strong>: Calculates exact spherical distance to pickup coordinates.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Active Workload Penalty</strong>: Adds penalty score per ongoing assigned order.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Location Freshness</strong>: Warns if GPS location updated &gt; 5 mins ago.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Transactional Locks</strong>: Prevents simultaneous double-assignment race conditions.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ─── 7. 4-STEP HOW IT WORKS (Section 8) ─── */}
      <section id="how-it-works" className="py-20 bg-slate-900/40 border-y border-slate-800/80 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-mono font-extrabold uppercase tracking-widest text-sky-400">STREAMLINED WORKFLOW</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">How It Works</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { num: '01', title: 'Create Order', desc: 'Input pickup & drop addresses, package dimensions, and payment type.' },
              { num: '02', title: 'Smart Assignment', desc: 'The engine selects the nearest available agent via Haversine distance.' },
              { num: '03', title: 'Live Map Tracking', desc: 'Follow moving agent coordinates and receive automated status notifications.' },
              { num: '04', title: 'Successful Delivery', desc: 'OTP verification, photo proof certificate, and customer rating.' },
            ].map((step, i) => (
              <div key={i} className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-3 relative group hover:border-sky-500/40 transition-all">
                <span className="text-3xl font-extrabold font-mono text-sky-400 block">{step.num}</span>
                <h3 className="font-extrabold text-base text-white">{step.title}</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-medium">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 8. FAILED DELIVERY & RESCHEDULE SHOWCASE (Section 10) ─── */}
      <section id="reschedule" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className="text-xs font-mono font-extrabold uppercase tracking-widest text-rose-400">RELIABLE RECOVERY</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">"Even when delivery doesn't go as planned."</h2>
          <p className="text-slate-400 text-sm font-medium">
            Full automated recovery flow: record failure reason, allow customer date rescheduling, archive attempt history, and re-assign a new agent for Attempt #2.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-medium">
          <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-2">
            <span className="font-extrabold uppercase text-[10px] text-rose-400 block">STEP 1 — ATTEMPT 1 FAILED</span>
            <div className="font-bold text-white text-sm">Customer Unavailable</div>
            <p className="text-slate-400 text-[11px]">Agent Rahul records failed attempt with notes.</p>
          </div>

          <div className="p-5 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-300 space-y-2">
            <span className="font-extrabold uppercase text-[10px] text-sky-400 block">STEP 2 — RESCHEDULE</span>
            <div className="font-bold text-white text-sm">Customer Portal Slot</div>
            <p className="text-slate-400 text-[11px]">Customer selects new date (25 Aug, Morning slot).</p>
          </div>

          <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-2">
            <span className="font-extrabold uppercase text-[10px] text-amber-400 block">STEP 3 — RE-ASSIGNMENT</span>
            <div className="font-bold text-white text-sm">Attempt #2 Agent Selected</div>
            <p className="text-slate-400 text-[11px]">Auto-assigns new available agent (Amit Patel).</p>
          </div>

          <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-2">
            <span className="font-extrabold uppercase text-[10px] text-emerald-400 block">STEP 4 — DELIVERED</span>
            <div className="font-bold text-white text-sm">Attempt #2 Success ✓</div>
            <p className="text-slate-400 text-[11px]">Attempt #1 and #2 stored in immutable tracking history.</p>
          </div>
        </div>
      </section>

      {/* ─── 9. PUBLIC ORDER TRACKING BAR (Section 15) ─── */}
      <section id="track" className="py-16 bg-gradient-to-r from-sky-900/40 via-blue-900/20 to-slate-950 border-y border-slate-800 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Track Any Shipment Instantly</h2>
          <form onSubmit={handleTrackSubmit} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
              <input
                type="text"
                value={trackOrderInput}
                onChange={(e) => setTrackOrderInput(e.target.value)}
                placeholder="Enter Order ID (e.g. ORD-10482)..."
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl pl-12 pr-4 py-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 font-mono"
              />
            </div>
            <button
              type="submit"
              className="px-8 py-3.5 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs shadow-lg transition-all"
            >
              Track Shipment
            </button>
          </form>
        </div>
      </section>

      {/* ─── 10. ROLE-BASED ENTRY MODAL (Section 12) ─── */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-800 shadow-2xl space-y-6 relative text-left">
            <button
              type="button"
              onClick={() => setShowRoleModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <h3 className="text-xl font-extrabold text-white">How would you like to continue?</h3>
              <p className="text-xs text-slate-400">Select your account role to proceed to the platform</p>
            </div>

            <div className="space-y-3">
              {[
                { role: 'CUSTOMER', title: '👤 Customer Portal', desc: 'Track shipments, place orders, view price breakdown.', bg: 'hover:bg-sky-500/10 hover:border-sky-500/40', link: '/login' },
                { role: 'AGENT', title: '🚚 Delivery Agent Portal', desc: 'View assigned deliveries, update status, send live GPS.', bg: 'hover:bg-purple-500/10 hover:border-purple-500/40', link: '/login' },
                { role: 'ADMIN', title: '🛡️ Operations Admin', desc: 'Dispatch map, manage agents, view risk radar & analytics.', bg: 'hover:bg-emerald-500/10 hover:border-emerald-500/40', link: '/login' },
              ].map((item) => (
                <div
                  key={item.role}
                  onClick={() => {
                    setShowRoleModal(false);
                    navigate(item.link);
                  }}
                  className={`p-4 rounded-2xl bg-slate-950 border border-slate-800 cursor-pointer transition-all ${item.bg} group`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-sm text-white">{item.title}</h4>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── 11. FOOTER (Section 17) ─── */}
      <footer className="bg-slate-950 border-t border-slate-900 py-12 px-4 sm:px-6 lg:px-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-sky-500 text-slate-950 flex items-center justify-center font-bold">🚚</div>
              <span className="font-extrabold text-white text-sm">LAST-MILE TRACKER</span>
            </div>
            <p className="text-slate-500 text-[11px]">"Every Mile. Fully Visible."</p>
            <p className="text-slate-500 text-[11px]">Enterprise Logistics & Real-Time Tracking SaaS.</p>
          </div>

          <div>
            <h4 className="font-extrabold text-white uppercase text-[10px] tracking-wider mb-3">Product</h4>
            <ul className="space-y-2">
              <li><a href="#features" className="hover:text-white">Live Map Tracking</a></li>
              <li><a href="#auto-assignment" className="hover:text-white">Smart Agent Auto-Assignment</a></li>
              <li><a href="#reschedule" className="hover:text-white">Rescheduling Flow</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-extrabold text-white uppercase text-[10px] tracking-wider mb-3">Roles & Access</h4>
            <ul className="space-y-2">
              <li><Link to="/login" className="hover:text-white">Customer Portal</Link></li>
              <li><Link to="/login" className="hover:text-white">Agent Dispatch</Link></li>
              <li><Link to="/login" className="hover:text-white">Admin Command Center</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-extrabold text-white uppercase text-[10px] tracking-wider mb-3">Legal & Security</h4>
            <ul className="space-y-2">
              <li><span className="text-slate-500">Immutable Audit Logs</span></li>
              <li><span className="text-slate-500">JWT Role Protection</span></li>
              <li><span className="text-slate-500">OpenStreetMap API</span></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-slate-900 text-center text-slate-600 text-[11px]">
          © 2026 Last-Mile Tracker Logistics Platform. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
