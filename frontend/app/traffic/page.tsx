"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  AlertTriangle,
  Activity,
  Car,
  Clock,
  LayoutDashboard,
  MapPin,
  Menu,
  ChevronRight,
  Signal,
  Siren,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ================= MAP =================
// Using the updated LiveCrimeMap (which now expects 'incidents')
const TrafficMap = dynamic(() => import("@/app/components/LiveCrimeMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-200 animate-pulse rounded-xl flex items-center justify-center text-slate-400 text-xs">
      Initializing Traffic Network...
    </div>
  ),
});

// ================= TYPES =================
type FIR = {
  fir_id: string;
  crime_type: string;
  location_text: string;
  complaint_text?: string;
  geo?: any; // Changed to any to handle string/object parsing
  time?: string;
  status: string;
};

// ================= LOCATION MAPPER (Fallback) =================
const getLocationCoords = (location: string) => {
  const loc = (location || "").toLowerCase();

  if (loc.includes("western express") || loc.includes("rawalpada"))
    return { lat: 19.2562, lon: 72.8665 };
  if (loc.includes("borivali") && loc.includes("station"))
    return { lat: 19.2291, lon: 72.8572 };
  if (loc.includes("shimpoli") || loc.includes("link road"))
    return { lat: 19.2305, lon: 72.84 };
  if (loc.includes("sv road") || loc.includes("dahisar"))
    return { lat: 19.249, lon: 72.859 };
  if (loc.includes("mandapeshwar")) return { lat: 19.245, lon: 72.85 };
  if (loc.includes("kandarpada")) return { lat: 19.235, lon: 72.845 };

  return { lat: 19.23, lon: 72.85 };
};

// ================= BALANCED SEVERITY LOGIC =================
function calculateSeverity(fir: FIR): number {
  let score = 0;
  const text = (fir.complaint_text || "").toLowerCase();
  const type = fir.crime_type.toLowerCase();

  // 1. Base Scores
  if (type.includes("traffic") || type.includes("obstruction")) score += 0.2;
  if (type.includes("accident")) score += 0.9;
  if (type.includes("murder") || type.includes("assault")) score += 0.9;

  // 2. Context Boosters
  if (
    text.includes("death") ||
    text.includes("dead") ||
    text.includes("fatal")
  )
    score += 0.4;
  if (
    text.includes("injury") ||
    text.includes("injured") ||
    text.includes("hospital")
  )
    score += 0.2;
  if (text.includes("standstill") || text.includes("blocked")) score += 0.2;
  if (text.includes("heavy") || text.includes("jam")) score += 0.1;

  return Math.min(score, 1.0);
}

function recommendAction(fir: FIR, severity: number): string {
  const type = fir.crime_type.toLowerCase();

  if (severity >= 0.8) return "Emergency Response Required";
  if (type.includes("accident")) return "Dispatch Patrol & Ambulance";
  if (severity >= 0.5) return "Clear Obstruction";

  return "Monitor Flow";
}

// ================= MAIN COMPONENT =================
export default function TrafficDashboard() {
  const [firs, setFirs] = useState<FIR[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // --- FETCH DATA ---
  useEffect(() => {
    fetch(`${API_URL}/law-order/dashboard`)
      .then((r) => r.json())
      .then((d) => {
        // Handle both data structures (direct list or dashboard wrapper)
        const rawList = d.recent_complaints || d.firs || [];
        
        const processedFirs = rawList.map((f: any) => ({
          ...f,
          location_text: f.location || f.location_text || "Unknown Location",
        }));
        setFirs(processedFirs);
        setLoading(false);
      })
      .catch((e) => {
        console.error("Fetch error:", e);
        setLoading(false);
      });
  }, []);

  const trafficFIRs = firs.filter(
    (f) =>
      f.crime_type.toLowerCase().includes("traffic") ||
      f.crime_type.toLowerCase().includes("accident") ||
      f.crime_type.toLowerCase().includes("road")
  );

  // --- PREPARE DATA FOR MAP (Using Real Geo Logic) ---
  const mapIncidents = trafficFIRs.map((f) => {
    // 1. PARSE GEO (Same logic as Police Dashboard)
    let lat, lon;

    if (typeof f.geo === "object" && f.geo !== null && f.geo.lat) {
      lat = f.geo.lat;
      lon = f.geo.lon;
    } else if (typeof f.geo === "string") {
      try {
        const cleanJson = f.geo.replace(/'/g, '"');
        const parsed = JSON.parse(cleanJson);
        lat = parsed.lat;
        lon = parsed.lon;
      } catch (e) { /* ignore */ }
    }

    // 2. FALLBACK
    if (!lat || !lon) {
      const fallback = getLocationCoords(f.location_text);
      lat = fallback.lat;
      lon = fallback.lon;
    }

    // 3. DETERMINE PRIORITY (For Color Coding)
    const severity = calculateSeverity(f);
    let priority = "Low";
    if (severity >= 0.8) priority = "High"; // Red
    else if (severity >= 0.5) priority = "Medium"; // Orange

    return {
      lat,
      lon,
      crime: f.crime_type,
      priority: priority,
    };
  });

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 flex">
      {/* SIDEBAR */}
      <motion.aside
        initial={{ width: 250 }}
        animate={{ width: sidebarOpen ? 250 : 80 }}
        className="bg-slate-900 text-white sticky top-0 h-screen flex flex-col z-20 shadow-xl"
      >
        <div className="p-6 flex items-center gap-4 border-b border-slate-800">
          {/* Emblem Logo */}
          <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center p-1 overflow-hidden">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg"
              alt="Satyamev Jayate"
              className="w-full h-full object-contain"
            />
          </div>

          {sidebarOpen && (
            <div>
              <h1 className="font-bold leading-none text-lg">NyayaRakshak</h1>
              <span className="text-[9px] text-green-400 uppercase tracking-widest block mt-1">
                Traffic Control
              </span>
            </div>
          )}
        </div>

        <nav className="flex-1 py-6 px-3 space-y-2">
          {[
            { id: "overview", label: "Live Overview", icon: LayoutDashboard },
            { id: "traffic", label: "Traffic Incidents", icon: AlertTriangle },
            { id: "signals", label: "Signal Status", icon: Signal },
            { id: "challans", label: "E-Challans", icon: Car },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all ${
                activeTab === item.id
                  ? "bg-green-700 text-white shadow-lg"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {sidebarOpen && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center p-2 hover:bg-slate-800 rounded"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </motion.aside>

      {/* CONTENT */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white h-16 border-b border-slate-200 flex items-center justify-between px-8 shadow-sm">
          <h2 className="text-xl font-bold text-slate-800 capitalize flex items-center gap-2">
            {activeTab.replace("-", " ")} Dashboard
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <p className="text-sm font-bold text-slate-900">
                DCP. Arjun Mehta
              </p>
              <p className="text-xs text-slate-500">
                Traffic HQ, Central Zone
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-green-700 font-bold">
              A
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {loading ? (
                <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
                  <Activity className="w-10 h-10 animate-spin mb-4 text-green-600" />
                  <p className="text-sm font-medium">
                    Synchronizing Traffic Feeds...
                  </p>
                </div>
              ) : (
                <>
                  {activeTab === "overview" && (
                    <div className="space-y-6">
                      {/* STATS ROW */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                          <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                            <AlertTriangle className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-slate-800">
                              {trafficFIRs.length}
                            </p>
                            <p className="text-xs text-slate-500 uppercase font-bold">
                              Active Incidents
                            </p>
                          </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                          <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
                            <Clock className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-slate-800">
                              12 min
                            </p>
                            <p className="text-xs text-slate-500 uppercase font-bold">
                              Avg Response
                            </p>
                          </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                            <Car className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-slate-800">
                              4
                            </p>
                            <p className="text-xs text-slate-500 uppercase font-bold">
                              Cranes Deployed
                            </p>
                          </div>
                        </div>
                        <div className="bg-green-900 text-white p-4 rounded-xl shadow-md flex flex-col justify-center">
                          <p className="text-xs font-bold text-green-300 uppercase">
                            Green Corridor
                          </p>
                          <p className="text-sm font-medium mt-1">
                            Route 4: Clear
                          </p>
                        </div>
                      </div>

                      {/* MAP + ALERTS ROW */}
                      <div className="grid md:grid-cols-3 gap-6 h-[600px]">
                        {/* THE MAP (Takes 2/3 width) */}
                        <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden relative">
                          {/* UPDATED: Passing 'incidents' instead of 'zones' */}
                          <TrafficMap incidents={mapIncidents} />
                          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg shadow-sm text-xs font-bold text-slate-700 z-[400] flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>{" "}
                            LIVE TRAFFIC FEED ({mapIncidents.length})
                          </div>
                        </div>

                        {/* LIVE UPDATES */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
                          <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-orange-500" />{" "}
                            Live Updates
                          </h3>
                          <div className="space-y-4 overflow-y-auto flex-1 pr-2">
                            {trafficFIRs.slice(0, 8).map((f) => (
                              <div
                                key={f.fir_id}
                                className="p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-blue-200 transition"
                              >
                                <div className="flex justify-between items-start mb-1">
                                  <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                                    {f.fir_id}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {f.time || "Just now"}
                                  </span>
                                </div>
                                <p className="text-xs font-bold text-slate-800 mb-1">
                                  {f.location_text}
                                </p>
                                <p className="text-[10px] text-slate-500 line-clamp-2">
                                  {f.complaint_text}
                                </p>
                              </div>
                            ))}
                            {trafficFIRs.length === 0 && (
                              <p className="text-xs text-slate-400 text-center mt-10">
                                No active incidents reported.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* INCIDENTS TABLE TAB */}
                  {activeTab === "traffic" && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-red-600" />{" "}
                          Incident Log
                        </h3>
                        <div className="flex gap-2">
                          <span className="text-xs font-bold bg-white border px-3 py-1.5 rounded text-slate-600">
                            Total: {trafficFIRs.length}
                          </span>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                            <tr>
                              <th className="px-6 py-3">FIR ID</th>
                              <th className="px-6 py-3">Location</th>
                              <th className="px-6 py-3">Type</th>
                              <th className="px-6 py-3">Impact Level</th>
                              <th className="px-6 py-3">AI Recommendation</th>
                              <th className="px-6 py-3">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {trafficFIRs.map((f) => {
                              const severity = calculateSeverity(f);

                              let impact = "Minor";
                              let impactColor =
                                "bg-yellow-100 text-yellow-700";

                              if (severity >= 0.8) {
                                impact = "Critical";
                                impactColor = "bg-red-100 text-red-700";
                              } else if (severity >= 0.5) {
                                impact = "Major";
                                impactColor = "bg-orange-100 text-orange-700";
                              }

                              return (
                                <tr
                                  key={f.fir_id}
                                  className="hover:bg-slate-50 transition"
                                >
                                  <td className="px-6 py-4 font-mono font-bold text-slate-700">
                                    {f.fir_id}
                                  </td>
                                  <td className="px-6 py-4 flex items-center gap-2">
                                    <MapPin className="w-3 h-3 text-slate-400" />{" "}
                                    {f.location_text}
                                  </td>
                                  <td className="px-6 py-4 text-slate-600">
                                    {f.crime_type}
                                  </td>
                                  <td className="px-6 py-4">
                                    <span
                                      className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${impactColor}`}
                                    >
                                      {impact}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-xs font-semibold text-slate-700">
                                    {recommendAction(f, severity)}
                                  </td>
                                  <td className="px-6 py-4">
                                    <button className="text-blue-600 hover:text-blue-800 font-bold text-xs flex items-center gap-1">
                                      Dispatch{" "}
                                      <ChevronRight className="w-3 h-3" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {activeTab === "signals" && (
                    <div className="flex flex-col items-center justify-center h-[50vh] text-slate-400">
                      <Signal className="w-16 h-16 mb-4 text-slate-200" />
                      <p>Signal Synchronization Module</p>
                      <span className="text-xs bg-slate-100 px-2 py-1 rounded mt-2">
                        Coming Soon
                      </span>
                    </div>
                  )}

                  {activeTab === "challans" && (
                    <div className="flex flex-col items-center justify-center h-[50vh] text-slate-400">
                      <Car className="w-16 h-16 mb-4 text-slate-200" />
                      <p>E-Challan Database Access</p>
                      <span className="text-xs bg-slate-100 px-2 py-1 rounded mt-2">
                        Secure Connection Required
                      </span>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}