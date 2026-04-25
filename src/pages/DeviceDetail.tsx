import { Layout } from "@/components/Layout";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  ArrowLeft,
  Pencil,
  Plus,
  Trash2,
  Save,
  X,
} from "lucide-react";
import { Link, useParams } from "react-router";
import { useState } from "react";

const deviceTypeIcons: Record<string, React.ReactNode> = {
  router: <Router className="w-5 h-5" />,
  switch: <Activity className="w-5 h-5" />,
  server: <Server className="w-5 h-5" />,
  workstation: <Monitor className="w-5 h-5" />,
  printer: <Printer className="w-5 h-5" />,
  firewall: <Shield className="w-5 h-5" />,
  access_point: <Wifi className="w-5 h-5" />,
};

const deviceTypeLabels: Record<string, string> = {
  router: "Routeur",
  switch: "Switch",
  server: "Serveur",
  workstation: "Poste de travail",
  printer: "Imprimante",
  firewall: "Firewall",
  access_point: "Point d'accès",
  iot: "IoT",
  phone: "Téléphone",
  unknown: "Inconnu",
};

const statusLabels: Record<string, string> = {
  online: "En ligne",
  offline: "Hors ligne",
  warning: "Avertissement",
  scanning: "Scan en cours",
};

export default function DeviceDetail() {
  const { id } = useParams<{ id: string }>();
  const deviceId = parseInt(id ?? "0");

  const { data: device, refetch: refetchDevice } = trpc.device.get.useQuery({
    id: deviceId,
  });
  const { data: configs, refetch: refetchConfigs } = trpc.config.list.useQuery({
    deviceId,
  });
  const updateDevice = trpc.device.update.useMutation({
    onSuccess: () => refetchDevice(),
  });
  const createConfig = trpc.config.create.useMutation({
    onSuccess: () => refetchConfigs(),
  });
  const updateConfig = trpc.config.update.useMutation({
    onSuccess: () => refetchConfigs(),
  });
  const deleteConfig = trpc.config.delete.useMutation({
    onSuccess: () => refetchConfigs(),
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    hostname: "",
    description: "",
    vendor: "",
    os: "",
    osVersion: "",
  });

  const [newConfigOpen, setNewConfigOpen] = useState(false);
  const [newConfig, setNewConfig] = useState({
    configKey: "",
    configValue: "",
    configType: "string" as "string" | "number" | "boolean" | "json" | "password",
    category: "",
    description: "",
    isSensitive: false,
  });

  const [editingConfigId, setEditingConfigId] = useState<number | null>(null);
  const [editConfigValue, setEditConfigValue] = useState("");

  const startEditing = () => {
    if (device) {
      setEditForm({
        hostname: device.hostname ?? "",
        description: device.description ?? "",
        vendor: device.vendor ?? "",
        os: device.os ?? "",
        osVersion: device.osVersion ?? "",
      });
      setIsEditing(true);
    }
  };

  const saveEdit = () => {
    updateDevice.mutate({ id: deviceId, ...editForm });
    setIsEditing(false);
  };

  const handleCreateConfig = () => {
    createConfig.mutate({
      deviceId,
      ...newConfig,
    });
    setNewConfigOpen(false);
    setNewConfig({
      configKey: "",
      configValue: "",
      configType: "string",
      category: "",
      description: "",
      isSensitive: false,
    });
  };

  const startEditConfig = (config: { id: number; configValue: string | null }) => {
    setEditingConfigId(config.id);
    setEditConfigValue(config.configValue ?? "");
  };

  const saveEditConfig = (configId: number) => {
    updateConfig.mutate({ id: configId, configValue: editConfigValue });
    setEditingConfigId(null);
  };

  if (!device) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-500">Chargement...</p>
        </div>
      </Layout>
    );
  }

  const groupedConfigs = configs?.reduce((acc, config) => {
    const cat = config.category || "Général";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(config);
    return acc;
  }, {} as Record<string, typeof configs>) ?? {};

  return (
    <Layout>
      <div className="space-y-6">
        {/* Back + Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/devices">
              <Button
                variant="outline"
                size="icon"
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  device.status === "online"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : device.status === "offline"
                    ? "bg-red-500/10 text-red-400"
                    : "bg-amber-500/10 text-amber-400"
                }`}
              >
                {deviceTypeIcons[device.deviceType] || <Monitor className="w-6 h-6" />}
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  {device.hostname || device.ipAddress}
                </h1>
                <div className="flex items-center gap-2 mt-1">
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
                    {statusLabels[device.status]}
                  </Badge>
                  <span className="text-xs text-slate-500">
                    {deviceTypeLabels[device.deviceType]}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                  onClick={() => setIsEditing(false)}
                >
                  <X className="w-4 h-4 mr-2" />
                  Annuler
                </Button>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={saveEdit}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Enregistrer
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
                onClick={startEditing}
              >
                <Pencil className="w-4 h-4 mr-2" />
                Modifier
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Device info */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white text-base">
                  Informations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoField label="Adresse IP" value={device.ipAddress} />
                  <InfoField label="Adresse MAC" value={device.macAddress} />
                  <InfoField
                    label="Nom d'hôte"
                    value={
                      isEditing ? (
                        <Input
                          value={editForm.hostname}
                          onChange={(e) =>
                            setEditForm({ ...editForm, hostname: e.target.value })
                          }
                          className="bg-slate-950 border-slate-700 text-slate-200"
                        />
                      ) : (
                        device.hostname
                      )
                    }
                  />
                  <InfoField
                    label="Fabricant"
                    value={
                      isEditing ? (
                        <Input
                          value={editForm.vendor}
                          onChange={(e) =>
                            setEditForm({ ...editForm, vendor: e.target.value })
                          }
                          className="bg-slate-950 border-slate-700 text-slate-200"
                        />
                      ) : (
                        device.vendor
                      )
                    }
                  />
                  <InfoField
                    label="Système d'exploitation"
                    value={
                      isEditing ? (
                        <Input
                          value={editForm.os}
                          onChange={(e) =>
                            setEditForm({ ...editForm, os: e.target.value })
                          }
                          className="bg-slate-950 border-slate-700 text-slate-200"
                        />
                      ) : (
                        device.os
                      )
                    }
                  />
                  <InfoField
                    label="Version OS"
                    value={
                      isEditing ? (
                        <Input
                          value={editForm.osVersion}
                          onChange={(e) =>
                            setEditForm({ ...editForm, osVersion: e.target.value })
                          }
                          className="bg-slate-950 border-slate-700 text-slate-200"
                        />
                      ) : (
                        device.osVersion
                      )
                    }
                  />
                  <InfoField
                    label="Description"
                    value={
                      isEditing ? (
                        <Input
                          value={editForm.description}
                          onChange={(e) =>
                            setEditForm({ ...editForm, description: e.target.value })
                          }
                          className="bg-slate-950 border-slate-700 text-slate-200"
                        />
                      ) : (
                        device.description
                      )
                    }
                  />
                  <InfoField
                    label="Temps de réponse"
                    value={
                      device.responseTime
                        ? `${device.responseTime} ms`
                        : "N/A"
                    }
                  />
                  <InfoField
                    label="Dernière vue"
                    value={
                      device.lastSeen
                        ? new Date(device.lastSeen).toLocaleString("fr-FR")
                        : "Jamais"
                    }
                  />
                  <InfoField
                    label="Première découverte"
                    value={
                      device.firstSeen
                        ? new Date(device.firstSeen).toLocaleString("fr-FR")
                        : "N/A"
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Ports */}
            {device.openPorts && (device.openPorts as number[]).length > 0 && (
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white text-base">Ports ouverts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {(device.openPorts as number[]).map((port) => (
                      <Badge
                        key={port}
                        variant="outline"
                        className="border-slate-700 text-slate-300"
                      >
                        {port}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Configurations */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Configurations</h2>
              <Dialog open={newConfigOpen} onOpenChange={setNewConfigOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-slate-700 text-white">
                  <DialogHeader>
                    <DialogTitle>Nouvelle configuration</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="text-sm text-slate-400">Clé</label>
                      <Input
                        value={newConfig.configKey}
                        onChange={(e) =>
                          setNewConfig({ ...newConfig, configKey: e.target.value })
                        }
                        className="bg-slate-950 border-slate-700 text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-400">Valeur</label>
                      <Input
                        value={newConfig.configValue}
                        onChange={(e) =>
                          setNewConfig({ ...newConfig, configValue: e.target.value })
                        }
                        className="bg-slate-950 border-slate-700 text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-400">Type</label>
                      <Select
                        value={newConfig.configType}
                        onValueChange={(v) =>
                          setNewConfig({ ...newConfig, configType: v as typeof newConfig.configType })
                        }
                      >
                        <SelectTrigger className="bg-slate-950 border-slate-700 text-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-700">
                          <SelectItem value="string">Texte</SelectItem>
                          <SelectItem value="number">Nombre</SelectItem>
                          <SelectItem value="boolean">Booléen</SelectItem>
                          <SelectItem value="json">JSON</SelectItem>
                          <SelectItem value="password">Mot de passe</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm text-slate-400">Catégorie</label>
                      <Input
                        value={newConfig.category}
                        onChange={(e) =>
                          setNewConfig({ ...newConfig, category: e.target.value })
                        }
                        className="bg-slate-950 border-slate-700 text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-400">Description</label>
                      <Input
                        value={newConfig.description}
                        onChange={(e) =>
                          setNewConfig({ ...newConfig, description: e.target.value })
                        }
                        className="bg-slate-950 border-slate-700 text-slate-200"
                      />
                    </div>
                    <Button
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                      onClick={handleCreateConfig}
                    >
                      Créer
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {Object.entries(groupedConfigs).length > 0 ? (
              Object.entries(groupedConfigs).map(([category, items]) => (
                <Card key={category} className="bg-slate-900 border-slate-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm">{category}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {items?.map((config) => (
                      <div
                        key={config.id}
                        className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-300 truncate">
                            {config.configKey}
                          </p>
                          {config.description && (
                            <p className="text-xs text-slate-500">
                              {config.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          {editingConfigId === config.id ? (
                            <>
                              <Input
                                value={editConfigValue}
                                onChange={(e) => setEditConfigValue(e.target.value)}
                                className="w-32 h-7 bg-slate-950 border-slate-700 text-slate-200 text-xs"
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                className="w-6 h-6 text-emerald-400"
                                onClick={() => saveEditConfig(config.id)}
                              >
                                <Save className="w-3 h-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="w-6 h-6 text-slate-400"
                                onClick={() => setEditingConfigId(null)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <span className="text-xs text-slate-400 font-mono truncate max-w-[100px]">
                                {config.isSensitive
                                  ? "••••••"
                                  : config.configValue ?? "-"}
                              </span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="w-6 h-6 text-slate-400 hover:text-emerald-400"
                                onClick={() => startEditConfig(config)}
                              >
                                <Pencil className="w-3 h-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="w-6 h-6 text-slate-400 hover:text-red-400"
                                onClick={() => deleteConfig.mutate({ id: config.id })}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-slate-500">
                    Aucune configuration enregistrée
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

function InfoField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <div className="text-sm text-slate-200">
        {value ?? <span className="text-slate-600">-</span>}
      </div>
    </div>
  );
}
