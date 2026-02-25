import { useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from 'axios';
import { toast } from 'react-toastify';

const Home = () => {
  const [emergencyRequests, setEmergencyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    fetchEmergencyRequests();
  }, []);

  useEffect(() => {
    if (location.state?.scrollTo) {
      const target = document.getElementById(location.state.scrollTo);
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [location]);

  const fetchEmergencyRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/blood-requests/emergency');
      
      if (response.data.success) {
        setEmergencyRequests(response.data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching emergency requests:', error);
      toast.error('Failed to load emergency requests');
      setEmergencyRequests([]); // Set empty array on error
    } finally {
      setLoading(false); // ALWAYS set loading to false
    }
  };

  return (
    <>
      {/* Hero Section */}
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

      {/* Why Donate Section */}
      <section className="flex flex-col px-6 py-12 text-left text-black max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Why Donate?</h1>
        <p className="text-lg leading-relaxed">
          Donation is a selfless act that can save lives and bring hope to those in critical need.
          Just a single donation can help multiple patients recover from surgery, trauma, or serious medical conditions.
          By donating blood, you're not only giving someone a second chance at life — you're also contributing to a healthier, more connected community.
        </p>
      </section>

      {/* Emergency Requests Section */}
      <section className="px-6 py-12 bg-red-50 text-red-900 max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">⛑️ Emergency Requests</h2>
        
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          </div>
        ) : emergencyRequests.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-sm text-center">
            <p className="text-gray-500">No emergency requests at the moment.</p>
            <p className="text-sm text-gray-400 mt-2">Check back later or register as a donor to help.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {emergencyRequests.map((req, index) => (
              <div key={index} className="border-l-4 border-red-600 p-4 rounded shadow-sm bg-white hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold">
                    {req.patient} ({req.bloodGroup})
                  </h3>
                  <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs font-bold">
                    EMERGENCY
                  </span>
                </div>
                <p className="mt-2"><strong>Hospital:</strong> {req.hospital}</p>
                <p><strong>Reason:</strong> {req.reason}</p>
                <p><strong>Needed By:</strong> {req.neededBy}</p>
                <p><strong>Contact:</strong> {req.contact}</p>
                <p><strong>Units Needed:</strong> {req.unitsNeeded}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Donate CTA Section */}
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

      {/* About Us Section */}
      <section id="about" className="px-6 py-12 mb-10 bg-[#fff8f8] text-[#1c0d0d] text-left max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold mb-4">About Us</h2>
        <p className="text-lg leading-relaxed">
          Lifeblood Connect is a student-focused blood donation platform designed to streamline the process of blood collection from college campuses. 
          Colleges act as nodal centers where students can register as potential donors, making it easier for hospitals and blood banks to identify and reach out to eligible individuals during times of need. 
          Our mission is to bridge the gap between young, healthy donors and critical blood requirements through organized, college-based facilitation.
        </p>
      </section>

      {/* Contact Section */}
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