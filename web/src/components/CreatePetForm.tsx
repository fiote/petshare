import { useRef, useState } from 'react';
import { ImagePlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api, ApiError } from '../api/client';
import type { Pet } from '../api/types';
import { SpeciesCombobox } from './SpeciesCombobox';

interface Props {
  onCreated: () => Promise<void> | void;
  submitLabel?: string;
}

export function CreatePetForm({ onCreated, submitLabel }: Props) {
  const { t } = useTranslation('pets');
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelected = (file: File | null) => {
    setPhoto(file);
    setPhotoPreview((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return file ? URL.createObjectURL(file) : null;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const pet = await api.post<Pet>('/pets', {
        name,
        species: species || undefined,
      });

      if (photo) {
        const formData = new FormData();
        formData.append('photo', photo);
        await api.postForm(`/pets/${pet.id}/photo`, formData);
      }

      setName('');
      setSpecies('');
      handlePhotoSelected(null);
      if (photoInputRef.current) photoInputRef.current.value = '';
      await onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('createForm.error'));
    } finally {
      setCreating(false);
    }
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label className="field">
        <span>{t('createForm.name')}</span>
        <input value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <label className="field">
        <span>{t('createForm.species')}</span>
        <SpeciesCombobox value={species} onChange={setSpecies} />
      </label>
      <label className="field">
        <span>{t('createForm.photo')}</span>
        <button
          type="button"
          className="photo-picker"
          onClick={() => photoInputRef.current?.click()}
          style={
            photoPreview
              ? {
                  backgroundImage: `url(${photoPreview})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : undefined
          }
        >
          {!photoPreview && (
            <>
              <ImagePlus size={22} strokeWidth={2} />
              <span>{t('createForm.choosePhoto')}</span>
            </>
          )}
        </button>
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => handlePhotoSelected(e.target.files?.[0] ?? null)}
        />
      </label>
      {error && <p className="error">{error}</p>}
      <button className="btn btn--primary" type="submit" disabled={creating}>
        {creating ? t('createForm.saving') : submitLabel ?? t('createForm.submit')}
      </button>
    </form>
  );
}
