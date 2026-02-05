import React from 'react';
import "../component-styles/PromotionModal.css";
import ChessPiece from './ChessPiece';

const PromotionModal = ({ showModal, onClose, onSelect }) => {
  // Handle selecting a promotion piece
  const handleSelect = (piece) => {
    onSelect(piece);  // Call the onSelect callback with the selected piece
    onClose();  // Close the modal
  };

  if (!showModal) return null;  // Don't render the modal if showModal is false

  return (
    <div className="promotion-modal-overlay">
      <div className="promotion-modal">
        <h2>Pawn Promotion</h2>
        <p>Choose your new piece</p>
        <div className="promotion-options">
          <div className="promotion-option" onClick={() => handleSelect('Q')}>
            <div className="piece-wrapper"><ChessPiece piece="Q" className="promo-piece" /></div>
            <p>Queen</p>
          </div>
          <div className="promotion-option" onClick={() => handleSelect('N')}>
            <div className="piece-wrapper"><ChessPiece piece="N" className="promo-piece" /></div>
            <p>Knight</p>
          </div>
          <div className="promotion-option" onClick={() => handleSelect('R')}>
            <div className="piece-wrapper"><ChessPiece piece="R" className="promo-piece" /></div>
            <p>Rook</p>
          </div>
          <div className="promotion-option" onClick={() => handleSelect('B')}>
            <div className="piece-wrapper"><ChessPiece piece="B" className="promo-piece" /></div>
            <p>Bishop</p>
          </div>
        </div>
        <button className="close-modal" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

export default PromotionModal;
