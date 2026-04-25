import { Layout } from "@/components/Layout";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  Pencil,
  Network,
  Save,
  X,
} from "lucide-react";
import { useState } from "react";

export default function Settings() {
  const { data: networks, refetch } = trpc.network.list.useQuery();
  const createNetwork = trpc.network.create.useMutation({ onSuccess: () => refetch() });
  const updateNetwork = trpc.network.update.useMutation({ onSuccess: () => refetch() });
  const deleteNetwork = trpc.network.delete.useMutation({ onSuccess: () => refetch() });

  const [newNetworkOpen, setNewNetworkOpen] = useState(false);
  const [newNetwork, setNewNetwork] = useState({
    name: "",
    cidr: "",
    gateway: "",
    vlan: "",
    description: "",
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    cidr: "",
    gateway: "",
    vlan: "",
    description: "",
  });

  const handleCreate = () => {
    createNetwork.mutate({
      name: newNetwork.name,
      cidr: newNetwork.cidr,
      gateway: newNetwork.gateway || undefined,
      vlan: newNetwork.vlan ? parseInt(newNetwork.vlan) : undefined,
      description: newNetwork.description || undefined,
    });
    setNewNetworkOpen(false);
    setNewNetwork({ name: "", cidr: "", gateway: "", vlan: "", description: "" });
  };

  const startEdit = (net: { id: number; name: string; cidr: string; gateway: string | null; vlan: number | null; description: string | null }) => {
    setEditingId(net.id);
    setEditForm({
      name: net.name,
      cidr: net.cidr,
      gateway: net.gateway ?? "",
      vlan: net.vlan?.toString() ?? "",
      description: net.description ?? "",
    });
  };

  const saveEdit = (id: number) => {
    updateNetwork.mutate({
      id,
      name: editForm.name,
      cidr: editForm.cidr,
      gateway: editForm.gateway || undefined,
      vlan: editForm.vlan ? parseInt(editForm.vlan) : undefined,
      description: editForm.description || undefined,
    });
    setEditingId(null);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Paramètres</h1>
          <p className="text-slate-400 text-sm mt-1">
            Gérez vos réseaux et plages de scan
          </p>
        </div>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Network className="w-5 h-5 text-emerald-400" />
              Réseaux configurés
            </CardTitle>
            <Dialog open={newNetworkOpen} onOpenChange={setNewNetworkOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-700 text-white">
                <DialogHeader>
                  <DialogTitle>Nouveau réseau</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="text-sm text-slate-400">Nom</label>
                    <Input
                      value={newNetwork.name}
                      onChange={(e) => setNewNetwork({ ...newNetwork, name: e.target.value })}
                      className="bg-slate-950 border-slate-700 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">CIDR (ex: 192.168.1.0/24)</label>
                    <Input
                      value={newNetwork.cidr}
                      onChange={(e) => setNewNetwork({ ...newNetwork, cidr: e.target.value })}
                      className="bg-slate-950 border-slate-700 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Passerelle</label>
                    <Input
                      value={newNetwork.gateway}
                      onChange={(e) => setNewNetwork({ ...newNetwork, gateway: e.target.value })}
                      className="bg-slate-950 border-slate-700 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">VLAN</label>
                    <Input
                      value={newNetwork.vlan}
                      onChange={(e) => setNewNetwork({ ...newNetwork, vlan: e.target.value })}
                      className="bg-slate-950 border-slate-700 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400">Description</label>
                    <Input
                      value={newNetwork.description}
                      onChange={(e) => setNewNetwork({ ...newNetwork, description: e.target.value })}
                      className="bg-slate-950 border-slate-700 text-slate-200"
                    />
                  </div>
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={handleCreate}>
                    Créer
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-left text-slate-500">
                    <th className="pb-3 font-medium">Nom</th>
                    <th className="pb-3 font-medium">CIDR</th>
                    <th className="pb-3 font-medium">Passerelle</th>
                    <th className="pb-3 font-medium">VLAN</th>
                    <th className="pb-3 font-medium">Description</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {networks && networks.length > 0 ? (
                    networks.map((net) => (
                      <tr key={net.id}>
                        <td className="py-3">
                          {editingId === net.id ? (
                            <Input
                              value={editForm.name}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              className="h-7 bg-slate-950 border-slate-700 text-slate-200 text-xs"
                            />
                          ) : (
                            <span className="text-slate-200 font-medium">{net.name}</span>
                          )}
                        </td>
                        <td className="py-3">
                          {editingId === net.id ? (
                            <Input
                              value={editForm.cidr}
                              onChange={(e) => setEditForm({ ...editForm, cidr: e.target.value })}
                              className="h-7 bg-slate-950 border-slate-700 text-slate-200 text-xs"
                            />
                          ) : (
                            <span className="text-slate-400 font-mono">{net.cidr}</span>
                          )}
                        </td>
                        <td className="py-3">
                          {editingId === net.id ? (
                            <Input
                              value={editForm.gateway}
                              onChange={(e) => setEditForm({ ...editForm, gateway: e.target.value })}
                              className="h-7 bg-slate-950 border-slate-700 text-slate-200 text-xs"
                            />
                          ) : (
                            <span className="text-slate-400 font-mono">{net.gateway || "-"}</span>
                          )}
                        </td>
                        <td className="py-3 text-slate-400">
                          {editingId === net.id ? (
                            <Input
                              value={editForm.vlan}
                              onChange={(e) => setEditForm({ ...editForm, vlan: e.target.value })}
                              className="h-7 w-20 bg-slate-950 border-slate-700 text-slate-200 text-xs"
                            />
                          ) : (
                            net.vlan ?? "-"
                          )}
                        </td>
                        <td className="py-3 text-slate-400 max-w-[200px] truncate">
                          {editingId === net.id ? (
                            <Input
                              value={editForm.description}
                              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                              className="h-7 bg-slate-950 border-slate-700 text-slate-200 text-xs"
                            />
                          ) : (
                            net.description || "-"
                          )}
                        </td>
                        <td className="py-3 text-right">
                          {editingId === net.id ? (
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="w-6 h-6 text-emerald-400"
                                onClick={() => saveEdit(net.id)}
                              >
                                <Save className="w-3 h-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="w-6 h-6 text-slate-400"
                                onClick={() => setEditingId(null)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="w-6 h-6 text-slate-400 hover:text-emerald-400"
                                onClick={() => startEdit(net)}
                              >
                                <Pencil className="w-3 h-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="w-6 h-6 text-slate-400 hover:text-red-400"
                                onClick={() => deleteNetwork.mutate({ id: net.id })}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        Aucun réseau configuré
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
