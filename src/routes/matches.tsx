// src/routes/matches.tsx
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/matches")({
  component: () => <Outlet />,
});
