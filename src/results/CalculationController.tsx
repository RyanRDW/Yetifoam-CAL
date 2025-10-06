import { useEffect, useRef } from 'react';
import { useLayout, type SectionState } from '../state/LayoutContext';
import { calculateResult } from '../state/results';
import { isFormValid } from '../state/formSchema';

export function CalculationController() {
  const { state, dispatch } = useLayout();
  const timers = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      timers.current.forEach((id) => window.clearTimeout(id));
      timers.current = [];
    };
  }, []);

  useEffect(() => {
    function handleCalculate() {
      if (!isFormValid(state.form)) {
        dispatch({
          type: 'SET_RESULTS',
          payload: {
            status: 'error',
            lastResult: state.results.lastResult,
            error: 'Complete all required inputs before calculating.',
          },
        });
        return;
      }

      const calculation = calculateResult(state.form);

      timers.current.forEach((id) => window.clearTimeout(id));
      timers.current = [];

      dispatch({
        type: 'SET_RESULTS',
        payload: {
          status: 'pending',
          lastResult: state.results.lastResult,
          error: null,
        },
      });
      dispatch({ type: 'SET_MODE', payload: 'calculating' });
      dispatch({ type: 'SET_SECTIONS', payload: collapseAll(state.sections) });

      const schedule = (delay: number, fn: () => void) => {
        const id = window.setTimeout(fn, delay);
        timers.current.push(id);
      };

      schedule(200, () => {
        dispatch({
          type: 'SET_PANELS',
          payload: { inputWidthPct: 32, rightStack: [55, 45] },
        });
      });

      schedule(400, () => {
        dispatch({
          type: 'SET_PANELS',
          payload: { inputWidthPct: 28, rightStack: [62, 38] },
        });
      });

      schedule(600, () => {
        dispatch({
          type: 'SET_PANELS',
          payload: { inputWidthPct: 25, rightStack: [70, 30] },
        });
      });

      schedule(800, () => {
        dispatch({
          type: 'SET_RESULTS',
          payload: {
            status: 'ready',
            lastResult: calculation,
            error: null,
          },
        });
        dispatch({ type: 'SET_MODE', payload: 'results' });
      });
    }

    window.addEventListener('calculate-requested', handleCalculate);
    return () => window.removeEventListener('calculate-requested', handleCalculate);
  }, [dispatch, state.sections, state.form, state.results.lastResult]);

  return null;
}

function collapseAll(sections: SectionState): SectionState {
  const nextEntries = Object.keys(sections).map((key) => [key, 'collapsed'] as const);
  return Object.fromEntries(nextEntries) as SectionState;
}
