"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation"; // <--- 1. Import Router
import { 
  Shield, UploadCloud, FileText, X, CheckCircle, 
  AlertCircle, ChevronLeft, Lock, Globe 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function FIRUploadPage() {
  const router = useRouter(); // <--- 2. Initialize Router
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle");
  const [responseMsg, setResponseMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).filter(file => file.type === "application/pdf");
      setFiles((prev) => [...prev, ...newFiles]);
      setUploadStatus("idle");
    }
  };

  // Handle Drag & Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).filter(file => file.type === "application/pdf");
      setFiles((prev) => [...prev, ...newFiles]);
      setUploadStatus("idle");
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  // --- THE BACKEND CONNECTION ---
  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadStatus("idle");

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${API_URL}/documents/`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      setUploadStatus("success");
      setResponseMsg(`Successfully processed ${files.length} FIR documents. Redirecting...`);
      setFiles([]); 

      // <--- 3. REDIRECT LOGIC ---
      // Wait 1.5 seconds so user sees the "Success" message, then go to Select Role
      setTimeout(() => {
        router.push("/selectrole");
      }, 1500);
      // --------------------------

    } catch (error) {
      console.error(error);
      setUploadStatus("error");
      setResponseMsg("Connection to server failed. Please check if the backend is running.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* ================= TOP STRIP ================= */}
      <div className="bg-slate-900 text-slate-300 py-1.5 px-6 text-[11px] font-medium flex justify-between items-center">
        <div className="flex gap-4">
          <span>Government of India</span>
          <span>Ministry of Home Affairs</span>
        </div>
        <div className="flex items-center gap-2">
          <Lock className="w-3 h-3" /> Secure CCTNS Uplink
        </div>
      </div>

      {/* ================= HEADER ================= */}
      <header className="bg-white border-b border-slate-200 shadow-sm py-4 px-6">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-12 bg-[url('https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg')] bg-contain bg-no-repeat bg-center opacity-90" />
            <div>
              <h1 className="text-lg font-black text-blue-900 leading-none">NYAYARAKSHAK</h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Data Ingestion Portal
              </p>
            </div>
          </div>
          <Link href="/selectrole" className="text-sm font-semibold text-slate-500 hover:text-blue-700 flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" /> Return to Dashboard
          </Link>
        </div>
      </header>

      {/* ================= UPLOAD INTERFACE ================= */}
      <main className="max-w-3xl mx-auto py-12 px-6">
        
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800">Upload FIR Documents</h2>
          <p className="text-slate-500 text-sm mt-1">
            Upload digitized First Information Reports (PDF only) for AI Analysis and Hotspot Mapping.
          </p>
        </div>

        {/* DROP ZONE */}
        <div 
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-blue-200 bg-blue-50/50 rounded-xl p-10 text-center hover:bg-blue-50 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            multiple 
            accept=".pdf" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileChange}
          />
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-blue-900">Click to upload or drag and drop</h3>
          <p className="text-sm text-slate-500 mt-2">
            Supported Format: PDF (Max 10MB per file)
          </p>
        </div>

        {/* FILE LIST PREVIEW */}
        <div className="mt-8 space-y-3">
          <AnimatePresence>
            {files.map((file, index) => (
              <motion.div 
                key={`${file.name}-${index}`}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white border border-slate-200 rounded-lg p-3 flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-red-50 text-red-600 p-2 rounded">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700 truncate max-w-[200px] sm:max-w-md">
                      {file.name}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {(file.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => removeFile(index)}
                  className="text-slate-400 hover:text-red-500 p-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {files.length === 0 && uploadStatus === 'idle' && (
             <div className="text-center text-sm text-slate-400 py-4 italic">
               No files selected yet.
             </div>
          )}
        </div>

        {/* ACTION BUTTONS & STATUS */}
        <div className="mt-8 border-t border-slate-200 pt-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-500">
              {files.length} document{files.length !== 1 ? 's' : ''} ready for ingestion
            </div>
            
            <button 
              onClick={handleUpload}
              disabled={isUploading || files.length === 0}
              className={`px-8 py-3 rounded-lg font-bold text-white shadow-lg transition-all flex items-center gap-2
                ${isUploading || files.length === 0 
                  ? "bg-slate-300 cursor-not-allowed" 
                  : "bg-blue-700 hover:bg-blue-800 hover:-translate-y-1 shadow-blue-900/20"
                }`}
            >
              {isUploading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" /> Upload Batch
                </>
              )}
            </button>
          </div>

          {/* SUCCESS / ERROR MESSAGES */}
          {uploadStatus === "success" && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg flex items-center gap-3"
            >
              <CheckCircle className="w-5 h-5" />
              <div>
                <p className="font-bold text-sm">Upload Successful</p>
                <p className="text-xs">{responseMsg}</p>
              </div>
            </motion.div>
          )}

          {uploadStatus === "error" && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5" />
              <div>
                <p className="font-bold text-sm">Upload Failed</p>
                <p className="text-xs">{responseMsg}</p>
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}