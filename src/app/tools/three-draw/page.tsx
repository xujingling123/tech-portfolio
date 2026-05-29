import { PageHeader } from "@/components/PageHeader";
import { ThreeDrawTool } from "@/components/tools/ThreeDrawTool";
import { ToolsSubnav } from "@/components/tools/ToolsSubnav";

export const metadata = {
  title: "Three.js 画板",
};

export default function ThreeDrawToolPage() {
  return (
    <div className="site-container py-12 md:py-16">
      <PageHeader
        label="Three.js"
        title="3D 画板"
        description="在 Three.js 三维画板上自由绘制，支持旋转视角、撤销与导出 PNG 图片。"
      />
      <ToolsSubnav />
      <div className="glass-card mt-8 p-5 md:p-8">
        <ThreeDrawTool />
      </div>
    </div>
  );
}
