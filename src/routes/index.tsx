import { createFileRoute } from "@tanstack/react-router";
import { BioPage } from "@/components/bio-page";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <BioPage />;
}
