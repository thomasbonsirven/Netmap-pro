import { Layout } from "@/components/Layout";
import { trpc } from "@/providers/trpc";
import { useRef, useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";
import * as d3 from "d3";
import { Link } from "react-router";

type NodeDatum = {
  id: number;
  label: string;
  ip: string;
  type: string;
  status: string;
  vendor: string | null;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  vx?: number;
  vy?: number;
};

type LinkDatum = {
  source: number | NodeDatum;
  target: number | NodeDatum;
  type: string;
  bandwidth: string | null;
  status: string;
};

const typeIcons: Record<string, string> = {
  router: "🔷",
  switch: "📦",
  server: "🖥️",
  workstation: "💻",
  printer: "🖨️",
  firewall: "🧱",
  access_point: "📡",
  iot: "📟",
  phone: "📞",
  unknown: "❓",
};

const typeColors: Record<string, string> = {
  router: "#10b981",
  switch: "#3b82f6",
  server: "#8b5cf6",
  workstation: "#64748b",
  printer: "#f59e0b",
  firewall: "#ef4444",
  access_point: "#06b6d4",
  iot: "#ec4899",
  phone: "#84cc16",
  unknown: "#94a3b8",
};

const statusColors: Record<string, string> = {
  online: "#10b981",
  offline: "#ef4444",
  warning: "#f59e0b",
  scanning: "#3b82f6",
};

export default function NetworkMap() {
  const { data: graphData, refetch } = trpc.topology.getGraph.useQuery();
  const updatePosition = trpc.device.updatePosition.useMutation();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<NodeDatum | null>(null);
  const [zoom, setZoom] = useState(1);
  const simulationRef = useRef<d3.Simulation<NodeDatum, LinkDatum> | null>(null);

  const width = 1000;
  const height = 650;

  const initGraph = useCallback(() => {
    if (!svgRef.current || !graphData) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g").attr("class", "graph-container");

    // Zoom behavior
    const zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        setZoom(event.transform.k);
      });

    svg.call(zoomBehavior);

    const nodes: NodeDatum[] = graphData.nodes.map((n) => ({ ...n }));
    const links: LinkDatum[] = graphData.links.map((l) => ({ ...l }));

    const simulation = d3
      .forceSimulation<NodeDatum>(nodes)
      .force(
        "link",
        d3
          .forceLink<NodeDatum, LinkDatum>(links)
          .id((d) => d.id)
          .distance(120)
      )
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(45));

    simulationRef.current = simulation;

    // Links
    const link = g
      .append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", (d) =>
        d.status === "active" ? "#334155" : "#475569"
      )
      .attr("stroke-width", (d) => (d.type === "fiber" ? 3 : 1.5))
      .attr("stroke-dasharray", (d) =>
        d.status === "inactive" ? "5,5" : "none"
      );

    // Link labels
    const linkLabel = g
      .append("g")
      .attr("class", "link-labels")
      .selectAll("text")
      .data(links)
      .enter()
      .append("text")
      .attr("font-size", "10px")
      .attr("fill", "#64748b")
      .attr("text-anchor", "middle")
      .text((d) => d.bandwidth || "");

    // Nodes group
    const node = g
      .append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .attr("cursor", "pointer")
      .call(
        d3
          .drag<SVGGElement, NodeDatum>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
            updatePosition.mutate({
              id: d.id,
              x: Math.round(d.x ?? 0),
              y: Math.round(d.y ?? 0),
            });
          })
      )
      .on("click", (_event, d) => {
        setSelectedNode(d);
      });

    // Node circles
    node
      .append("circle")
      .attr("r", 28)
      .attr("fill", (d) => `${typeColors[d.type] || "#94a3b8"}20`)
      .attr("stroke", (d) => typeColors[d.type] || "#94a3b8")
      .attr("stroke-width", 2);

    // Status indicator ring
    node
      .append("circle")
      .attr("r", 32)
      .attr("fill", "none")
      .attr("stroke", (d) => statusColors[d.status] || "#64748b")
      .attr("stroke-width", 3)
      .attr("opacity", 0.6);

    // Icon text
    node
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "-2")
      .attr("font-size", "18px")
      .text((d) => typeIcons[d.type] || "❓");

    // Label
    node
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", 42)
      .attr("fill", "#e2e8f0")
      .attr("font-size", "12px")
      .attr("font-weight", "500")
      .text((d) => d.label);

    // IP
    node
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", 56)
      .attr("fill", "#64748b")
      .attr("font-size", "10px")
      .attr("font-family", "monospace")
      .text((d) => d.ip);

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (typeof d.source === "object" ? d.source.x ?? 0 : 0))
        .attr("y1", (d) => (typeof d.source === "object" ? d.source.y ?? 0 : 0))
        .attr("x2", (d) => (typeof d.target === "object" ? d.target.x ?? 0 : 0))
        .attr("y2", (d) => (typeof d.target === "object" ? d.target.y ?? 0 : 0));

      linkLabel
        .attr("x", (d) => {
          const sx = typeof d.source === "object" ? d.source.x ?? 0 : 0;
          const tx = typeof d.target === "object" ? d.target.x ?? 0 : 0;
          return (sx + tx) / 2;
        })
        .attr("y", (d) => {
          const sy = typeof d.source === "object" ? d.source.y ?? 0 : 0;
          const ty = typeof d.target === "object" ? d.target.y ?? 0 : 0;
          return (sy + ty) / 2;
        });

      node.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });
  }, [graphData, updatePosition]);

  useEffect(() => {
    initGraph();
  }, [initGraph]);

  const handleZoomIn = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(300).call(
      d3.zoom<SVGSVGElement, unknown>().transform as any,
      d3.zoomTransform(svgRef.current).scale(zoom * 1.2)
    );
  };

  const handleZoomOut = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(300).call(
      d3.zoom<SVGSVGElement, unknown>().transform as any,
      d3.zoomTransform(svgRef.current).scale(zoom * 0.8)
    );
  };

  const handleReset = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(300).call(
      d3.zoom<SVGSVGElement, unknown>().transform as any,
      d3.zoomIdentity
    );
    refetch();
  };

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Carte réseau</h1>
            <p className="text-slate-400 text-sm mt-1">
              Topologie interactive de votre infrastructure
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
              onClick={handleZoomIn}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
              onClick={handleZoomOut}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
              onClick={handleReset}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3">
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-0">
                <div ref={containerRef} className="w-full overflow-hidden rounded-lg">
                  <svg
                    ref={svgRef}
                    width={width}
                    height={height}
                    className="w-full bg-slate-950"
                    viewBox={`0 0 ${width} ${height}`}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            {/* Legend */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-sm">Légende</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(typeColors).map(([type, color]) => (
                  <div key={type} className="flex items-center gap-2 text-xs text-slate-300">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span>
                      {type === "router" && "Routeur"}
                      {type === "switch" && "Switch"}
                      {type === "server" && "Serveur"}
                      {type === "workstation" && "Poste"}
                      {type === "printer" && "Imprimante"}
                      {type === "firewall" && "Firewall"}
                      {type === "access_point" && "Point d'accès"}
                      {type === "iot" && "IoT"}
                      {type === "phone" && "Téléphone"}
                      {type === "unknown" && "Inconnu"}
                    </span>
                  </div>
                ))}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  {Object.entries(statusColors).map(([status, color]) => (
                    <div key={status} className="flex items-center gap-2 text-xs text-slate-300">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span>
                        {status === "online" && "En ligne"}
                        {status === "offline" && "Hors ligne"}
                        {status === "warning" && "Avertissement"}
                        {status === "scanning" && "Scan en cours"}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Selected node info */}
            {selectedNode && (
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-sm">
                    {selectedNode.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">IP</span>
                    <span className="text-slate-300 font-mono">{selectedNode.ip}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Type</span>
                    <span className="text-slate-300">{selectedNode.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Statut</span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        selectedNode.status === "online"
                          ? "border-emerald-500/30 text-emerald-400"
                          : selectedNode.status === "offline"
                          ? "border-red-500/30 text-red-400"
                          : "border-amber-500/30 text-amber-400"
                      }`}
                    >
                      {selectedNode.status}
                    </Badge>
                  </div>
                  {selectedNode.vendor && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Fabricant</span>
                      <span className="text-slate-300">{selectedNode.vendor}</span>
                    </div>
                  )}
                  <Link to={`/devices/${selectedNode.id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-3 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                    >
                      Voir détails
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
