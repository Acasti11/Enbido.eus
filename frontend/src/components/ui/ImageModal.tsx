import React from 'react';

interface ImageModalProps {
  imageUrl: string | null;
  onCloseModal: () => void;
}

const ImageModal = ({ imageUrl, onCloseModal }: ImageModalProps): React.JSX.Element | null => {
  const hasImage = Boolean(imageUrl);
  
  if (!hasImage) return null;

  const handleStopPropagation = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  return (
    <div className="modal-overlay" onClick={onCloseModal}>
      <div className="modal-img-container" onClick={handleStopPropagation}>
        <button className="btn-close-modal" onClick={onCloseModal}>X</button>
        <img src={imageUrl!} alt="Poster en grande" className="modal-poster-img" />
      </div>
    </div>
  );
};

export default ImageModal;