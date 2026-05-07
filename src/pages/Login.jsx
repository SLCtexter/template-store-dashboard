import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import "../styles/auth.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        // Sign Up Logic
        const usersCollectionRef = collection(db, "dashboard_users");
        const q = query(usersCollectionRef, where("email", "==", email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          setError("Email already registered!");
          setLoading(false);
          return;
        }

        await addDoc(usersCollectionRef, {
          email: email,
          password: password, // ⚠️ In production, use proper authentication
          createdAt: new Date().toISOString(),
        });

        alert("Account created successfully! Please login.");
        setIsSignUp(false);
        setEmail("");
        setPassword("");
      } else {
        // Login Logic
        const usersCollectionRef = collection(db, "dashboard_users");
        const q = query(
          usersCollectionRef,
          where("email", "==", email),
          where("password", "==", password)
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setError("Invalid email or password!");
          setLoading(false);
          return;
        }

        // Store user info in localStorage
        const userData = querySnapshot.docs[0].data();
        localStorage.setItem(
          "dashboardUser",
          JSON.stringify({
            uid: querySnapshot.docs[0].id,
            email: userData.email,
          })
        );

        navigate("/guests");
      }
    } catch (err) {
      setError("Error: " + err.message);
      console.error(err);
    }

    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>{isSignUp ? "Create Account" : "Login to Dashboard"}</h2>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="auth-form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="wedding@example.com"
              required
            />
          </div>

          <div className="auth-form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="auth-btn">
            {loading ? "Please wait..." : isSignUp ? "Sign Up" : "Login"}
          </button>
        </form>

        {/* <p className="auth-toggle">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError("");
            }}
            className="toggle-btn"
          >
            {isSignUp ? "Login" : "Sign Up"}
          </button>
        </p> */}
      </div>
    </div>
  );
}

export default Login;
