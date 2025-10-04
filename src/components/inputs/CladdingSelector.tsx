import { useState } from 'react';
import { ImageTile } from '../common/ImageTile';
import { useLayout } from '../../state/LayoutContext';
import { claddingTypes } from '../../state/formSchema';

type CladdingOption = (typeof claddingTypes)[number];

const CLADDING_IMAGES: Record<CladdingOption, string> = {
  corrugated: 'cladding-corrugated.jpg',
  monoclad: 'cladding-monoclad.jpg',
};

export function CladdingSelector() {
  const {
    state: {
      form: {
        cladding: { type },
      },
    },
    updateForm,
  } = useLayout();

  const [touched, setTouched] = useState(false);

  const handleSelect = (option: CladdingOption) => {
    setTouched(true);
    updateForm((prev) => ({
      ...prev,
      cladding: { type: option },
    }));
  };

  const error = touched && !type ? 'Select a cladding profile' : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {claddingTypes.map((option) => (
          <ImageTile
            key={option}
            label={option === 'corrugated' ? 'Corrugated' : 'Monoclad'}
            imageFile={CLADDING_IMAGES[option]}
            selected={type === option}
            onClick={() => handleSelect(option)}
            description={
              option === 'corrugated' ? 'High profile wave cladding with 1.2× factor.' : 'Flat profile, standard 1.0× factor.'
            }
          />
        ))}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
