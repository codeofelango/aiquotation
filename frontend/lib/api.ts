const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

async function getJSON(path: string, options?: RequestInit) {
	const res = await fetch(`${BASE_URL}${path}`, { cache: "no-store", ...options });
	if (!res.ok) throw new Error(`Request failed: ${res.status}`);
	return res.json();
}

export async function getUsers() {
	return getJSON("/users");
}

export async function getUser(id: number) {
	const users = await getUsers();
	return users.find((u: any) => u.id === id);
}

export async function getItems() {
	return getJSON("/items");
}

export async function embedAllItems() {
	return getJSON("/items/embed_all", { method: "POST" });
}

export async function addItem(payload: any) {
	return getJSON("/items/add", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload)
	});
}

export async function getRecommendations(userId: number) {
	return getJSON(`/recommend/${userId}`);
}

export async function getAbTestSummary() {
	return getJSON("/abtest/summary");
}


