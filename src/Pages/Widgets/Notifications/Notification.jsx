import React from 'react';

const Notification = ({ status, message, onClose }) => {
  // If 'message' is empty, the notification will not render.
  if (!message) return null;

  const color = status === 'success' ? '#28a745' : '#dc3545';
  const title = status === 'success' ? 'Éxito' : 'Error';

  return (
    <div 
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        padding: '20px 30px',
        backgroundColor: color,
        color: 'white',
        borderRadius: '8px',
        boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
        zIndex: 1050,
        minWidth: '300px',
        textAlign: 'center',
        cursor: 'pointer',
      }}
      // The onClick prop closes the notification
      onClick={onClose}
    >
      <h4 style={{ margin: 0, marginBottom: '5px' }}>{title}</h4>
      <p style={{ margin: 0 }}>{message}</p>
    </div>
  );
};

export default Notification;