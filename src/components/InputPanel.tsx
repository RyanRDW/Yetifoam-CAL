import { CollapsibleSection } from './CollapsibleSection';

export function InputPanel() {
  return (
    <div style={{ height: '100%', overflow: 'auto' }}>
      <CollapsibleSection id="loc" title="Location" isComplete={false}>
        {/* TODO: suburb autocomplete */}
      </CollapsibleSection>
      <CollapsibleSection id="dim" title="Dimensions" isComplete={false}>
        {/* TODO: length/width/height */}
      </CollapsibleSection>
      <CollapsibleSection id="pitch" title="Pitch" isComplete={false}>
        {/* TODO: pitch tiles */}
      </CollapsibleSection>
      <CollapsibleSection id="clad" title="Cladding" isComplete={false}>
        {/* TODO: cladding tiles */}
      </CollapsibleSection>
      <CollapsibleSection id="mem" title="Members" isComplete={false}>
        {/* TODO: member selectors */}
      </CollapsibleSection>
      <CollapsibleSection id="opt" title="SprayOptions" isComplete={false}>
        {/* TODO: checkboxes */}
      </CollapsibleSection>
      <CollapsibleSection id="open" title="Openings" isComplete={false}>
        {/* TODO: openings modal trigger */}
      </CollapsibleSection>
    </div>
  );
}
