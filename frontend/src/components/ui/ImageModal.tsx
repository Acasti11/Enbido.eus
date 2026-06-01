import React from 'react';
import { useTranslation } from 'react-i18next';

interface ImageModalProps {
  imageUrl: string | null;
  onCloseModal: () => void;
}

const ImageModal = ({ imageUrl, onCloseModal }: ImageModalProps): React.JSX.Element | null => {
  const { t } = useTranslation();
  const hasImage = Boolean(imageUrl);

  if (!hasImage) return null;

  const handleStopPropagation = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  return (
    <div className="modal-overlay" onClick={onCloseModal}>
      <div className="modal-img-container" onClick={handleStopPropagation}>
        <button className="btn-close-modal" onClick={onCloseModal}>X</button>
        <img src={imageUrl!} alt={t('common.posterLarge')} className="modal-poster-img" />
      </div>
    </div>
  );
};

export default ImageModal;
