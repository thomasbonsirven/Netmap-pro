import { Layout } from "@/components/Layout";
import { trpc } from "@/providers/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Router,
  Server,
  Monitor,
  Printer,
  Shield,
  Wifi,
  Activity,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Link } from "react-router";
import { useState } from "react";

const deviceTypeIcons: Record<string, React.ReactNode> = {
  router: <Router className="w-4 h-4" />,
  switch: <Activity className="w-4 h-4" />,
  server: <Server className="w-4 h-4" />,
  workstation: <Monitor className="w-4 h-4" />,
  printer: <Printer className="w-4 h-4" />,
  firewall: <Shield className="w-4 h-4" />,
  access_point: <Wifi className="w-4 h-4" />,
};

const deviceTypeLabels: Record<string, string> = {
  router: "Routeur",
  switch: "Switch",
  server: "Serveur",
  workstation: "Poste",
  printer: "Imprimante",
  firewall: "Firewall",
  access_point: "Point d'accès",
  iot: "IoT",
  phone: "Téléphone",
  unknown: "Inconnu",
};

const statusColors: Record<string, string> = {
  online: "bg-emerald-500",
  offline: "bg-red-500",
  warning: "bg-amber-500",
  scanning: "bg-blue-500",
};

export default function Devices() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [page, setPage] = useState(0);
  const limit = 10;

  const { data, refetch } = trpc.device.list.useQuery({
    search: search || undefined,
    type: type || undefined,
    status: status || undefined,
    limit,
    offset: page * limit,
  });

  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);
  const devices = data?.items ?? [];

  const handleSearch = () => {
    setPage(0);
    refetch();
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Appareils</h1>
            <p className="text-slate-400 text-sm mt-1">
              {total} appareil{total > 1 ? "s" : ""} découvert{total > 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-500" />
                <Input
                  placeholder="Rechercher par nom, IP, MAC..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="bg-slate-950 border-slate-700 text-slate-200 placeholder:text-slate-600"
                />
              </div>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="w-[160px] bg-slate-950 border-slate-700 text-slate-200">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="">Tous</SelectItem>
                  {Object.entries(deviceTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[160px] bg-slate-950 border-slate-700 text-slate-200">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="">Tous</SelectItem>
                  <SelectItem value="online">En ligne</SelectItem>
                  <SelectItem value="offline">Hors ligne</SelectItem>
                  <SelectItem value="warning">Avertissement</SelectItem>
                  <SelectItem value="scanning">Scan en cours</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
                onClick={handleSearch}
              >
                Filtrer
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Devices grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map((device) => (
            <Link key={device.id} to={`/devices/${device.id}`}>
              <Card className="bg-slate-900 border-slate-800 hover:border-emerald-500/30 transition-colors group">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          device.status === "online"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : device.status === "offline"
                            ? "bg-red-500/10 text-red-400"
                            : "bg-amber-500/10 text-amber-400"
                        }`}
                      >
                        {deviceTypeIcons[device.deviceType] || (
                          <Monitor className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-slate-200 group-hover:text-emerald-400 transition-colors">
                          {device.hostname || device.ipAddress}
                        </h3>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          {device.ipAddress}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${statusColors[device.status]}`}
                    />
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-slate-400">
                      <span>{deviceTypeLabels[device.deviceType]}</span>
                      {device.vendor && (
                        <>
                          <span className="text-slate-700">·</span>
                          <span>{device.vendor}</span>
                        </>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        device.status === "online"
                          ? "border-emerald-500/30 text-emerald-400"
                          : device.status === "offline"
                          ? "border-red-500/30 text-red-400"
                          : "border-amber-500/30 text-amber-400"
                      }`}
                    >
                      {device.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {devices.length === 0 && (
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-8 text-center">
              <p className="text-slate-500">Aucun appareil trouvé</p>
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Page {page + 1} sur {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
