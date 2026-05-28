import { PageHeader } from "@/components/PageHeader";
import { MapLocatorTool } from "@/components/tools/MapLocatorTool";
import { ToolsSubnav } from "@/components/tools/ToolsSubnav";

export const metadata = {
  title: "地图定位",
};

export default function MapToolPage() {
  return (
    <div className="site-container py-12 md:py-16">
      <PageHeader
        label="Map"
        title="地图定位工具"
        description="输入经纬度或在地图上点击选点，使用 Mapbox 定位并标注位置。支持拖动标记与浏览器定位。"
      />
      <ToolsSubnav />
      <div className="glass-card mt-8 p-5 md:p-8">
        <MapLocatorTool />
      </div>
    </div>
  );
}
