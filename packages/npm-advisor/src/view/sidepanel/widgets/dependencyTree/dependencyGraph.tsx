/**
 * External dependencies.
 */
import { useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";

/**
 * Internal dependencies.
 */
import type { DependencyTree as DependencyTreeType } from "../../../../utils";

interface DependencyGraphProps {
  data: DependencyTreeType;
}

type TreeNode = d3.HierarchyPointNode<DependencyTreeType> & {
  x0?: number;
  y0?: number;
  _children?: TreeNode[];
  id?: string;
};

const DependencyGraph = ({ data }: DependencyGraphProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const drawTree = useCallback(async () => {
    const marginTop = 30;
    const marginBottom = 30;
    const marginLeft = 100;
    const marginRight = 150;

    const root = d3.hierarchy<DependencyTreeType>(
      data,
      (d: DependencyTreeType) =>
        d.dependencies ? Object.values(d.dependencies) : null,
    ) as TreeNode;

    const dx = 45;
    const dy = 160;
    const tree = d3.tree<DependencyTreeType>().nodeSize([dx, dy]);

    const totalWidth = (root.height || 1) * dy + marginLeft + marginRight;

    const diagonal = d3
      .linkHorizontal<
        d3.HierarchyPointLink<DependencyTreeType>,
        d3.HierarchyPointNode<DependencyTreeType>
      >()
      .x((d) => d.y)
      .y((d) => d.x);

    const svg = d3
      .create("svg")
      .attr("width", totalWidth)
      .attr("style", "height: auto; font: 12px sans-serif; user-select: none;");

    const gLink = svg
      .append("g")
      .attr("fill", "none")
      .attr("stroke", "#92DCE5")
      .attr("stroke-width", 1.5);

    const gNode = svg
      .append("g")
      .attr("cursor", "pointer")
      .attr("pointer-events", "all");

    let i = 0;

    const update = (source: TreeNode) => {
      const duration = 250;
      const nodes = root.descendants().reverse();
      const links = root.links();

      tree(root);

      let left = root;
      let right = root;
      root.eachBefore((node) => {
        if (node.x < left.x) left = node;
        if (node.x > right.x) right = node;
      });

      const chartHeight = right.x - left.x + marginTop + marginBottom;

      const transition = svg
        .transition()
        .duration(duration)
        .attr("height", chartHeight)
        .attr(
          "viewBox",
          `${-marginLeft} ${left.x - marginTop} ${totalWidth} ${chartHeight}`,
        );

      const node = gNode
        .selectAll<SVGGElement, TreeNode>("g")
        .data(nodes as TreeNode[], (d) => (d.id ? d.id : (d.id = String(++i))));

      const nodeEnter = node
        .enter()
        .append("g")
        .attr(
          "transform",
          () => `translate(${source.y0 || source.y},${source.x0 || source.x})`,
        )
        .attr("fill-opacity", 0)
        .attr("stroke-opacity", 0)
        .attr("cursor", (d) =>
          d !== root && d._children ? "pointer" : "default",
        )
        .on("click", (_event, d) => {
          if (d === root || !d._children) return;
          d.children = d.children ? undefined : d._children;
          update(d);
        });

      nodeEnter
        .append("circle")
        .attr("r", 4)
        .attr("fill", (d) => (d._children ? "#92DCE5" : "#fff"))
        .attr("stroke", "#197BBD")
        .attr("stroke-width", 1.5);

      nodeEnter
        .append("text")
        .attr("dy", "0.31em")
        .attr("x", (d) => (d._children ? -10 : 10))
        .attr("text-anchor", (d) => (d._children ? "end" : "start"))
        .text((d) => d.data.name)
        .attr("class", "dark:fill-slate-300 fill-slate-700")
        .clone(true)
        .lower()
        .attr("stroke-linejoin", "round")
        .attr("stroke-width", 3)
        .attr("stroke", "white");

      node
        .merge(nodeEnter)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .transition(transition as any)
        .attr("transform", (d) => `translate(${d.y},${d.x})`)
        .attr("fill-opacity", 1)
        .attr("stroke-opacity", 1);

      node
        .exit()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .transition(transition as any)
        .remove()
        .attr("transform", () => `translate(${source.y},${source.x})`)
        .attr("fill-opacity", 0)
        .attr("stroke-opacity", 0);

      const link = gLink
        .selectAll<
          SVGPathElement,
          d3.HierarchyPointLink<DependencyTreeType>
        >("path")
        .data(links, (d) => String((d.target as TreeNode).id));

      const linkEnter = link
        .enter()
        .append("path")
        .attr("d", () => {
          const o = { x: source.x0 || source.x, y: source.y0 || source.y };
          return diagonal({
            source: o,
            target: o,
          } as unknown as d3.HierarchyPointLink<DependencyTreeType>);
        });

      link
        .merge(linkEnter)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .transition(transition as any)
        .attr("d", diagonal as unknown as string);

      link
        .exit()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .transition(transition as any)
        .remove()
        .attr("d", () => {
          const o = { x: source.x, y: source.y };
          return diagonal({
            source: o,
            target: o,
          } as unknown as d3.HierarchyPointLink<DependencyTreeType>);
        });

      root.eachBefore((d) => {
        const node = d as TreeNode;
        node.x0 = node.x;
        node.y0 = node.y;
      });
    };

    root.x0 = dx / 2;
    root.y0 = 0;
    root.descendants().forEach((d, index) => {
      const node = d as TreeNode;
      node.id = String(index);
      node._children = node.children as TreeNode[] | undefined;
      if (node.depth && node.depth >= 1) {
        node.children = undefined;
      }
    });

    update(root);
    containerRef.current?.appendChild(svg.node() as Node);
  }, [data]);

  useEffect(() => {
    if (!containerRef.current || !data) return;

    containerRef.current.innerHTML = "";

    drawTree();
  }, [data]);

  return <div ref={containerRef} className="overflow-auto py-2" />;
};

export default DependencyGraph;
