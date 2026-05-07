import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, onSnapshot } from "firebase/firestore";
import config from "../config";
import Toast from "../components/Toast";
import ConfirmDialog from "../components/ConfirmDialog";
import MessageTemplateEditor from "../components/MessageTemplateEditor";
import ContactPicker from "../components/ContactPicker";
import "../styles/dashboard.css";

function GuestDashboard() {
  const [guests, setGuests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState({ isOpen: false, guestId: null, guestName: "" });
  const [messageEditor, setMessageEditor] = useState({ isOpen: false, guest: null, type: "invitation" });
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [editingGuest, setEditingGuest] = useState(null);
  const [newGuest, setNewGuest] = useState({
    title: "Mr",
    name: "",
    whatsapp: "",
    numberOfGuests: 1,
    side: "Groom",
    status: "Invited",
  });
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [tables, setTables] = useState([]);
  const navigate = useNavigate();

  // Show toast notification
  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  // Handle contact selection from Contact Picker
  const handleContactSelected = (contact) => {
    const formattedNumber = formatWhatsAppNumber(contact.whatsapp);
    setNewGuest({
      ...newGuest,
      name: contact.name || newGuest.name,
      whatsapp: formattedNumber
    });
    setShowContactPicker(false);
  };

  // Format WhatsApp number: convert "0712552525" to "94712552525"
  const formatWhatsAppNumber = (number) => {
    if (!number) return "";
    const cleaned = number.replace(/\D/g, ""); // Remove all non-digits
    
    if (cleaned.startsWith("0")) {
      // Convert 0712552525 to 94712552525
      return "94" + cleaned.slice(1);
    } else if (cleaned.startsWith("94")) {
      // Already in correct format
      return cleaned;
    } else {
      // Assume it's missing country code, add 94
      return "94" + cleaned;
    }
  };

  useEffect(() => {
    // Real-time listener for guests
    const loadGuestsRealtime = () => {
      try {
        const guestsCollectionRef = collection(db, "wedding_guests");
        
        // Use onSnapshot for real-time updates
        const unsubscribe = onSnapshot(guestsCollectionRef, (snapshot) => {
          const guestsList = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          
          // Sort by createdAt (newest first)
          const sortedGuests = guestsList.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            return dateB - dateA;
          });
          
          setGuests(sortedGuests);
        }, (error) => {
          console.error("Error listening to guests:", error);
        });
        
        return unsubscribe;
      } catch (error) {
        console.error("Error setting up guests listener:", error);
        return null;
      }
    };

    const loadTables = async () => {
      try {
        const tablesCollectionRef = collection(db, "wedding_tables");
        const snapshot = await getDocs(tablesCollectionRef);
        const tablesList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTables(tablesList);
      } catch (error) {
        console.error("Error loading tables:", error);
      }
    };

    // Check if user is logged in
    const userData = localStorage.getItem("dashboardUser");
    if (!userData) {
      navigate("/login");
      return;
    }
    setUser(JSON.parse(userData));
    
    // Set up real-time listeners for guests
    const unsubscribeGuests = loadGuestsRealtime();
    loadTables();
    
    // Cleanup: unsubscribe from listeners when component unmounts
    return () => {
      if (unsubscribeGuests) {
        unsubscribeGuests();
      }
    };
  }, [navigate]);



  const handleAddGuest = async (e) => {
    e.preventDefault();
    if (!newGuest.name.trim() || !newGuest.whatsapp.trim()) {
      alert("Please fill in all fields");
      return;
    }

    // Store the guest name before clearing
    const guestName = newGuest.name.trim();

    setLoading(true);
    try {
      // Generate a short unique ID (4-6 chars)
      const shortId = Math.random().toString(36).substring(2, 6).toUpperCase();

      const guestData = {
        title: newGuest.title,
        name: guestName,
        shortId: shortId,
        whatsapp: formatWhatsAppNumber(newGuest.whatsapp.trim()),
        numberOfGuests: Number(newGuest.numberOfGuests),
        side: newGuest.side,
        status: "Invited",
        invitationStatus: "pending",
        clickCount: 0,
        createdAt: new Date().toISOString(),
        invitationSent: false,
      };

      const docRef = await addDoc(collection(db, "wedding_guests"), guestData);
      const updatedGuest = { id: docRef.id, ...guestData };
      setGuests([updatedGuest, ...guests]);
      setNewGuest({ title: "Mr", name: "", whatsapp: "", numberOfGuests: 1, side: "Groom", status: "Invited" });
      showToast(`${guestName} added successfully! 🎉`, "success");
    } catch (error) {
      console.error("Error adding guest:", error);
      showToast("Error adding guest. Please try again.", "error");
    }
    setLoading(false);
  };

  const handleDeleteGuest = async (id) => {
    const guest = guests.find((g) => g.id === id);
    setConfirm({
      isOpen: true,
      guestId: id,
      guestName: guest?.name || "guest",
    });
  };

  const confirmDelete = async () => {
    if (!confirm.guestId) return;

    try {
      await deleteDoc(doc(db, "wedding_guests", confirm.guestId));
      setGuests(guests.filter((g) => g.id !== confirm.guestId));
      showToast(`${confirm.guestName} deleted successfully.`, "delete");
    } catch (error) {
      console.error("Error deleting guest:", error);
      showToast("Error deleting guest.", "error");
    } finally {
      setConfirm({ isOpen: false, guestId: null, guestName: "" });
    }
  };

  const cancelDelete = () => {
    setConfirm({ isOpen: false, guestId: null, guestName: "" });
  };

  // Edit guest handlers
  const handleEditGuest = (guest) => {
    setEditingGuest({
      ...guest,
      originalId: guest.id
    });
  };

  const handleSaveEdit = async () => {
    if (!editingGuest || !editingGuest.originalId) return;

    if (!editingGuest.name.trim() || !editingGuest.whatsapp.trim()) {
      showToast("Please fill in all fields.", "error");
      return;
    }

    try {
      const formattedNumber = formatWhatsAppNumber(editingGuest.whatsapp.trim());
      
      await updateDoc(doc(db, "wedding_guests", editingGuest.originalId), {
        title: editingGuest.title,
        name: editingGuest.name.trim(),
        whatsapp: formattedNumber,
        numberOfGuests: editingGuest.numberOfGuests,
        side: editingGuest.side,
        status: editingGuest.status,
      });

      // Update local state
      setGuests(guests.map((g) => 
        g.id === editingGuest.originalId 
          ? { ...editingGuest, id: editingGuest.originalId }
          : g
      ));

      showToast(`${editingGuest.name} updated successfully! ✏️`, "success");
      setEditingGuest(null);
    } catch (error) {
      console.error("Error updating guest:", error);
      showToast("Error updating guest.", "error");
    }
  };

  const handleCancelEdit = () => {
    setEditingGuest(null);
  };

  const handleSendWhatsApp = (guest) => {
    // Open message editor to allow customization before sending
    setMessageEditor({ isOpen: true, guest, type: "invitation" });
  };

  const handleSendReminder = (guest) => {
    // Open message editor for reminder message
    setMessageEditor({ isOpen: true, guest, type: "reminder" });
  };

  const handleSendMessageViaWhatsApp = (editedMessage) => {
    if (!messageEditor.guest) return;
    
    const guest = messageEditor.guest;
    const whatsappUrl = `https://wa.me/${guest.whatsapp}?text=${encodeURIComponent(
      editedMessage
    )}`;

    // Mark invitation as sent
    updateInvitationStatus(guest.id, "sent");
    showToast(`Invitation sent to ${guest.name}! 📱`, "success");

    window.open(whatsappUrl, "_blank");
  };

  const updateInvitationStatus = async (guestId, status) => {
    try {
      const guestDocRef = doc(db, "wedding_guests", guestId);
      await updateDoc(guestDocRef, {
        invitationStatus: status,
        invitationSentAt: new Date().toISOString(),
      });
      // Real-time listener will automatically update the dashboard
    } catch (error) {
      console.error("Error updating invitation status:", error);
    }
  };

  const handleCopyLink = (guest) => {
    const invitationUrl = `${config.invitationBaseUrl}invitation?name=${encodeURIComponent(
      guest.name
    )}&id=${guest.shortId || guest.id}`;

    navigator.clipboard.writeText(invitationUrl);
    alert("Invitation link copied to clipboard!");
  };

  const handleLogout = () => {
    localStorage.removeItem("dashboardUser");
    navigate("/login");
  };

  const stats = {
    total: guests.length,
    attending: guests.filter((g) => g.status === "Attending").length,
    pending: guests.filter((g) => g.status === "Invited").length,
    declined: guests.filter((g) => g.status === "Declined").length,
    groomSide: guests.filter((g) => g.side === "Groom").length,
    brideSide: guests.filter((g) => g.side === "Bride").length,
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="dashboard-container">
      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={3000}
        />
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={confirm.isOpen}
        title="Delete Guest"
        message={`Are you sure you want to delete ${confirm.guestName}? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        isDanger={true}
      />

      {/* Message Template Editor */}
      <MessageTemplateEditor
        isOpen={messageEditor.isOpen}
        onClose={() => setMessageEditor({ isOpen: false, guest: null, type: "invitation" })}
        onSend={handleSendMessageViaWhatsApp}
        guest={messageEditor.guest}
        messageType={messageEditor.type}
      />

      {/* Contact Picker */}
      <ContactPicker
        isOpen={showContactPicker}
        onClose={() => setShowContactPicker(false)}
        onSelectContact={handleContactSelected}
      />

      {/* Edit Guest Modal */}
      {editingGuest && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.6)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1500
        }}>
          <div style={{
            background: "white",
            borderRadius: "12px",
            padding: "30px",
            maxWidth: "500px",
            width: "90%",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)"
          }}>
            <h2 style={{ marginTop: 0, color: "#333" }}>Edit Guest</h2>
            
            <div style={{ marginBottom: "15px", display: "grid", gridTemplateColumns: "1fr 2fr", gap: "10px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", fontSize: "14px" }}>Title</label>
                <select
                  value={editingGuest.title || "Mr"}
                  onChange={(e) => setEditingGuest({ ...editingGuest, title: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "2px solid #e0e0e0",
                    borderRadius: "6px",
                    fontSize: "14px",
                    boxSizing: "border-box"
                  }}
                >
                  <option value="Mr">Mr</option>
                  <option value="Ms">Ms</option>
                  <option value="Miss">Miss</option>
                  <option value="Mr & Ms">Mr & Ms</option>
                  <option value="Mr & Family">Mr & Family</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", fontSize: "14px" }}>Guest Name</label>
                <input
                  type="text"
                  value={editingGuest.name}
                  onChange={(e) => setEditingGuest({ ...editingGuest, name: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "2px solid #e0e0e0",
                    borderRadius: "6px",
                    fontSize: "14px",
                    boxSizing: "border-box"
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", fontSize: "14px" }}>WhatsApp Number</label>
              <input
                type="text"
                value={editingGuest.whatsapp}
                onChange={(e) => setEditingGuest({ ...editingGuest, whatsapp: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "2px solid #e0e0e0",
                  borderRadius: "6px",
                  fontSize: "14px",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div style={{ marginBottom: "15px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", fontSize: "14px" }}>Number of Guests</label>
                <input
                  type="number"
                  value={editingGuest.numberOfGuests}
                  onChange={(e) => setEditingGuest({ ...editingGuest, numberOfGuests: parseInt(e.target.value) })}
                  min="1"
                  max="10"
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "2px solid #e0e0e0",
                    borderRadius: "6px",
                    fontSize: "14px",
                    boxSizing: "border-box"
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", fontSize: "14px" }}>Side</label>
                <select
                  value={editingGuest.side}
                  onChange={(e) => setEditingGuest({ ...editingGuest, side: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "2px solid #e0e0e0",
                    borderRadius: "6px",
                    fontSize: "14px",
                    boxSizing: "border-box"
                  }}
                >
                  <option value="Groom">Groom</option>
                  <option value="Bride">Bride</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", fontSize: "14px" }}>Status</label>
              <select
                value={editingGuest.status}
                onChange={(e) => setEditingGuest({ ...editingGuest, status: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "2px solid #e0e0e0",
                  borderRadius: "6px",
                  fontSize: "14px",
                  boxSizing: "border-box"
                }}
              >
                <option value="Invited">Invited</option>
                <option value="Confirmed">Confirmed</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={handleCancelEdit}
                style={{
                  padding: "10px 20px",
                  background: "#f5f5f5",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "500"
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                style={{
                  padding: "10px 20px",
                  background: "#667eea",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600"
                }}
              >
                ✏️ Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>Guest Management Dashboard</h1>
          <p>Logged in as: {user.email}</p>
        </div>
        <div className="header-buttons">
          <button 
            onClick={() => navigate("/tables")} 
            className="table-mgmt-btn"
          >
            Table Management
          </button>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card total">
          <h3>Total Guests</h3>
          <p>{stats.total}</p>
        </div>
        <div className="stat-card attending">
          <h3>Attending</h3>
          <p>{stats.attending}</p>
        </div>
        <div className="stat-card pending">
          <h3>Pending</h3>
          <p>{stats.pending}</p>
        </div>
        <div className="stat-card declined">
          <h3>Declined</h3>
          <p>{stats.declined}</p>
        </div>
        <div className="stat-card groom">
          <h3>Groom Side</h3>
          <p>{stats.groomSide}</p>
        </div>
        <div className="stat-card bride">
          <h3>Bride Side</h3>
          <p>{stats.brideSide}</p>
        </div>
      </div>

      {/* Add Guest Form */}
      <div className="add-guest-section">
        <h2>Add New Guest</h2>
        <form onSubmit={handleAddGuest} className="guest-form-wrapper">
          <div className="form-group">
            <label>TITLE</label>
            <select
              value={newGuest.title}
              onChange={(e) => setNewGuest({ ...newGuest, title: e.target.value })}
            >
              <option value="Mr">Mr</option>
              <option value="Ms">Ms</option>
              <option value="Miss">Miss</option>
              <option value="Mr & Ms">Mr & Ms</option>
              <option value="Mr & Family">Mr & Family</option>
            </select>
          </div>
          <div className="form-group">
            <label>GUEST NAME</label>
            <input
              type="text"
              placeholder="E.g. Sahan"
              value={newGuest.name}
              onChange={(e) =>
                setNewGuest({ ...newGuest, name: e.target.value })
              }
            />
          </div>
          <div className="form-group">
            <label>WHATSAPP NUMBER <span style={{color: "#999"}}></span></label>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                type="text"
                placeholder="0712552525 or 94771234567"
                value={newGuest.whatsapp}
                onChange={(e) =>
                  setNewGuest({ ...newGuest, whatsapp: e.target.value })
                }
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={() => setShowContactPicker(true)}
                style={{
                  padding: "8px 12px",
                  background: "#667eea",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "600",
                  whiteSpace: "nowrap"
                }}
                title="Import from contacts"
              >
                📱 Import
              </button>
            </div>
          </div>
          <div className="form-group">
            <label>GUESTS</label>
            <input
              type="number"
              placeholder="1"
              min="1"
              max="10"
              value={newGuest.numberOfGuests}
              onChange={(e) =>
                setNewGuest({ ...newGuest, numberOfGuests: e.target.value })
              }
            />
          </div>
          <div className="form-group">
            <label>SIDE</label>
            <select
              value={newGuest.side}
              onChange={(e) => setNewGuest({ ...newGuest, side: e.target.value })}
            >
              <option value="Groom">Groom</option>
              <option value="Bride">Bride</option>
            </select>
          </div>
          <button type="submit" disabled={loading} className="btn-add-guest">
            👤 {loading ? "Adding..." : "Add Guest"}
          </button>
        </form>
      </div>

      {/* Guests Table */}
      <div className="guests-table-section">
        <h2>All Guests</h2>
        <div className="search-box">
          <input 
            type="text" 
            placeholder="Search guests..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <table className="guests-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>WhatsApp</th>
              <th>Guests Count</th>
              <th>Side</th>
              <th>Status</th>
              <th>RSVP</th>
              <th>Message</th>
              <th>Table</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {guests
              .filter((guest) =>
                guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                guest.whatsapp.includes(searchTerm)
              )
              .map((guest) => (
              <tr key={guest.id}>
                <td>
                  <span style={{ fontWeight: "600", color: "#667eea" }}>{guest.title} </span>
                  {guest.name}
                </td>
                <td>{guest.whatsapp}</td>
                <td>
                  <strong>{guest.rsvpGuests || "0"}/{guest.numberOfGuests || 1}</strong>
                </td>
                <td>
                  <span className={`side-badge ${guest.side.toLowerCase()}`}>
                    {guest.side}
                  </span>
                </td>
                <td>
                  {/* Show RSVP status if available, otherwise show invitation status */}
                  {guest.status === "Attending" ? (
                    <span className="status-badge attending">✅ RSVP YES</span>
                  ) : guest.status === "Declined" ? (
                    <span className="status-badge declined">❌ RSVP NO</span>
                  ) : (
                    <span className={`status-badge ${guest.status.toLowerCase()}`}>
                      {guest.status}
                    </span>
                  )}
                </td>
                <td>{guest.rsvpName || "-"}</td>
                <td>
                  <small style={{color: "#666", fontStyle: "italic"}}>
                    {guest.rsvpMessage || "-"}
                  </small>
                </td>
                <td>
                  {guest.tableId ? (
                    <span className="table-badge">
                      🪑 {tables.find((t) => t.id === guest.tableId)?.name || "Table"}
                    </span>
                  ) : (
                    <span className="table-badge unassigned">Unassigned</span>
                  )}
                </td>
                <td className="actions-column">
                  {/* Invitation Status */}
                  <div className="action-group">
                    {guest.status === "Attending" || guest.status === "Declined" ? (
                      <span className="badge badge-sent">✅ INVITATION SENT</span>
                    ) : guest.invitationStatus === "pending" ? (
                      <span className="badge badge-pending">📋 PENDING</span>
                    ) : (
                      <span className="badge badge-sent">✅ INVITATION SENT</span>
                    )}
                  </div>

                  {/* Click Count */}
                  <div className="action-group">
                    <small className="click-count">
                      👁️ Opened: {guest.clickCount || 0}x
                    </small>
                  </div>

                  {/* Action Buttons */}
                  <div className="action-group">
                    <button
                      onClick={() => handleCopyLink(guest)}
                      className="copy-link-btn"
                      title="Copy invitation link"
                    >
                      📋 Copy Link
                    </button>
                    {guest.status === "Invited" ? (
                      <button
                        onClick={() => handleSendWhatsApp(guest)}
                        className="send-invite-btn"
                        title="Send invitation via WhatsApp"
                      >
                        📱 Send Invite
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSendReminder(guest)}
                        className="send-reminder-btn"
                        title="Send reminder via WhatsApp"
                      >
                        🔔 Send Reminder
                      </button>
                    )}
                    <button
                      onClick={() => handleEditGuest(guest)}
                      className="edit-btn"
                      title="Edit guest details"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDeleteGuest(guest.id)}
                      className="delete-btn"
                      title="Delete guest"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default GuestDashboard;
