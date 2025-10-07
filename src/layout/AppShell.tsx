import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { InputPanel } from '../components/InputPanel';
import ExportPanel from '../components/export/ExportPanel';
import { AiAdvisorPanel } from '../components/AiAdvisorPanel';
import { useLayout } from '../state/LayoutContext';
import { ResultsPanel } from '../results/components/ResultsPanel';
import '../styles/panels.css';

export default function AppShell() {
  const { state, dispatch } = useLayout();
  const { inputWidthPct, rightStack } = state.panelSizes;

  return (
    <div className="relative min-h-screen bg-slate-100/90">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(14,116,144,0.16),transparent_55%)]" />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1400px] flex-col gap-6 px-4 py-8 lg:px-6">
        <PanelGroup
          direction="horizontal"
          className="flex-1 rounded-[32px] bg-white/40 p-4 backdrop-blur-xl shadow-xl ring-1 ring-slate-200/60"
          onLayout={(sizes) =>
            dispatch({ type: 'SET_PANELS', payload: { ...state.panelSizes, inputWidthPct: sizes[0] } })
          }
        >
          <Panel defaultSize={inputWidthPct} minSize={22} maxSize={55}>
            <div className="h-full overflow-hidden rounded-[28px] bg-white/90 shadow-inner">
              <InputPanel />
            </div>
          </Panel>
          <PanelResizeHandle className="yf-handle-x" />
          <Panel defaultSize={100 - inputWidthPct}>
            <PanelGroup
              direction="vertical"
              className="h-full"
              onLayout={(sizes) =>
                dispatch({ type: 'SET_PANELS', payload: { ...state.panelSizes, rightStack: sizes } })
              }
            >
              <Panel defaultSize={rightStack[0]} minSize={35} maxSize={80}>
                <div className="h-full overflow-hidden rounded-[28px] bg-white/90 shadow-inner">
                  <div className="h-full overflow-y-auto px-5 py-6 lg:px-7">
                    <ResultsPanel />
                  </div>
                </div>
              </Panel>
              <PanelResizeHandle className="yf-handle-y" />
              <Panel defaultSize={rightStack[1]} minSize={25} maxSize={65}>
                <div className="grid h-full gap-5 rounded-[28px] bg-white/90 p-5 shadow-inner lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
                  <AiAdvisorPanel />
                  <ExportPanel />
                </div>
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}
