import { useState } from "react";
import "../styles/contactPicker.css";

function ContactPicker({ isOpen, onClose, onSelectContact }) {
  const [loading, setLoading] = useState(false);

  // Check if device is mobile
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  // Open native device contact picker
  const handleOpenContactPicker = async () => {
    try {
      setLoading(true);
      
      // Check if Contact Picker API is available
      if ('contacts' in navigator && 'ContactsManager' in window) {
        const props = ['name', 'tel'];
        const opts = { multiple: false };
        
        const [contact] = await navigator.contacts.select(props, opts);
        
        if (contact) {
          const name = contact.name ? contact.name[0] : '';
          const phone = contact.tel ? contact.tel[0] : '';
          
          onSelectContact({
            name: name,
            whatsapp: phone
          });
          
          onClose();
        }
      } else {
        alert("Contact Picker is not supported on your browser or device.\n\nPlease enter the WhatsApp number manually.");
      }
    } catch (error) {
      console.error('Error picking contact:', error);
      if (error.name !== 'NotAllowedError') {
        alert("Could not access contacts. Please enter manually.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="contact-picker-overlay">
      <div className="contact-picker-modal">
        <div className="picker-header">
          <h3>Select Contact from Device</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="picker-body">
          {isMobile() ? (
            <>
              <p className="picker-instruction">
                Click the button below to browse your device contacts and select a contact to add.
              </p>

              <button 
                className="native-picker-btn"
                onClick={handleOpenContactPicker}
                disabled={loading}
              >
                {loading ? "Loading..." : "Browse Device Contacts"}
              </button>

              <p className="picker-hint">
                This will open your device's contact list. Select a contact to auto-fill the WhatsApp number.
              </p>
            </>
          ) : (
            <>
              <div className="desktop-message">
                <p className="desktop-title">📱 Mobile Feature</p>
                <p className="desktop-text">
                  Contact Picker works on mobile devices only.
                </p>
                <p className="desktop-helper">
                  💡 <strong>Options:</strong>
                </p>
                <ul className="desktop-list">
                  <li>Use your phone to add contacts</li>
                  <li>Enter WhatsApp numbers manually</li>
                  <li>Copy & paste contact info</li>
                </ul>
              </div>
            </>
          )}
        </div>

        <div className="picker-footer">
          <button 
            className="cancel-btn"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default ContactPicker;
