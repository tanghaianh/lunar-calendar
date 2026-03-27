#!/usr/bin/env node

const target = process.argv[2] ?? "http://localhost:3000/api/health";

try {
  const response = await fetch(target);
  const body = await response.json();
  console.log(
    JSON.stringify(
      {
        ok: response.ok,
        status: response.status,
        body,
      },
      null,
      2
    )
  );
} catch (error) {
  console.error("Health check failed:", error);
  process.exit(1);
}
