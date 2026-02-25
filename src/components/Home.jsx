import { useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { emergencyAPI } from "../api/emergencyAPI";
import { toast } from 'react-toastify';

const Home = () => {
  const [emergencyRequests, setEmergencyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    fetchEmergencyRequests();
  }, []);

  // In your Home.jsx, update the emergency requests fetch
  const fetchEmergencyRequests = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/blood-requests/emergency');
      if (response.data.success) {
        // If user is logged in, filter out requests they've accepted
        const token = localStorage.getItem('token');
        if (token) {
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          const donorResponse = await axios.get('http://localhost:5000/api/donors/profile/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (donorResponse.data.success) {
            const donor = donorResponse.data.donor;
            
            // Get requests this donor has accepted
            const acceptedResponse = await axios.get('http://localhost:5000/api/blood-requests/my-requests', {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            const acceptedIds = acceptedResponse.data.requests
              .filter(req => req.role === 'volunteer')
              .map(req => req.id);
            
            // Filter out accepted requests
            const filtered = response.data.requests.filter(
              req => !acceptedIds.includes(req.requestId)
            );
            
            setEmergencyRequests(filtered);
          } else {
            setEmergencyRequests(response.data.requests);
          }
        } else {
          setEmergencyRequests(response.data.requests);
        }
      }
    } catch (error) {
      console.error('Error fetching emergency requests:', error);
    }
  };

  useEffect(() => {
    if (location.state?.scrollTo) {
      const target = document.getElementById(location.state.scrollTo);
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [location]);

  return (
    <>
      {/* Hero Section - Keep as is */}
      <section
        className="min-h-screen bg-center bg-no-repeat flex flex-col items-center justify-center px-6 py-16 text-white text-center"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.6)), url('https://lh3.googleusercontent.com/aida-public/AB6AXuBpMWet9_M7RtFB64Cvf9KUezcALEo_LB3_475Fzg6XfnJODkdIjuFgaPoq1xAH2luZdNE7J0UWsh-RQbYiG4P2eBUts8DHyFsc1amef4gablXo2SAc-aRNJXkdGzN3K-oHPn6jASR6227UEU7q-kOpyVAlFHhCAkGOGFO9F7XD3931WNSTk-xZyb_gxwk3Lx_vQUrs_ORiRKwOV5KVI8vFoQQgmNuhcFuhMga1dIjBsWgJhvb1jsmkvu8ybAARokLJ9JBpj9fCDHA')",
          backgroundSize: "90%",
        }}
      >
        <div className="text-white text-center drop-shadow-md">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4">Donate Blood, Save Lives</h1>
          <p className="text-lg max-w-xl mx-auto">
            Your contribution can make a difference. Join us in our mission to ensure a healthy community.
          </p>
          <Link to="/learn-more">
            <button className="mt-6 bg-white text-red-700 font-bold px-8 py-3 rounded-lg border border-red-700 hover:bg-red-700 hover:text-white transition">
              Learn More
            </button>
          </Link>
        </div>
      </section>

      {/* Why Donate Section - Keep as is */}
      <section className="flex flex-col px-6 py-12 text-left text-black max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Why Donate?</h1>
        <p className="text-lg leading-relaxed">
          Donation is a selfless act that can save lives and bring hope to those in critical need.
          Just a single donation can help multiple patients recover from surgery, trauma, or serious medical conditions.
          By donating blood, you're not only giving someone a second chance at life — you're also contributing to a healthier, more connected community.
        </p>
      </section>

      {/* Emergency Requests Section - NOW FROM DATABASE */}
      <section className="px-6 py-12 bg-red-50 text-red-900 max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">⛑️ Emergency Requests</h2>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading emergency requests...</p>
          </div>
        ) : emergencyRequests.length === 0 ? (
          <p className="text-center py-8 bg-white rounded-lg shadow">No emergency requests at the moment.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {emergencyRequests.map((req, index) => (
              <div key={index} className="border p-4 rounded shadow-sm bg-white hover:shadow-md transition">
                <h3 className="text-lg font-semibold">{req.patient} ({req.bloodGroup})</h3>
                <p><strong>Hospital:</strong> {req.hospital}</p>
                <p><strong>Reason:</strong> {req.reason}</p>
                <p><strong>Needed By:</strong> {req.neededBy}</p>
                <p><strong>Contact:</strong> {req.contact}</p>
                <p><strong>Units Needed:</strong> {req.unitsNeeded}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Donate CTA Section - Keep as is */}
      <section className="flex flex-col items-center px-6 py-12 text-center">
        <h1 className="text-3xl font-bold mb-6 text-black">Ready to make a difference?</h1>
        <div className="flex flex-wrap justify-center gap-6">
          <Link to="/register">
            <button className="text-lg font-semibold px-8 py-4 rounded-lg bg-red-600 text-white hover:bg-red-700 transition">
              Donate Now
            </button>
          </Link>
        </div>
      </section>

      {/* About Us Section - Keep as is */}
      <section id="about" className="px-6 py-12 mb-10 bg-[#fff8f8] text-[#1c0d0d] text-left max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold mb-4">About Us</h2>
        <p className="text-lg leading-relaxed">
          Lifeblood Connect is a student-focused blood donation platform designed to streamline the process of blood collection from college campuses. 
          Colleges act as nodal centers where students can register as potential donors, making it easier for hospitals and blood banks to identify and reach out to eligible individuals during times of need. 
          Our mission is to bridge the gap between young, healthy donors and critical blood requirements through organized, college-based facilitation.
        </p>
      </section>

      {/* Contact Section - Keep as is */}
      <section id="contact" className="px-6 py-12 mb-10 bg-[#fbeeee] text-[#1c0d0d] text-left max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold mb-4">Contact Us</h2>
        <p className="mb-2">Email: lifeblood@example.com</p>
        <p className="mb-2">Phone: +91 98765 43210</p>
        <p>Address: TKM College Of Engineering, Kollam</p>
      </section>
    </>
  );
};

export default Home;
