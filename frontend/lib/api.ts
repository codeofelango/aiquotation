const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

async function getJSON(path: string, options?: RequestInit) {
	const res = await fetch(`${BASE_URL}${path}`, { cache: "no-store", ...options });
	if (!res.ok) {
        let errorMsg = `Request failed: ${res.status}`;
        try {
            const data = await res.json();
            if (data.detail) errorMsg = data.detail;
        } catch (e) {}
        throw new Error(errorMsg);
    }
	return res.json();
}

export async function getUsers() { return getJSON("/users"); }
export async function getUser(id: number) { 
    const users = await getUsers();
    return users.find((u: any) => u.id === id); 
}
export async function getItems() { return getJSON("/items"); }
export async function embedAllItems() { return getJSON("/items/embed_all", { method: "POST" }); }
export async function addItem(payload: any) {
	return getJSON("/items/add", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload)
	});
}
export async function getRecommendations(userId: number) { return getJSON(`/recommend/${userId}`); }
export async function getAbTestSummary() { return getJSON("/abtest/summary"); }

// --- Quotation API ---

export async function uploadRFP(file: File) {
	const formData = new FormData();
	formData.append("file", file);
	
    const res = await fetch(`${BASE_URL}/quotation/upload`, {
		method: "POST",
		body: formData,
	});
    
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Upload failed");
    }
    return res.json();
}

export async function getQuotations() { return getJSON("/quotation/list"); }
export async function getQuotation(id: number) { return getJSON(`/quotation/${id}`); }

export async function updateQuotation(id: number, payload: any) {
    return getJSON(`/quotation/${id}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });
}

export async function rematchQuotation(id: number, requirements: any[]) {
    return getJSON(`/quotation/${id}/rematch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requirements)
    });
}

export async function setQuotationStatus(id: number, status: string) {
    return getJSON(`/quotation/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
    });
}