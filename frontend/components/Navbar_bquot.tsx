import Link from "next/link";

export function Navbar() {
	return (
		<nav className="glass-nav flex items-center justify-between px-8 py-5 mb-12">
			<Link href="/" className="font-bold text-2xl text-brand">
				Recs Dashboard
			</Link>
			<div className="flex gap-8 text-slate-600 font-medium">
				<Link href="/users" className="hover:text-brand">
					Users
				</Link>
				<Link href="/items" className="hover:text-brand">
					Items
				</Link>
				<Link href="/abtest" className="hover:text-brand">
					A/B Tests
				</Link>
			</div>
		</nav>
	);
}

