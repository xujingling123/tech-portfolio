import { PageHeader } from "@/components/PageHeader";
import { DeerFlowAssistantTool } from "@/components/tools/DeerFlowAssistantTool";
import { ToolsSubnav } from "@/components/tools/ToolsSubnav";

export const metadata = {
  title: "AI 助手（DeerFlow）",
};

export default function DeerFlowAssistantPage() {
  return (
    <div className="site-container py-12 md:py-16">
      <PageHeader
        label="DeerFlow"
        title="AI 助手"
        description="通过本站 API 代理连接本地 DeerFlow，进行研究与编码类长任务对话；完整能力请使用 DeerFlow 原生界面。"
      />
      <ToolsSubnav />
      <div className="glass-card mt-8 p-5 md:p-8">
        <DeerFlowAssistantTool />
      </div>
    </div>
  );
}
