import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { useLayout } from '../state/LayoutContext';
import { InputPanel } from '../components/InputPanel';
import '../styles/panels.css';

export default function AppShell() {
  const { state, dispatch } = useLayout();
  const { inputWidthPct, rightStack } = state.panelSizes;

  return (
    <PanelGroup
      direction="horizontal"
      onLayout={(sizes) =>
        dispatch({ type: 'SET_PANELS', payload: { ...state.panelSizes, inputWidthPct: sizes[0] } })
      }
    >
      <Panel defaultSize={inputWidthPct} minSize={20} maxSize={50}>
        <InputPanel />
      </Panel>
      <PanelResizeHandle className="yf-handle-x" />
      <Panel defaultSize={100 - inputWidthPct}>
        <PanelGroup
          direction="vertical"
          onLayout={(sizes) =>
            dispatch({ type: 'SET_PANELS', payload: { ...state.panelSizes, rightStack: sizes } })
          }
        >
          <Panel defaultSize={rightStack[0]} minSize={30} maxSize={60}>
            <div style={{ height: '100%', padding: '8px' }}>Results</div>
          </Panel>
          <PanelResizeHandle className="yf-handle-y" />
          <Panel defaultSize={rightStack[1]} minSize={25} maxSize={60}>
            <div style={{ height: '100%', padding: '8px' }}>SalesInsights</div>
          </Panel>
          <PanelResizeHandle className="yf-handle-y" />
          <Panel defaultSize={rightStack[2]} minSize={10} maxSize={70}>
            <div style={{ height: '100%', padding: '8px' }}>LivePreview</div>
          </Panel>
          <PanelResizeHandle className="yf-handle-y" />
          <Panel defaultSize={rightStack[3]} minSize={10} maxSize={70}>
            <div style={{ height: '100%', padding: '8px' }}>Help</div>
          </Panel>
        </PanelGroup>
      </Panel>
    </PanelGroup>
  );
}
