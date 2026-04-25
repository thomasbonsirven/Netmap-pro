import { Layout } from "@/components/Layout";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Activity,
  Wifi,
  WifiOff,
  AlertTriangle,
  ScanLine,
  Router,
  Server,
  Monitor,
  Printer,
  Shield,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router";

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
  router: "Routeurs",
  switch: "Switchs",
  server: "Serveurs",
  workstation: "Postes",
  printer: "Imprimantes",
  firewall: "Firewalls",
  access_point: "Points d'accès",
  iot: "IoT",
  phone: "Téléphones",
  unknown: "Inconnu",
};

const statusColors: Record<string, string> = {
  online: "bg-emerald-500",
  offline: "bg-red-500",
  warning: "bg-amber-500",
  scanning: "bg-blue-500",
};

const statusLabels: Record<string, string> = {
  online: "En ligne",
  offline: "Hors ligne",
  warning: "Avertissement",
  scanning: "Scan en cours",
};

export default function Home() {
  const { data: stats } = trpc.device.stats.useQuery();
  const { data: scanJobs } = trpc.scan.list.useQuery();
  const { data: devicesData } = trpc.device.list.useQuery({ limit: 5, offset: 0 });
  const { data: networks } = trpc.network.list.useQuery();

  const recentScans = scanJobs?.slice(0, 3) ?? [];
  const recentDevices = devicesData?.items ?? [];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Tableau de bord</h1>
            <p className="text-slate-400 text-sm mt-1">
              Vue d'ensemble de votre infrastructure réseau
            </p>
          </div>
          <Link to="/scan">
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <ScanLine className="w-4 h-4 mr-2" />
              Nouveau scan
            </Button>
          </Link>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Appareils total</p>
                  <p className="text-2xl font-bold text-white mt-1">{stats?.total ?? 0}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">En ligne</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">{stats?.online ?? 0}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Wifi className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Hors ligne</p>
                  <p className="text-2xl font-bold text-red-400 mt-1">{stats?.offline ?? 0}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <WifiOff className="w-5 h-5 text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Avertissements</p>
                  <p className="text-2xl font-bold text-amber-400 mt-1">{stats?.warning ?? 0}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Device types */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-base">Par type d'appareil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats?.byType && Object.entries(stats.byType).length > 0 ? (
                Object.entries(stats.byType)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-300">
                        <span className="text-slate-500">
                          {deviceTypeIcons[type] || <Monitor className="w-4 h-4" />}
                        </span>
                        <span className="text-sm">{deviceTypeLabels[type] || type}</span>
                      </div>
                      <span className="text-sm font-medium text-white">{count}</span>
                    </div>
                  ))
              ) : (
                <p className="text-slate-500 text-sm">Aucune donnée</p>
              )}
            </CardContent>
          </Card>

          {/* Recent scans */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white text-base">Scans récents</CardTitle>
              <Link to="/scan" className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                Voir tout <ArrowRight className="w-3 h-3" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentScans.length > 0 ? (
                recentScans.map((scan) => (
                  <div key={scan.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">{scan.name}</span>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          scan.status === "completed"
                            ? "border-emerald-500/30 text-emerald-400"
                            : scan.status === "running"
                            ? "border-blue-500/30 text-blue-400"
                            : "border-slate-500/30 text-slate-400"
                        }`}
                      >
                        {scan.status}
                      </Badge>
                    </div>
                    {scan.status === "running" && (
                      <Progress
                        value={scan.totalHosts && scan.scannedHosts != null ? (scan.scannedHosts / scan.totalHosts) * 100 : 0}
                        className="h-1.5"
                      />
                    )}
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>
                        {scan.scannedHosts ?? 0}/{scan.totalHosts ?? 0} hôtes
                      </span>
                      <span>{scan.foundDevices} trouvés</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-sm">Aucun scan récent</p>
              )}
            </CardContent>
          </Card>

          {/* Networks */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white text-base">Réseaux configurés</CardTitle>
              <Link to="/settings" className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                Gérer <ArrowRight className="w-3 h-3" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {networks && networks.length > 0 ? (
                networks.map((net) => (
                  <div key={net.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-300">{net.name}</p>
                      <p className="text-xs text-slate-500">
                        {net.cidr} · VLAN {net.vlan ?? "N/A"}
                      </p>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${net.isActive ? "bg-emerald-500" : "bg-slate-600"}`} />
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-sm">Aucun réseau configuré</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent devices */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white text-base">Appareils récents</CardTitle>
            <Link to="/devices" className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
              Voir tout <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-left text-slate-500">
                    <th className="pb-3 font-medium">Statut</th>
                    <th className="pb-3 font-medium">Nom</th>
                    <th className="pb-3 font-medium">Adresse IP</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Fabricant</th>
                    <th className="pb-3 font-medium">Dernière vue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {recentDevices.length > 0 ? (
                    recentDevices.map((device) => (
                      <tr key={device.id} className="group">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-2.5 h-2.5 rounded-full ${statusColors[device.status]}`} />
                            <span className="text-slate-400">{statusLabels[device.status]}</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <Link
                            to={`/devices/${device.id}`}
                            className="text-slate-200 hover:text-emerald-400 font-medium"
                          >
                            {device.hostname || device.ipAddress}
                          </Link>
                        </td>
                        <td className="py-3 text-slate-400 font-mono">{device.ipAddress}</td>
                        <td className="py-3 text-slate-400">
                          {deviceTypeLabels[device.deviceType] || device.deviceType}
                        </td>
                        <td className="py-3 text-slate-400">{device.vendor || "-"}</td>
                        <td className="py-3 text-slate-500">
                          {device.lastSeen ? new Date(device.lastSeen).toLocaleString("fr-FR") : "Jamais"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        Aucun appareil découvert
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
