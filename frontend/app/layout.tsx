import "./globals.css";
import React from "react";

export const metadata = {
	title: "AI Quotation - Intelligent Quotation Engine",
	description: "World-class AI automation for lighting RFPs and product matching."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body className="min-h-screen bg-slate-50">
				{children}
			</body>
		</html>
	);
}