import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

function getOAuthUrl() {
  const kimiAuthUrl = import.meta.env.VITE_KIMI_AUTH_URL;
  const appID = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${kimiAuthUrl}/api/oauth/authorize`);
  url.searchParams.set("client_id", appID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "profile");
  url.searchParams.set("state", state);

  return url.toString();
}

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <Card className="w-full max-w-sm bg-slate-900 border-slate-800">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 text-emerald-400 mb-2">
            <Shield className="w-8 h-8" />
          </div>
          <CardTitle className="text-white text-xl">NetMap Pro</CardTitle>
          <p className="text-slate-400 text-sm mt-1">
            Détection et cartographie réseau
          </p>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            size="lg"
            onClick={() => {
              window.location.href = getOAuthUrl();
            }}
          >
            Se connecter avec Kimi
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
