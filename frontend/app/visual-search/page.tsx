"use client";

import { useState, useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { visualSearch } from "@/lib/api";
import { ProductImage } from "@/components/ProductImage";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { AuthGuard } from "@/components/AuthGuard";

export default function VisualSearchPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError("");
    }
  };

  const handleSearch = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError("");
    setResults([]);

    try {
      const data = await visualSearch(selectedFile);
      setResults(data);
    } catch (err) {
      console.error(err);
      setError("Failed to perform visual search. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError("");
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50 pb-20">
        <Navbar />

        <div className="bg-slate-900 text-white py-12 mb-8">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <h1 className="text-3xl font-bold mb-4">Visual Product Search</h1>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Upload a photo of a fixture, and our AI will find similar products from our catalog instantly.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Upload Area */}
            <div className="lg:col-span-1">
              <div 
                className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-24"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                <div className="mb-6">
                  <h2 className="font-bold text-slate-800 mb-2">Upload Image</h2>
                  <p className="text-sm text-slate-500">Drag & drop or click to browse</p>
                </div>

                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl aspect-square flex flex-col items-center justify-center cursor-pointer transition-all mb-6 relative overflow-hidden group ${previewUrl ? 'border-brand/50 bg-brand/5' : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'}`}
                >
                  {previewUrl ? (
                    <>
                      <img src={previewUrl} alt="Preview" className="absolute inset-0 w-full h-full object-contain p-4" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white font-bold text-sm">Change Image</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-6">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-3">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      </div>
                      <span className="text-brand font-bold text-sm">Click to Browse</span>
                    </div>
                  )}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileSelect} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </div>

                <button
                  onClick={handleSearch}
                  disabled={!selectedFile || loading}
                  className="w-full bg-brand text-white font-bold py-3 rounded-xl shadow-lg hover:bg-brand-dark transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="text-white flex items-center justify-center">
                       <LoadingSpinner size="sm" />
                    </div>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      <span>Find Matching Products</span>
                    </>
                  )}
                </button>
                {error && <div className="mt-4 text-red-500 text-sm text-center font-medium">{error}</div>}
              </div>
            </div>

            {/* Results Area */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-xl text-slate-800">Search Results</h2>
                {results.length > 0 && <span className="text-sm text-slate-500">{results.length} items found</span>}
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm animate-pulse">
                      <div className="bg-slate-100 aspect-video rounded-lg mb-3"></div>
                      <div className="h-4 bg-slate-100 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : results.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                  {results.map((product) => (
                    <div key={product.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all group flex flex-col">
                      <div className="aspect-video relative bg-slate-100 overflow-hidden">
                        <ProductImage 
                          src={product.image_url} 
                          alt={product.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                        <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                          {(product.score * 100).toFixed(0)}% MATCH
                        </div>
                      </div>
                      <div className="p-5 flex-1 flex flex-col">
                        <h3 className="font-bold text-slate-800 mb-1">{product.title}</h3>
                        <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">{product.description}</p>
                        
                        <div className="flex items-end justify-between mt-auto">
                          <div>
                            <div className="text-[10px] uppercase font-bold text-slate-400">List Price</div>
                            <div className="font-mono font-bold text-lg text-slate-700">${product.price?.toLocaleString()}</div>
                          </div>
                          <button className="text-brand text-xs font-bold hover:underline">
                            View Details →
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
                  <div className="text-slate-300 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-500 mb-1">No results yet</h3>
                  <p className="text-slate-400">Upload an image to start searching.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}