import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { InputPanel } from '../components/InputPanel';
import ExportPanel from '../components/export/ExportPanel';
import { useLayout } from '../state/LayoutContext';
import { ResultsPanel } from '../results/components/ResultsPanel';
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
      <Panel defaultSize={inputWidthPct} minSize={20} maxSize={55}>
        <div className="h-full overflow-y-auto border-r border-slate-200 bg-white transition-all duration-500">
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
            <div className="flex h-full flex-col bg-slate-50 p-4 transition-all duration-500">
              <ResultsPanel />
            </div>
          </Panel>
          <PanelResizeHandle className="yf-handle-y" />
          <Panel defaultSize={rightStack[1]} minSize={20} maxSize={65}>
            <div className="flex h-full flex-col bg-white p-4 shadow-inner transition-all duration-500">
              <ExportPanel />
            </div>
          </Panel>
        </PanelGroup>
      </Panel>
    </PanelGroup>
  );
}
