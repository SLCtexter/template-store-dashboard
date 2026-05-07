import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { db } from "../firebase";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import "../styles/invitation.css";

function PersonalizedInvitation() {
  const [searchParams] = useSearchParams();
  const [guestName, setGuestName] = useState("");
  const [guestId, setGuestId] = useState("");
  const [showRsvp, setShowRsvp] = useState(false);
  const [rsvpName, setRsvpName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const name = searchParams.get("name");
    const id = searchParams.get("id");

    if (name) {
      setGuestName(decodeURIComponent(name));
      // If id is not provided, query database to find guest by name
      if (id) {
        setGuestId(id);
      } else {
        // Look up guest by name
        lookupGuestByName(decodeURIComponent(name));
      }
    }
  }, [searchParams]);

  const lookupGuestByName = async (guestName) => {
    try {
      const q = query(
        collection(db, "wedding_guests"),
        where("name", "==", guestName)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Get the first matching guest
        const guestDoc = querySnapshot.docs[0];
        setGuestId(guestDoc.id);
      }
    } catch (error) {
      console.error("Error looking up guest by name:", error);
    }
  };

  const handleRsvpSubmit = async () => {
    if (!rsvpName.trim()) {
      alert("Please enter your name");
      return;
    }

    setLoading(true);
    try {
      // Update guest with RSVP name
      if (guestId) {
        const guestDocRef = doc(db, "wedding_guests", guestId);
        await updateDoc(guestDocRef, {
          rsvpName: rsvpName.trim(),
          rsvpStatus: "Attending",
          rsvpDate: new Date().toISOString(),
        });
      }

      alert("RSVP submitted successfully! Thank you!");
      setShowRsvp(false);
      setRsvpName("");
    } catch (error) {
      console.error("Error updating RSVP:", error);
      alert("Error submitting RSVP");
    }
    setLoading(false);
  };

  return (
    <div className="invitation-container">
      {!showRsvp ? (
        <div className="invitation-card">
          <div className="invitation-header">
            <p className="greeting">Dear {guestName},</p>
            <p className="subtitle">You're invited!</p>
          </div>

          <div className="invitation-couples">
            <h1>Chanchala</h1>
            <div className="divider">&</div>
            <h1>Kalana</h1>
          </div>

          <div className="invitation-details">
            <p className="date">💍 Sunday, July 12, 2026</p>
            <p className="location">🏨 Hotel Sundream, Sri Lanka</p>
            <p className="time">⏰ 9:00 AM - 4:00 PM</p>
          </div>

          <button
            onClick={() => setShowRsvp(true)}
            className="view-invitation-btn"
          >
            YES! I WILL ATTEND ✨
          </button>

          <p className="footer-text">We can't wait to celebrate with you!</p>
        </div>
      ) : (
        <div className="rsvp-card">
          <h2>Confirm Your Attendance</h2>
          <p className="rsvp-greeting">Dear {guestName},</p>

          <div className="rsvp-form">
            <label>Your Name</label>
            <input
              type="text"
              value={rsvpName}
              onChange={(e) => setRsvpName(e.target.value)}
              placeholder="Enter your name"
            />

            <div className="rsvp-details">
              <p>📅 <strong>Chanchala & Kalana</strong></p>
              <p>📅 Sunday, July 12, 2026</p>
              <p>🏨 Hotel Sundream</p>
            </div>

            <button
              onClick={handleRsvpSubmit}
              disabled={loading}
              className="submit-rsvp-btn"
            >
              {loading ? "Submitting..." : "Confirm RSVP"}
            </button>
          </div>

          <button
            onClick={() => {
              setShowRsvp(false);
              setRsvpName("");
            }}
            className="back-btn"
          >
            Back to Invitation
          </button>
        </div>
      )}
    </div>
  );
}

export default PersonalizedInvitation;
