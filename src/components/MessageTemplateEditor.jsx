import { useState, useEffect } from "react";
import config from "../config";
import "../styles/messageTemplateEditor.css";

function MessageTemplateEditor({ isOpen, onClose, onSend, guest, messageType = "invitation" }) {
  const [message, setMessage] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [templates, setTemplates] = useState(() => {
    const saved = localStorage.getItem("whatsappTemplates");
    return saved ? JSON.parse(saved) : [];
  });

  // Load default template when editor opens
  useEffect(() => {
    const generateDefaultMessage = () => {
      const guestName = guest?.name || "Guest";
      const guestTitle = guest?.title || "";
      let displayName = guestTitle ? `${guestTitle} ${guestName}` : guestName;
      
      if (guestTitle === "Mr & Family") {
        displayName = `Mr ${guestName} & Family`;
      }
      
      const guestCount = guest?.numberOfGuests || 1;
      
      switch(messageType) {
        case "invitation":
          return `Dear ${displayName},

You're invited to the wedding of

💍 Chanchala & Kalana 💍

Number of Guests: ${guestCount}
Sunday, July 12, 2026

👇 View Invitation:
${config.invitationBaseUrl}invitation?name=${encodeURIComponent(guestName)}&id=${guest?.shortId || guest?.id}`;
        
        case "reminder":
          return `Hi ${displayName}! 📣

This is a friendly reminder about the wedding invitation.

💍 Chanchala & Kalana's Wedding 💍

Date: Sunday, July 12, 2026
Guests: ${guestCount}

👉 Click here to RSVP:
${config.invitationBaseUrl}invitation?name=${encodeURIComponent(guestName)}&id=${guest?.shortId || guest?.id}`;
        
        case "thankyou":
          return `Hi ${displayName},

Thank you so much for celebrating with us! 💕

We appreciate you joining us for our special day.

See you soon!

💍 Chanchala & Kalana 💍`;
        
        default:
          return "";
      }
    };

    if (isOpen && messageType) {
      const defaultMsg = generateDefaultMessage();
      setMessage(defaultMsg);
    }
  }, [isOpen, messageType, guest]);



  const handleUseTemplate = (templateType) => {
    const guestName = guest?.name || "Guest";
    const guestTitle = guest?.title || "";
    let displayName = guestTitle ? `${guestTitle} ${guestName}` : guestName;

    if (guestTitle === "Mr & Family") {
      displayName = `Mr ${guestName} & Family`;
    }

    const guestCount = guest?.numberOfGuests || 1;
    
    switch(templateType) {
      case "invitation":
        setMessage(`Dear ${displayName},

You're invited to the wedding of

💍 Chanchala & Kalana 💍

Number of Guests: ${guestCount}
Sunday, July 12, 2026

👇 View Invitation:
${config.invitationBaseUrl}invitation?name=${encodeURIComponent(guestName)}&id=${guest?.shortId || guest?.id}`);
        break;
      case "reminder":
        setMessage(`Hi ${displayName}! 📣

This is a friendly reminder about the wedding invitation.

💍 Chanchala & Kalana's Wedding 💍

Date: Sunday, July 12, 2026
Guests: ${guestCount}

👉 Click here to RSVP:
${config.invitationBaseUrl}invitation?name=${encodeURIComponent(guestName)}&id=${guest?.shortId || guest?.id}`);
        break;
      case "thankyou":
        setMessage(`Hi ${displayName},

Thank you so much for celebrating with us! 💕

We appreciate you joining us for our special day.

See you soon!

💍 Chanchala & Kalana 💍`);
        break;
      default:
        break;
    }
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      alert("Please enter a template name");
      return;
    }
    
    const newTemplate = {
      id: Date.now(),
      name: templateName,
      content: message,
    };
    
    const updated = [...templates, newTemplate];
    setTemplates(updated);
    localStorage.setItem("whatsappTemplates", JSON.stringify(updated));
    alert("Template saved!");
    setTemplateName("");
  };

  const handleDeleteTemplate = (id) => {
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    localStorage.setItem("whatsappTemplates", JSON.stringify(updated));
  };

  const handleSendMessage = () => {
    if (!message.trim()) {
      alert("Please enter a message");
      return;
    }
    onSend(message);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="message-editor-overlay">
      <div className="message-editor-modal">
        <div className="editor-header">
          <h3>Edit Message</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="editor-body">
          {/* Message Textarea */}
          <div className="message-section">
            <label>Message Content:</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message here..."
              rows="8"
              className="message-textarea"
            />
            <div className="char-count">{message.length} characters</div>
          </div>

          {/* Default Templates */}
          <div className="templates-section">
            <h4>📋 Default Templates:</h4>
            <div className="template-buttons">
              <button 
                className="template-btn"
                onClick={() => handleUseTemplate("invitation")}
              >
                📧 Invitation
              </button>
              <button 
                className="template-btn"
                onClick={() => handleUseTemplate("reminder")}
              >
                🔔 Reminder
              </button>
              <button 
                className="template-btn"
                onClick={() => handleUseTemplate("thankyou")}
              >
                🙏 Thank You
              </button>
            </div>
          </div>

          {/* Save as Template */}
          <div className="save-template-section">
            <h4>💾 Save as Custom Template:</h4>
            <div className="save-template-form">
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Template name (e.g., 'Birthday Wish')"
                className="template-name-input"
              />
              <button 
                className="save-template-btn"
                onClick={handleSaveTemplate}
              >
                Save Template
              </button>
            </div>
          </div>

          {/* Saved Custom Templates */}
          {templates.length > 0 && (
            <div className="custom-templates-section">
              <h4>⭐ Your Saved Templates:</h4>
              <div className="custom-templates-list">
                {templates.map((template) => (
                  <div key={template.id} className="custom-template-item">
                    <button
                      className="use-custom-template-btn"
                      onClick={() => handleUseTemplate(template.content)}
                      title={template.content}
                    >
                      {template.name}
                    </button>
                    <button
                      className="delete-template-btn"
                      onClick={() => handleDeleteTemplate(template.id)}
                      title="Delete template"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="editor-footer">
          <button 
            className="cancel-btn"
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            className="send-btn"
            onClick={handleSendMessage}
          >
            📱 Send via WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}

export default MessageTemplateEditor;
