import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { InputPanel } from '../components/InputPanel';
import { WeatherPanel } from '../components/WeatherPanel';
import { AiAdvisorPanel } from '../components/AiAdvisorPanel';
import { useLayout } from '../state/LayoutContext';
import '../styles/panels.css';

export default function AppShell() {
  const { state, dispatch } = useLayout();
  const { inputWidthPct, rightStack } = state.panelSizes;

  return (
    <PanelGroup
      direction="horizontal"
      className="h-full"
      onLayout={(sizes) =>
        dispatch({ type: 'SET_PANELS', payload: { ...state.panelSizes, inputWidthPct: sizes[0] } })
      }
    >
      <Panel defaultSize={inputWidthPct} minSize={20} maxSize={50}>
        <div className="h-full overflow-y-auto border-r border-slate-200 bg-white">
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
          <Panel defaultSize={rightStack[0]} minSize={40} maxSize={65}>
            <div className="flex h-full flex-col bg-slate-50">
              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid h-full gap-4 xl:grid-cols-2">
                  <WeatherPanel />
                  <AiAdvisorPanel />
                </div>
              </div>
            </div>
          </Panel>
          <PanelResizeHandle className="yf-handle-y" />
          <Panel defaultSize={rightStack[1]} minSize={15} maxSize={40}>
            <div className="flex h-full flex-col bg-white p-4 shadow-inner">
              <h3 className="text-sm font-semibold text-slate-700">Sales Insights</h3>
              <p className="mt-2 text-sm text-slate-500">
                Configure pricing analytics and deal guidance.
              </p>
            </div>
          </Panel>
          <PanelResizeHandle className="yf-handle-y" />
          <Panel defaultSize={rightStack[2]} minSize={15} maxSize={35}>
            <div className="flex h-full flex-col bg-white p-4 shadow-inner">
              <h3 className="text-sm font-semibold text-slate-700">Live Preview</h3>
              <p className="mt-2 text-sm text-slate-500">Preview generated materials in real time.</p>
            </div>
          </Panel>
          <PanelResizeHandle className="yf-handle-y" />
          <Panel defaultSize={rightStack[3]} minSize={10} maxSize={30}>
            <div className="flex h-full flex-col bg-white p-4 shadow-inner">
              <h3 className="text-sm font-semibold text-slate-700">Help</h3>
              <p className="mt-2 text-sm text-slate-500">Guides and support resources live here.</p>
            </div>
          </Panel>
        </PanelGroup>
      </Panel>
    </PanelGroup>
  );
}
