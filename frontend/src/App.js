import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import "@/App.css";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Landing from "./pages/Landing";
import Discover from "./pages/Discover";
import Vault from "./pages/Vault";
import Pulse from "./pages/Pulse";
import Auth from "./pages/Auth";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="App ambient-bg grain min-h-screen text-white">
          <Navbar />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/vault" element={<Vault />} />
            <Route path="/pulse" element={<Pulse />} />
            <Route path="/auth" element={<Auth />} />
          </Routes>
          <Toaster theme="dark" position="bottom-center" toastOptions={{ style: { background: "#0e0d0b", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" } }} />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
