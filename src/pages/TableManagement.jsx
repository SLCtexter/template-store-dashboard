import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, onSnapshot } from "firebase/firestore";
import Toast from "../components/Toast";
import "../styles/tablemanagement.css";

function TableManagement() {
  const [tables, setTables] = useState([]);
  const [newTableName, setNewTableName] = useState("");
  const [newTableCapacity, setNewTableCapacity] = useState(8);
  const [guests, setGuests] = useState([]);
  const [unassignedGuests, setUnassignedGuests] = useState([]);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  // Load tables and guests
  useEffect(() => {
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
        showToast("Error loading tables.", "error");
      }
    };

    const loadGuests = () => {
      try {
        const guestsCollectionRef = collection(db, "wedding_guests");
        
        // Use real-time listener instead of just fetching once
        const unsubscribe = onSnapshot(guestsCollectionRef, (snapshot) => {
          const guestsList = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setGuests(guestsList);
          // Filter unassigned guests who have RSVP'd "Attending"
          const unassigned = guestsList.filter((g) => !g.tableId && g.status === "Attending");
          setUnassignedGuests(unassigned);
        });
        
        // Return unsubscribe function to clean up listener
        return unsubscribe;
      } catch (error) {
        console.error("Error loading guests:", error);
        return null;
      }
    };

    loadTables();
    const unsubscribe = loadGuests();
    
    // Cleanup: unsubscribe from real-time listener when component unmounts
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);



  const handleAddTable = async (e) => {
    e.preventDefault();
    if (!newTableName.trim()) {
      showToast("Please enter table name.", "error");
      return;
    }

    setLoading(true);
    try {
      // Auto-prefix "Table " if not already present
      const tableName = newTableName.trim().startsWith("Table ") 
        ? newTableName.trim() 
        : `Table ${newTableName.trim()}`;

      const tableData = {
        name: tableName,
        capacity: Number(newTableCapacity),
        createdAt: new Date().toISOString(),
      };

      const docRef = await addDoc(collection(db, "wedding_tables"), tableData);
      setTables([...tables, { id: docRef.id, ...tableData }]);
      setNewTableName("");
      setNewTableCapacity(8);
      showToast(`${tableName} created successfully! 🎉`, "success");
    } catch (error) {
      console.error("Error adding table:", error);
      showToast("Error creating table.", "error");
    }
    setLoading(false);
  };

  const handleAssignGuest = async (guestId, tableId) => {
    if (!tableId) {
      showToast("Please select a table.", "error");
      return;
    }

    try {
      const guestDocRef = doc(db, "wedding_guests", guestId);
      await updateDoc(guestDocRef, { tableId });
      
      setGuests(guests.map((g) => (g.id === guestId ? { ...g, tableId } : g)));
      setUnassignedGuests(unassignedGuests.filter((g) => g.id !== guestId));
      
      const guest = guests.find((g) => g.id === guestId);
      const table = tables.find((t) => t.id === tableId);
      showToast(`${guest?.name} assigned to ${table?.name}! ✅`, "success");
    } catch (error) {
      console.error("Error assigning guest:", error);
      showToast("Error assigning guest.", "error");
    }
  };

  const handleUnassignGuest = async (guestId) => {
    try {
      const guestDocRef = doc(db, "wedding_guests", guestId);
      await updateDoc(guestDocRef, { tableId: null });
      
      const guest = guests.find((g) => g.id === guestId);
      setGuests(guests.map((g) => (g.id === guestId ? { ...g, tableId: null } : g)));
      setUnassignedGuests([...unassignedGuests, guest]);
      
      showToast(`${guest?.name} removed from table. ↩️`, "success");
    } catch (error) {
      console.error("Error unassigning guest:", error);
      showToast("Error unassigning guest.", "error");
    }
  };

  const handleDeleteTable = async (tableId) => {
    if (!window.confirm("Delete this table?")) return;

    try {
      await deleteDoc(doc(db, "wedding_tables", tableId));
      setTables(tables.filter((t) => t.id !== tableId));
      showToast("Table deleted.", "delete");
    } catch (error) {
      console.error("Error deleting table:", error);
      showToast("Error deleting table.", "error");
    }
  };

  return (
    <div className="table-management-container">
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={3000}
        />
      )}

      <div className="tm-header">
        <h1>🪑 Table Management</h1>
        <p>Assign guests to wedding tables before sending invitations</p>
      </div>

      {/* Add Table Form */}
      <div className="tm-section">
        <h2>Add New Table</h2>
        <form onSubmit={handleAddTable} className="add-table-form">
          <input
            type="text"
            placeholder="Table name (e.g., Table 1, VIP Table)"
            value={newTableName}
            onChange={(e) => setNewTableName(e.target.value)}
            className="tm-input"
          />
          <input
            type="number"
            placeholder="Capacity"
            min="1"
            max="20"
            value={newTableCapacity}
            onChange={(e) => setNewTableCapacity(e.target.value)}
            className="tm-input"
          />
          <button type="submit" disabled={loading} className="tm-btn-primary">
            {loading ? "Adding..." : "Add Table"}
          </button>
        </form>
      </div>

      {/* Tables Display */}
      <div className="tm-section">
        <h2>Seating Plan ({tables.length} tables)</h2>
        <div className="tm-tables-grid">
          {tables.map((table) => {
            const seatedGuests = guests.filter((g) => g.tableId === table.id);
            // Calculate total seated people using RSVP count if available, otherwise use invited count
            const totalSeated = seatedGuests.reduce(
              (sum, g) => sum + (g.rsvpGuests || g.numberOfGuests || 1),
              0
            );
            
            return (
              <div key={table.id} className="tm-table-card">
                <div className="tm-table-header">
                  <h3>{table.name}</h3>
                  <button
                    onClick={() => handleDeleteTable(table.id)}
                    className="tm-btn-delete"
                  >
                    🗑️
                  </button>
                </div>
                <p className="tm-capacity">
                  {totalSeated} / {table.capacity} seated
                </p>
                
                {/* Visual Seats - Circular Layout */}
                <div className="tm-seats-grid" data-table-name={table.name.replace("Table ", "")}>
                  {Array.from({ length: table.capacity }).map((_, index) => {
                    let seatOccupant = null;
                    let seatCount = 0;
                    
                    // Determine which guest occupies this seat
                    for (let guest of seatedGuests) {
                      const guestSeats = guest.rsvpGuests || guest.numberOfGuests || 1;
                      if (index < seatCount + guestSeats) {
                        seatOccupant = guest;
                        break;
                      }
                      seatCount += guestSeats;
                    }
                    
                    // Calculate angle for circular arrangement
                    const angle = (index / table.capacity) * 360;
                    const seatStyle = {
                      transform: `rotate(${angle}deg) translateY(-120px) rotate(-${angle}deg)`,
                    };
                    
                    return (
                      <div
                        key={index}
                        className={`tm-seat ${seatOccupant ? "occupied" : "empty"}`}
                        style={seatStyle}
                        title={seatOccupant ? seatOccupant.name : "Empty seat"}
                      >
                        {seatOccupant ? (
                          <span className="tm-seat-occupant">
                            {seatOccupant.name.split(" ")[0]}
                          </span>
                        ) : (
                          <span className="tm-seat-empty">Seat {index + 1}</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Seated Guests List */}
                <div className="tm-seated-count">
                  {seatedGuests.length > 0 && (
                    <div className="tm-guests-summary">
                      <strong>Guests ({seatedGuests.length}):</strong>
                      <div className="tm-seated-guests-edit">
                        {seatedGuests.map((guest) => (
                          <div key={guest.id} className="tm-seated-guest-item">
                            <span className="tm-guest-info">
                              {guest.name} ({guest.rsvpGuests || guest.numberOfGuests || 1})
                            </span>
                            <button
                              onClick={() => handleUnassignGuest(guest.id)}
                              className="tm-btn-unassign"
                              title="Remove from table"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Unassigned Guests */}
      <div className="tm-section">
        <h2>Unassigned Guests ({unassignedGuests.length})</h2>
        <div className="tm-unassigned-list">
          {unassignedGuests.length > 0 ? (
            unassignedGuests.map((guest) => (
              <div key={guest.id} className="tm-unassigned-guest">
                <span className="tm-guest-name">{guest.name}</span>
                <div className="tm-assign-controls">
                  <select
                    onChange={(e) => handleAssignGuest(guest.id, e.target.value)}
                    className="tm-select"
                  >
                    <option value="">Select Table...</option>
                    {tables.map((table) => (
                      <option key={table.id} value={table.id}>
                        {table.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))
          ) : (
            <p className="tm-all-assigned">✅ All guests are assigned to tables!</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default TableManagement;
