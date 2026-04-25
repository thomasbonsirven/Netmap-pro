import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router";

export default function NotFound() {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h1 className="text-6xl font-bold text-white mb-4">404</h1>
        <p className="text-slate-400 text-lg mb-6">Page non trouvée</p>
        <Link to="/">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            Retour au tableau de bord
          </Button>
        </Link>
      </div>
    </Layout>
  );
}
