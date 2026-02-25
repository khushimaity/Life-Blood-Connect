import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// header buttons   
import Header from "./common/Header";
import Home from "./components/Home";
import LearnMore from "./components/LearnMore";
import AdminRegistration from "./components/AdminRegistration";
import DonorRegistration from "./components/DonorRegistration";
import DonorLogin from "./components/DonorLogin";
import Footer from "./common/Footer";

// after login
import AdminDashboard from "./admin/AdminDashboard";
import DonorDashboard from "./donor/DonorDashboard";

// admin sidebar
import EmergencyRequest from "./admin/EmergencyRequest";
import Donors from "./admin/Donors";
import Requests from "./admin/Requests";
import PostRequest from "./admin/PostRequest"; // Add this import
import AdminProfile from './admin/AdminProfile';


// donor sidebar
import MyRequests from "./donor/MyRequests";
import DonorProfile from './donor/DonorProfile';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Header />
        
        {/* Main Content Area */}
        <div className="flex-grow">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/learn-more" element={<LearnMore />} />
            <Route path="/admin-registration" element={<AdminRegistration />} />
            <Route path="/register" element={<DonorRegistration />} />
            <Route path="/login" element={<DonorLogin />} />

            {/* Admin Routes */}
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/emergency-request" element={<EmergencyRequest />} />
            <Route path="/post-request" element={<PostRequest />} />
            <Route path="/donors" element={<Donors />} />
            <Route path="/requests" element={<Requests />} />
            <Route path="/admin-profile" element={<AdminProfile />} />

            {/* Donor Routes */}
            <Route path="/donor-dashboard" element={<DonorDashboard />} />
            <Route path="/donor-profile" element={<DonorProfile />} />
            <Route path="/my-requests" element={<MyRequests />} />
          </Routes>
        </div>

        <Footer />
      </div>
    </Router>
  );
}

export default App;