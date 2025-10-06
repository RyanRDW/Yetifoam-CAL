import { useState } from 'react';
import { ImageTile } from '../common/ImageTile';
import { useLayout } from '../../state/LayoutContext';
import { memberTypes } from '../../state/formSchema';

type MemberChoice = (typeof memberTypes)[number];

type MemberKey = 'roof' | 'walls';

const MEMBER_IMAGES: Record<MemberChoice, string> = {
  top_hat: 'member-tophat.jpg',
  c_channel: 'member-cchannel.jpg',
};

export function MemberSelectors() {
  const {
    state: {
      form: { members },
    },
    updateForm,
  } = useLayout();

  const [touched, setTouched] = useState<Record<MemberKey, boolean>>({ roof: false, walls: false });

  const handleSelect = (key: MemberKey, choice: MemberChoice) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
    updateForm((prev) => ({
      ...prev,
      members: {
        ...prev.members,
        [key]: choice,
      },
    }));
  };

  return (
    <div className="flex flex-col gap-4">
      {(['roof', 'walls'] as MemberKey[]).map((key) => {
        const label = key === 'roof' ? 'Roof Members' : 'Wall Members';
        const selected = members[key];
        const error = touched[key] && !selected ? 'Select a member type' : null;
        return (
          <div key={key} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">{label}</span>
              {selected && (
                <span className="text-xs text-slate-500">
                  Selected: {selected === 'top_hat' ? 'Top-hat' : 'C-channel'}
                </span>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {(memberTypes as MemberChoice[]).map((choice) => (
                <ImageTile
                  key={choice}
                  label={choice === 'top_hat' ? 'Top-hat' : 'C-channel'}
                  imageFile={MEMBER_IMAGES[choice]}
                  selected={selected === choice}
                  onClick={() => handleSelect(key, choice)}
                  description={
                    choice === 'top_hat'
                      ? key === 'roof'
                        ? '1200mm spacing for corrugated; 1500mm for monoclad.'
                        : '1200mm spacing on walls.'
                      : key === 'roof'
                        ? '1500mm spacing across cladding types.'
                        : '1200mm spacing on walls.'
                  }
                />
              ))}
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>
        );
      })}
    </div>
  );
}
