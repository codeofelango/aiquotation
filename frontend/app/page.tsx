import Link from "next/link";
import { Navbar } from "../components/Navbar";

export default function HomePage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
            <Navbar />
            
            <main className="max-w-7xl mx-auto px-6 pt-20 pb-32">
                <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-20">
                    <div className="inline-flex items-center gap-2 bg-brand/5 text-brand px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wide mb-6 border border-brand/10">
                        <span className="w-2 h-2 rounded-full bg-brand animate-pulse"></span>
                        AI Quotation Live
                    </div>
                    
                    <h1 className="text-6xl md:text-7xl font-extrabold text-slate-900 mb-8 leading-tight tracking-tight">
                        Intelligent Lighting <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand to-teal-500">Quotation Engine</span>
                    </h1>
                    
                    <p className="text-slate-500 text-xl md:text-2xl leading-relaxed max-w-2xl mx-auto mb-12">
                        Upload complex RFP specifications and let our autonomous AI agents extract, analyze, and match products in seconds—not days.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                        <Link 
                            href="/quotation" 
                            className="flex-1 bg-slate-900 text-white text-lg font-bold py-4 px-8 rounded-xl shadow-xl shadow-brand/20 hover:scale-105 hover:bg-slate-800 transition-all flex items-center justify-center gap-3 group"
                        >
                            <span>Launch Dashboard</span>
                            <span className="group-hover:translate-x-1 transition-transform">→</span>
                        </Link>
                    </div>
                </div>

                {/* Feature Grid */}
                <div className="grid md:grid-cols-3 gap-8">
                    {/* Feature 1 */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl mb-6">
                            📄
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-3">Smart Extraction</h3>
                        <p className="text-slate-500 leading-relaxed">
                            Our AI reads PDFs like a senior engineer, identifying critical specs like Wattage, CCT, and IP Ratings instantly.
                        </p>
                    </div>

                    {/* Feature 2 */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center text-3xl mb-6">
                            🎯
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-3">Semantic Matching</h3>
                        <p className="text-slate-500 leading-relaxed">
                            Vector search understands context. It matches "Exterior Wall Washer" to the correct IP67 fixture in your catalog.
                        </p>
                    </div>

                    {/* Feature 3 */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-3xl mb-6">
                            ⚡
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-3">Instant Proposals</h3>
                        <p className="text-slate-500 leading-relaxed">
                            Generate professional, client-ready PDF quotations with product images and pricing in a single click.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}