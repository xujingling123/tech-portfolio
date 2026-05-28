import { PageHeader } from "@/components/PageHeader";
import { RembgTool } from "@/components/tools/RembgTool";
import { ToolsSubnav } from "@/components/tools/ToolsSubnav";

export const metadata = {
  title: "一键抠图",
};

export default function RembgToolPage() {
  return (
    <div className="site-container py-12 md:py-16">
      <PageHeader
        label="Rembg"
        title="一键抠图"
        description="基于 rembg 开源项目，上传图片即可去除背景，导出透明 PNG。"
      />
      <ToolsSubnav />
      <div className="glass-card mt-8 p-5 md:p-8">
        <RembgTool />
      </div>
    </div>
  );
}
