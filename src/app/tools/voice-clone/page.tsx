import { PageHeader } from "@/components/PageHeader";
import { ToolsSubnav } from "@/components/tools/ToolsSubnav";
import { VoiceCloneTool } from "@/components/tools/VoiceCloneTool";

export const metadata = {
  title: "声音复刻合成",
};

export default function VoiceCloneToolPage() {
  return (
    <div className="site-container py-12 md:py-16">
      <PageHeader
        label="Voice"
        title="声音复刻合成"
        description="支持阿里云百炼（CosyVoice / Qwen 声音复刻）与 MiniMax。上传参考人声与文本，生成复刻音频。"
      />
      <ToolsSubnav />
      <div className="glass-card mt-8 p-5 md:p-8">
        <VoiceCloneTool />
      </div>
    </div>
  );
}
