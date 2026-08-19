const PYTHON_URL = process.env.PYTHON_MICROSERVICE_URL || "http://localhost:8000";

export async function callPythonService<T>(endpoint: string, payload?: any, method: string = "POST"): Promise<T | null> {
  try {
    const res = await fetch(`${PYTHON_URL}${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: payload ? JSON.stringify(payload) : undefined,
      cache: "no-store",
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.warn(`Python service warning on ${endpoint} (${res.status}): ${errorText}`);
      return null;
    }

    return await res.json();
  } catch (error) {
    console.warn(`Python microservice offline or unreachable on ${PYTHON_URL}${endpoint}. Utilizing internal deterministic fallback.`);
    return null;
  }
}
