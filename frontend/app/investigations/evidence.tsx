"use client";

import { useState } from "react";
import { Video, FileText, Shield, Network, AlertTriangle, Eye, Upload, FileCheck, MapPin, Clock } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Node = { id: string; label: string; type: string };
type Edge = { from: string; to: string; label: string };

export default function EvidencePage() {
  const [videoResult, setVideoResult] = useState<any>(null);
  const [graphData, setGraphData] = useState<{ nodes: Node[]; edges: Edge[] } | null>(null);
  const [loadingVideo, setLoadingVideo] = useState(false);
  const [loadingDoc, setLoadingDoc] = useState(false);

  // ================= CCTV =================
  async function uploadVideo(e: any) {
    e.preventDefault();
    setLoadingVideo(true);
    setVideoResult(null);

    const fd = new FormData();
    fd.append("cctv_video", e.target.video.files[0]);
    if (e.target.suspect?.files?.length > 0) fd.append("criminal_img", e.target.suspect.files[0]);

    const res = await fetch(`${API_URL}/analyze/`, {
      method: "POST",
      body: fd,
    });

    if (!res.ok) {
      const err = await res.text();
      alert("Video API Error: " + err);
      setLoadingVideo(false);
      return;
    }
    const data = await res.json();

    setVideoResult(data);
    setLoadingVideo(false);
  }

  // ================= DOCS =================
  async function uploadDoc(e: any) {
    e.preventDefault();
    setLoadingDoc(true);
    setGraphData(null);

    const fd = new FormData();
    const files = e.target.doc.files;
  for (let i = 0; i < files.length; i++) {
    // We use the same key "files" for all of them
    fd.append("files", files[i]); 
  };

    const r1 = await fetch(`${API_URL}/analyze/text`, {
      method: "POST",
      body: fd,
    });

    if (!r1.ok) {
      alert("Document upload failed");
      setLoadingDoc(false);
      return;
    }

    await fetch(`${API_URL}/analyze/graph`);

    const g = await fetch(`${API_URL}/analyze/case-graph/`);
    const gd = await g.json();

    setGraphData({
      nodes: Array.isArray(gd.nodes) ? gd.nodes : [],
      edges: Array.isArray(gd.edges) ? gd.edges : [],
    });

    setLoadingDoc(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Professional Header */}
      <header className="bg-white border-b-4 border-blue-600 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                NyayRakshak Intelligence System
              </h1>
              <p className="text-gray-600 mt-1 font-medium">AI-Powered Evidence Analysis & Case Linkage Platform</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-8 py-8">
        {/* ================= CCTV SECTION ================= */}
        <section className="mb-10">
          <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-200 overflow-hidden">
            {/* Section Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <Video className="w-6 h-6" />
                CCTV Video Analysis
              </h2>
              <p className="text-blue-100 text-sm mt-1">Upload surveillance footage for automated event detection</p>
            </div>

            {/* Upload Form */}
            <div className="p-6">
              <form onSubmit={uploadVideo} className="space-y-5">
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Video className="w-4 h-4 text-blue-600" />
                      CCTV Video File
                    </label>
                    <div className="relative">
                      <input
                        name="video"
                        type="file"
                        accept="video/*"
                        required
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:font-semibold file:cursor-pointer hover:file:bg-blue-700"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Eye className="w-4 h-4 text-blue-600" />
                      Suspect Reference Image <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <input
                        name="suspect"
                        type="file"
                        accept="image/*"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:font-semibold file:cursor-pointer hover:file:bg-blue-700"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                >
                  <Upload className="w-5 h-5" />
                  Analyze Footage
                </button>
              </form>

              {loadingVideo && (
                <div className="mt-6 flex items-center gap-3 bg-blue-50 border-2 border-blue-300 rounded-lg px-6 py-4">
                  <div className="w-5 h-5 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-blue-700 font-semibold">Analyzing CCTV footage with AI...</span>
                </div>
              )}

              {/* Results */}
              {videoResult && (
                <div className="mt-6 grid lg:grid-cols-2 gap-6">
                  {/* Events */}
                  <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl border-2 border-red-200 p-6">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-gray-900">
                      <AlertTriangle className="text-red-600 w-6 h-6" />
                      Detected Events
                    </h3>

                    <div className="space-y-3">
                      {videoResult.events_detected?.map((e: any, i: number) => (
                        <div
                          key={i}
                          className="bg-white rounded-lg border-l-4 border-red-500 p-4 shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <p className="font-bold text-gray-900 text-base">{e.event}</p>
                            <span className="text-xs font-mono bg-red-100 text-red-700 px-3 py-1 rounded-full border border-red-300">
                              {e.time_window}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed">{e.llm_report}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Evidence Frames */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 p-6">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-gray-900">
                      <FileCheck className="text-blue-600 w-6 h-6" />
                      Evidence Frames
                    </h3>

                    <div className="grid grid-cols-2 gap-3">
                      {videoResult.evidence_files?.map((img: string, i: number) => (
                        <div
                          key={i}
                          className="group relative aspect-video bg-gray-200 rounded-lg overflow-hidden border-2 border-gray-300 hover:border-blue-500 transition-all shadow-sm hover:shadow-md"
                        >
                          <img
                            src={`${API_URL}/evidence/${img}`}
                            className="w-full h-full object-cover"
                            alt={`Evidence ${i + 1}`}
                          />
                          <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded font-mono">
                            Frame {i + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ================= DOCS SECTION ================= */}
        <section className="mb-10">
          <div className="bg-white rounded-2xl shadow-lg border-2 border-indigo-200 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <FileText className="w-6 h-6" />
                Document Intelligence & Entity Extraction
              </h2>
              <p className="text-indigo-100 text-sm mt-1">Upload FIR reports, case documents, or investigation logs</p>
            </div>

            <div className="p-6">
              <form onSubmit={uploadDoc} className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-1 w-full">
                  <input
                    name="doc"
                    type="file"
                    accept=".pdf,.docx,.txt"
                    required
                    multiple
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white file:font-semibold file:cursor-pointer hover:file:bg-indigo-700"
                  />
                </div>

                <button
                  type="submit"
                  className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 whitespace-nowrap"
                >
                  <Network className="w-5 h-5" />
                  Generate Case Graph
                </button>
              </form>

              {loadingDoc && (
                <div className="mt-6 flex items-center gap-3 bg-indigo-50 border-2 border-indigo-300 rounded-lg px-6 py-4">
                  <div className="w-5 h-5 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-indigo-700 font-semibold">Extracting entities and building case graph...</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ================= GRAPH SECTION ================= */}
        {graphData && (
          <section>
            <div className="bg-white rounded-2xl shadow-lg border-2 border-purple-200 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                  <Network className="w-6 h-6" />
                  AI Case Linkage Graph
                </h2>
                <p className="text-purple-100 text-sm mt-1">Visual representation of evidence relationships and connections</p>
              </div>

              <div className="p-8">
                <CaseGraph data={graphData} />
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

/* ===================== IMPROVED LOGICAL GRAPH ===================== */
function CaseGraph({ data }: { data: { nodes: Node[]; edges: Edge[] } }) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  if (!data || data.nodes.length === 0) {
    return (
      <div className="bg-slate-900 rounded-xl border-2 border-slate-800 p-12 text-center">
        <Network className="w-20 h-20 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400 text-lg font-medium">No case data yet</p>
      </div>
    );
  }

  // Adjusted dimensions to prevent clipping at the top
  const width = 1000;
  const height = 800; // Increased height
  const centerX = width / 2;
  const centerY = height / 2 + 30; // Shifted center down slightly to protect the top

  const positions: Record<string, { x: number; y: number; label: string; type: string; id: string }> = {};

  // 1. Logic to find the true "Central" node (Active Case)
  const centerNode = data.nodes.find(n => n.type === "document" || n.label.toLowerCase().includes("active")) || data.nodes[0];
  const outerNodes = data.nodes.filter(n => n.id !== centerNode.id);

  // Place center node at the adjusted center
  positions[centerNode.id] = { ...centerNode, x: centerX, y: centerY };

  // 2. Spread outer nodes in a wide, clear circle
const radius = Math.min(350, 80 + outerNodes.length * 18);
  outerNodes.forEach((node, i) => {
    const angle = (i / outerNodes.length) * 2 * Math.PI - Math.PI / 2; // Start from top (-90 deg)
    positions[node.id] = {
      ...node,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  });

  const typeColors = {
    person: { bg: "#f43f5e", border: "#881337", icon: "👤" },
    event: { bg: "#f59e0b", border: "#78350f", icon: "⚠️" },
    location: { bg: "#10b981", border: "#064e3b", icon: "📍" },
    document: { bg: "#3b82f6", border: "#1e3a8a", icon: "🛡️" },
    video_source: { bg: "#8b5cf6", border: "#4c1d95", icon: "📹" }
  };

  return (
    <div className="bg-[#0f172a] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden p-4">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto max-h-[700px]"
        style={{ filter: "drop-shadow(0 0 10px rgba(0,0,0,0.5))" }}
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Connection Lines */}
        {data.edges.map((edge, i) => {
          const from = positions[edge.from];
          const to = positions[edge.to];
          if (!from || !to) return null;
          const isHighlighted = hoveredNode === edge.from || hoveredNode === edge.to;

          return (
            <line
              key={`line-${i}`}
              x1={from.x} y1={from.y}
              x2={to.x} y2={to.y}
              stroke={isHighlighted ? "#6366f1" : "#334155"}
              strokeWidth={isHighlighted ? "3" : "1.5"}
              strokeDasharray={isHighlighted ? "0" : "4,4"}
              className="transition-all duration-300"
              opacity={isHighlighted ? 1 : 0.4}
            />
          );
        })}

        {/* Nodes */}
        {Object.values(positions).map((node) => {
          const config = typeColors[node.type as keyof typeof typeColors] || typeColors.document;
          const isHovered = hoveredNode === node.id;
          const isCenter = node.id === centerNode.id;

          return (
            <g
              key={node.id}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              className="cursor-pointer group"
            >
              {/* Node Outer Glow (Active Case only) */}
              {isCenter && (
                <circle cx={node.x} cy={node.y} r="50" fill={config.bg} opacity="0.1" className="animate-pulse" />
              )}

              {/* Main Node Circle */}
              <circle
                cx={node.x} cy={node.y}
                r={isCenter ? 40 : 32}
                fill={isHovered ? config.bg : "#1e293b"}
                stroke={config.bg}
                strokeWidth="2.5"
                filter={isHovered ? "url(#glow)" : ""}
                className="transition-all duration-300"
              />

              <text x={node.x} y={node.y + 7} textAnchor="middle" fontSize={isCenter ? "24" : "20"}>
                {config.icon}
              </text>

              {/* Floating Labels with Background for Readability */}
              <g transform={`translate(${node.x}, ${node.y + (isCenter ? 65 : 55)})`}>
                <text
                  textAnchor="middle"
                  fill={isHovered ? "white" : "#94a3b8"}
                  fontSize="13"
                  fontWeight={isCenter ? "bold" : "medium"}
                  className="transition-colors duration-300"
                >
                  {node.label}
                </text>
                <text
                  y="15"
                  textAnchor="middle"
                  fill={config.bg}
                  fontSize="10"
                  fontWeight="bold"
                  className="uppercase tracking-tighter opacity-70"
                >
                  {node.type.replace('_', ' ')}
                </text>
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}