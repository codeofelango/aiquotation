import { Navbar } from "../../components/Navbar";
import { getItems, addItem, embedAllItems } from "../../lib/api";
import { CourseCard } from "../../components/CourseCard";

async function addNewItem(formData: FormData) {
	"use server";
	const payload = {
		title: String(formData.get("title") || ""),
		description: String(formData.get("description") || ""),
		category: String(formData.get("category") || "Programming"),
		tags: String(formData.get("tags") || "")
			.split(",")
			.map(t => t.trim())
			.filter(Boolean),
		difficulty: String(formData.get("difficulty") || "Beginner")
	};
	await addItem(payload);
}

async function embedAllAction() {
	"use server";
	await embedAllItems();
}

export default async function ItemsPage() {
	const items = await getItems().catch(() => []);
	return (
		<div>
			<Navbar />
			<div className="max-w-6xl mx-auto px-6">
				<div className="mb-8">
					<h1 className="text-4xl font-bold text-brand mb-3">Course Catalog</h1>
					<p className="text-slate-600">Explore and manage our comprehensive course collection</p>
				</div>

			<form action={addNewItem} className="card rounded-xl p-6 mb-8">
				<h2 className="text-xl font-bold text-slate-900 mb-4">Add New Course</h2>
				<div className="grid gap-4">
					<div className="grid sm:grid-cols-2 gap-4">
						<input 
							name="title" 
							placeholder="Course Title" 
							className="border-2 border-slate-300 rounded-lg p-3 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand" 
							required 
						/>
						<input 
							name="category" 
							placeholder="Category" 
							className="border-2 border-slate-300 rounded-lg p-3 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand" 
							defaultValue="Programming" 
						/>
					</div>
					<textarea 
						name="description" 
						placeholder="Course Description" 
						className="border-2 border-slate-300 rounded-lg p-3 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand" 
						rows={3} 
						required 
					/>
					<div className="grid sm:grid-cols-2 gap-4">
						<input 
							name="tags" 
							placeholder="Tags (comma separated)" 
							className="border-2 border-slate-300 rounded-lg p-3 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand" 
						/>
						<select 
							name="difficulty" 
							className="border-2 border-slate-300 rounded-lg p-3 bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand" 
							defaultValue="Beginner"
						>
							<option>Beginner</option>
							<option>Intermediate</option>
							<option>Advanced</option>
						</select>
					</div>
					<div className="flex gap-3 pt-2">
						<button 
							type="submit" 
							className="px-6 py-3 rounded-lg bg-brand text-white font-semibold shadow-md hover:bg-brand-dark"
						>
							Add Course
						</button>
						{/* <form action={embedAllAction}> */}
							<button 
								type="submit" formAction={embedAllAction}
								className="px-6 py-3 rounded-lg border-2 border-slate-300 font-semibold text-slate-700 bg-white/50 backdrop-blur-sm hover:border-slate-400"
							>
								Embed All
							</button>
						{/* </form> */}
					</div>
				</div>
			</form>

				<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
					{items.map((it: any) => (
						<CourseCard key={it.id} course={it} />
					))}
				</div>
			</div>
		</div>
	);
}


