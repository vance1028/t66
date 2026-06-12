import { Scene3D } from '@/components/three/Scene';
import { Toolbar } from '@/components/ui/Toolbar';
import { ContainerList } from '@/components/ui/ContainerList';
import { DataPanel } from '@/components/ui/DataPanel';
import { ContainerDetail } from '@/components/ui/ContainerDetail';

export default function Home() {
  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 overflow-hidden">
      <Toolbar />
      <div className="flex-1 flex overflow-hidden relative">
        <ContainerList />
        <div className="flex-1 relative">
          <Scene3D />
          <ContainerDetail />
        </div>
        <DataPanel />
      </div>
    </div>
  );
}
