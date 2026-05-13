const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export type User = {
    id: number;
    name: string;
    email: string;
};

export type AuthResponse = {
    token: string;
    user: User;
};

export async function login(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Login failed");
    }

    const data = await res.json();
    
    // Save session
    if (typeof window !== "undefined") {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
    }
    
    return data;
}

export function logout() {
    if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        // Optional: Force reload or redirect
        window.location.href = "/login";
    }
}

export function getCurrentUser(): User | null {
    if (typeof window === "undefined") return null;
    
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;
    
    try {
        return JSON.parse(userStr);
    } catch {
        return null;
    }
}

export function getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
}

export function isAuthenticated(): boolean {
    return !!getToken();
}