import { Layout } from "@/components/Layout";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ScanLine,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
} from "lucide-react";
import { useState } from "react";

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="w-4 h-4 text-slate-400" />,
  running: <Activity className="w-4 h-4 text-blue-400 animate-pulse" />,
  completed: <CheckCircle className="w-4 h-4 text-emerald-400" />,
  failed: <XCircle className="w-4 h-4 text-red-400" />,
};

const statusLabels: Record<string, string> = {
  pending: "En attente",
  running: "En cours",
  completed: "Terminé",
  failed: "Échoué",
};

export default function Scan() {
  const { data: scanJobs, refetch } = trpc.scan.list.useQuery();
  const { data: networks } = trpc.network.list.useQuery();
  const createScan = trpc.scan.create.useMutation({ onSuccess: () => refetch() });
  const simulateProgress = trpc.scan.simulateProgress.useMutation({ onSuccess: () => refetch() });
  const completeScan = trpc.scan.complete.useMutation({ onSuccess: () => refetch() });

  const [scanName, setScanName] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState<string>("");
  const [scanType, setScanType] = useState<"quick" | "full" | "custom">("quick");
  const [runningScanId, setRunningScanId] = useState<number | null>(null);
  const [scanProgress, setScanProgress] = useState(0);

  const handleCreateScan = () => {
    if (!scanName) return;
    createScan.mutate(
      {
        name: scanName,
        networkId: selectedNetwork ? parseInt(selectedNetwork) : undefined,
        scanType,
      },
      {
        onSuccess: (data) => {
          setScanName("");
          setSelectedNetwork("");
          if (data.id) {
            handleRunScan(data.id);
          }
        },
      }
    );
  };

  const handleRunScan = (scanId: number) => {
    simulateProgress.mutate({ id: scanId });
    setRunningScanId(scanId);
    setScanProgress(0);

    // Simulate progress animation
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(() => {
          completeScan.mutate(
            { id: scanId, foundDevices: Math.floor(Math.random() * 10) + 1 },
            {
              onSuccess: () => {
                setRunningScanId(null);
                setScanProgress(0);
              },
            }
          );
        }, 800);
      }
      setScanProgress(progress);
    }, 600);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Scan réseau</h1>
          <p className="text-slate-400 text-sm mt-1">
            Découvrez et cartographiez votre infrastructure
          </p>
        </div>

        {/* Create scan */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-base">Nouveau scan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs text-slate-500 mb-1 block">Nom du scan</label>
                <Input
                  placeholder="ex: Scan hebdomadaire"
                  value={scanName}
                  onChange={(e) => setScanName(e.target.value)}
                  className="bg-slate-950 border-slate-700 text-slate-200"
                />
              </div>
              <div className="w-[200px]">
                <label className="text-xs text-slate-500 mb-1 block">Réseau</label>
                <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
                  <SelectTrigger className="bg-slate-950 border-slate-700 text-slate-200">
                    <SelectValue placeholder="Sélectionner un réseau" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    {networks?.map((net) => (
                      <SelectItem key={net.id} value={String(net.id)}>
                        {net.name} ({net.cidr})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-[160px]">
                <label className="text-xs text-slate-500 mb-1 block">Type</label>
                <Select value={scanType} onValueChange={(v) => setScanType(v as "quick" | "full" | "custom")}>
                  <SelectTrigger className="bg-slate-950 border-slate-700 text-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="quick">Rapide</SelectItem>
                    <SelectItem value="full">Complet</SelectItem>
                    <SelectItem value="custom">Personnalisé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={handleCreateScan}
                disabled={!scanName || runningScanId !== null}
              >
                <ScanLine className="w-4 h-4 mr-2" />
                Lancer
              </Button>
            </div>

            {runningScanId !== null && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">Scan en cours...</span>
                  <span className="text-emerald-400 font-medium">
                    {Math.round(scanProgress)}%
                  </span>
                </div>
                <Progress value={scanProgress} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scan history */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white text-base">Historique des scans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-left text-slate-500">
                    <th className="pb-3 font-medium">Statut</th>
                    <th className="pb-3 font-medium">Nom</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Hôtes</th>
                    <th className="pb-3 font-medium">Trouvés</th>
                    <th className="pb-3 font-medium">Progression</th>
                    <th className="pb-3 font-medium">Début</th>
                    <th className="pb-3 font-medium">Fin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {scanJobs && scanJobs.length > 0 ? (
                    scanJobs.map((job) => (
                      <tr key={job.id}>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            {statusIcons[job.status]}
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                job.status === "completed"
                                  ? "border-emerald-500/30 text-emerald-400"
                                  : job.status === "running"
                                  ? "border-blue-500/30 text-blue-400"
                                  : job.status === "failed"
                                  ? "border-red-500/30 text-red-400"
                                  : "border-slate-500/30 text-slate-400"
                              }`}
                            >
                              {statusLabels[job.status]}
                            </Badge>
                          </div>
                        </td>
                        <td className="py-3 text-slate-300">{job.name}</td>
                        <td className="py-3 text-slate-400">{job.scanType}</td>
                        <td className="py-3 text-slate-400">
                          {job.scannedHosts ?? 0}/{job.totalHosts ?? 0}
                        </td>
                        <td className="py-3 text-emerald-400 font-medium">
                          {job.foundDevices}
                        </td>
                        <td className="py-3">
                          <div className="w-24">
                            <Progress
                              value={
                                job.totalHosts && job.scannedHosts != null
                                  ? (job.scannedHosts / job.totalHosts) * 100
                                  : 0
                              }
                              className="h-1.5"
                            />
                          </div>
                        </td>
                        <td className="py-3 text-slate-500">
                          {job.startTime
                            ? new Date(job.startTime).toLocaleString("fr-FR")
                            : "-"}
                        </td>
                        <td className="py-3 text-slate-500">
                          {job.endTime
                            ? new Date(job.endTime).toLocaleString("fr-FR")
                            : "-"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">
                        Aucun scan effectué
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
