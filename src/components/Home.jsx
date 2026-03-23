import React, { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaUniversity, FaCalendarAlt, FaMapMarkerAlt, FaTimes, FaUser, FaPhone, FaClipboardList } from 'react-icons/fa';

const Home = () => {
  const [emergencyRequests, setEmergencyRequests] = useState([]);
  const [upcomingDrives, setUpcomingDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drivesLoading, setDrivesLoading] = useState(true);
  const [selectedDrive, setSelectedDrive] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const location = useLocation();
  const tickerRef = useRef(null);

  // Reviews state
  const [reviews, setReviews] = useState([
    {
      name: "Roshini",
      role: "Donor",
      rating: 5,
      message: "Amazing platform! Very easy to donate blood."
    }
  ]);

  const [form, setForm] = useState({
    name: "",
    role: "Donor",
    rating: 5,
    message: ""
  });

  useEffect(() => {
    fetchEmergencyRequests();
    fetchUpcomingDrives();
  }, []);

  useEffect(() => {
    if (location.state?.scrollTo) {
      const target = document.getElementById(location.state.scrollTo);
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [location]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (e.target.classList.contains('modal-overlay')) {
        setShowModal(false);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showModal]);

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
      setEmergencyRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUpcomingDrives = async () => {
    try {
      setDrivesLoading(true);
      const response = await axios.get('http://localhost:5000/api/college-admin/public-drives');
      
      if (response.data.success) {
        setUpcomingDrives(response.data.drives || []);
      }
    } catch (error) {
      console.error('Error fetching upcoming drives:', error);
      setUpcomingDrives([]);
    } finally {
      setDrivesLoading(false);
    }
  };

  const handleDriveClick = (drive) => {
    setSelectedDrive(drive);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedDrive(null);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-IN', options);
  };

  const formatDateTime = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-IN', options);
  };

  const calculateTimeLeft = (driveDate) => {
    const now = new Date();
    const driveDateTime = new Date(driveDate);
    const diffTime = driveDateTime - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays < 0) return "Passed";
    return `${diffDays} days left`;
  };

  const handleReviewSubmit = (e) => {
    e.preventDefault();

    if (!form.name || !form.message) {
      toast.error("Please fill all fields");
      return;
    }

    setReviews([...reviews, form]);

    setForm({
      name: "",
      role: "Donor",
      rating: 5,
      message: ""
    });

    toast.success("Review submitted successfully!");
  };

  return (
    <>
      {/* Running Drives Ticker - Shows below header */}
      {!drivesLoading && upcomingDrives.length > 0 && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-3 overflow-hidden cursor-pointer">
          <div className="relative">
            {/* Gradient overlays for smooth edges */}
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-blue-600 to-transparent z-10"></div>
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-blue-600 to-transparent z-10"></div>
            
            {/* Ticker container */}
            <div className="overflow-hidden">
              <div 
                ref={tickerRef}
                className="whitespace-nowrap animate-smooth-marquee"
                style={{ display: 'inline-block' }}
              >
                {/* Live Badge */}
                <span className="inline-flex items-center bg-yellow-400 text-blue-900 px-3 py-1 rounded-full font-bold text-sm mx-4">
                  LIVE
                </span>
                
                {/* Drive items - Clickable */}
                {upcomingDrives.map((drive, index) => (
                  <button
                    key={drive.id}
                    onClick={() => handleDriveClick(drive)}
                    className="inline-flex items-center gap-3 mx-4 hover:text-yellow-300 transition group focus:outline-none"
                  >
                    <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                    <span className="font-semibold">{drive.driveName}</span>
                    <span className="text-blue-200 text-sm flex items-center gap-1">
                      <FaCalendarAlt className="text-xs" />
                      {formatDate(drive.driveDate)}
                    </span>
                    <span className="text-blue-200 text-sm flex items-center gap-1">
                      <FaMapMarkerAlt className="text-xs" />
                      {drive.location}
                    </span>
                    <span className="bg-yellow-500 text-blue-900 text-xs px-2 py-0.5 rounded-full font-bold">
                      {calculateTimeLeft(drive.driveDate)}
                    </span>
                  </button>
                ))}
                
                {/* Duplicate for seamless loop */}
                <span className="inline-flex items-center bg-yellow-400 text-blue-900 px-3 py-1 rounded-full font-bold text-sm mx-4">
                  LIVE
                </span>
                {upcomingDrives.map((drive, index) => (
                  <button
                    key={`dup-${drive.id}`}
                    onClick={() => handleDriveClick(drive)}
                    className="inline-flex items-center gap-3 mx-4 hover:text-yellow-300 transition group focus:outline-none"
                  >
                    <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                    <span className="font-semibold">{drive.driveName}</span>
                    <span className="text-blue-200 text-sm flex items-center gap-1">
                      <FaCalendarAlt className="text-xs" />
                      {formatDate(drive.driveDate)}
                    </span>
                    <span className="text-blue-200 text-sm flex items-center gap-1">
                      <FaMapMarkerAlt className="text-xs" />
                      {drive.location}
                    </span>
                    <span className="bg-yellow-500 text-blue-900 text-xs px-2 py-0.5 rounded-full font-bold">
                      {calculateTimeLeft(drive.driveDate)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add animation styles */}
      <style jsx>{`
        @keyframes smoothMarquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-smooth-marquee {
          animation: smoothMarquee 40s linear infinite;
        }
        .animate-smooth-marquee:hover {
          animation-play-state: paused;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>

      {/* Drive Details Modal */}
      {showModal && selectedDrive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fadeIn">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-6 py-4 rounded-t-xl flex justify-between items-center">
              <h2 className="text-2xl font-bold">Drive Details</h2>
              <button
                onClick={closeModal}
                className="text-white hover:text-yellow-300 transition p-2"
              >
                <FaTimes size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Drive Name */}
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{selectedDrive.driveName}</h3>
                <div className="flex items-center gap-2 text-sm">
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
                    {selectedDrive.status || 'Upcoming'}
                  </span>
                  <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-medium">
                    {calculateTimeLeft(selectedDrive.driveDate)}
                  </span>
                </div>
              </div>

              {/* Drive Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Date & Time */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-600 mb-2">
                    <FaCalendarAlt />
                    <span className="font-semibold">Date & Time</span>
                  </div>
                  <p className="text-gray-700">{formatDate(selectedDrive.driveDate)}</p>
                  <p className="text-gray-600 text-sm mt-1">{selectedDrive.driveTime}</p>
                </div>

                {/* Location */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-600 mb-2">
                    <FaMapMarkerAlt />
                    <span className="font-semibold">Location</span>
                  </div>
                  <p className="text-gray-700">{selectedDrive.location}</p>
                </div>

                {/* Coordinator */}
                {selectedDrive.coordinatorName && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-600 mb-2">
                      <FaUser />
                      <span className="font-semibold">Coordinator</span>
                    </div>
                    <p className="text-gray-700">{selectedDrive.coordinatorName}</p>
                    {selectedDrive.coordinatorPhone && (
                      <p className="text-gray-600 text-sm mt-1 flex items-center gap-1">
                        <FaPhone className="text-xs" /> {selectedDrive.coordinatorPhone}
                      </p>
                    )}
                  </div>
                )}

                {/* Target Donors */}
                {selectedDrive.targetDonors && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-600 mb-2">
                      <FaClipboardList />
                      <span className="font-semibold">Target Donors</span>
                    </div>
                    <p className="text-gray-700">{selectedDrive.targetDonors} donors</p>
                  </div>
                )}
              </div>

              {/* Facilities */}
              {selectedDrive.facilities && selectedDrive.facilities.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-600 mb-3">Facilities Available</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedDrive.facilities.map((facility, idx) => (
                      <span key={idx} className="bg-white text-blue-600 px-3 py-1 rounded-full text-sm border border-blue-200">
                        {facility === 'bp' ? 'BP Check' :
                         facility === 'hb' ? 'Hemoglobin Test' :
                         facility === 'refreshments' ? 'Refreshments' :
                         facility === 'certificate' ? 'Certificate' :
                         facility === 'transport' ? 'Transport' :
                         facility === 'medical' ? 'Medical Team' : facility}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Blood Groups Needed */}
              {selectedDrive.bloodGroupsNeeded && selectedDrive.bloodGroupsNeeded.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-600 mb-3">Blood Groups Needed</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedDrive.bloodGroupsNeeded.map((bg, idx) => (
                      <span key={idx} className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-bold border border-red-200">
                        {bg}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {selectedDrive.description && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-600 mb-2">Description</h4>
                  <p className="text-gray-700">{selectedDrive.description}</p>
                </div>
              )}

              {/* Organized By */}
              {selectedDrive.organizedBy && (
                <p className="text-sm text-gray-500 text-right">
                  Organized by: {selectedDrive.organizedBy}
                </p>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t px-6 py-4 flex justify-end">
              <button
                onClick={closeModal}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
          
          {/* Button Container */}
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <Link to="/learn-more">
              <button className="bg-white text-red-700 font-bold px-8 py-3 rounded-lg border border-red-700 hover:bg-red-700 hover:text-white transition shadow-lg">
                Learn More
              </button>
            </Link>
            
            <Link to="/register">
              <button className="bg-red-600 text-white font-bold px-8 py-3 rounded-lg border border-red-600 hover:bg-red-700 hover:border-red-700 transition shadow-lg">
                Register as Donor
              </button>
            </Link>
            
            {/* College Admin Registration Button */}
            <Link to="/college-admin/register">
              <button className="bg-blue-600 text-white font-bold px-8 py-3 rounded-lg border border-blue-600 hover:bg-blue-700 hover:border-blue-700 transition shadow-lg flex items-center gap-2">
                <FaUniversity /> Register College
              </button>
            </Link>
          </div>
          
          {/* Quick Links for Existing Users */}
          <div className="mt-6 text-sm">
            <span className="text-white/80">Already have an account? </span>
            <Link to="/login" className="text-white font-semibold hover:underline">
              Login
            </Link>
            <span className="text-white/80 mx-2">|</span>
            <Link to="/admin-registration" className="text-white font-semibold hover:underline">
              Register Hospital
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-red-600">500+</div>
              <div className="text-gray-600">Lives Saved</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-red-600">200+</div>
              <div className="text-gray-600">Active Donors</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-red-600">50+</div>
              <div className="text-gray-600">Partner Colleges</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-red-600">24/7</div>
              <div className="text-gray-600">Emergency Support</div>
            </div>
          </div>
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
          <Link to="/college-admin/register">
            <button className="text-lg font-semibold px-8 py-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition flex items-center gap-2">
              <FaUniversity /> Register Your College
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

      {/* Review Section */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-red-600 mb-10">
            ⭐ What People Say About Us
          </h2>

          <form
            onSubmit={handleReviewSubmit}
            className="bg-red-50 p-6 rounded-xl shadow-md mb-10"
          >
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                placeholder="Your Name"
                className="p-3 rounded-lg border"
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
              />

              <select
                className="p-3 rounded-lg border"
                value={form.role}
                onChange={(e) =>
                  setForm({ ...form, role: e.target.value })
                }
              >
                <option>Donor</option>
                <option>Recipient</option>
                <option>Admin</option>
              </select>
            </div>

            <textarea
              placeholder="Write your review..."
              className="w-full p-3 rounded-lg border mb-4"
              rows="3"
              value={form.message}
              onChange={(e) =>
                setForm({ ...form, message: e.target.value })
              }
            />

            <div className="flex items-center gap-4 mb-4">
              <label className="font-medium">Rating:</label>
              <select
                value={form.rating}
                onChange={(e) =>
                  setForm({ ...form, rating: Number(e.target.value) })
                }
                className="p-2 rounded border"
              >
                {[1, 2, 3, 4, 5].map((num) => (
                  <option key={num} value={num}>
                    {num} Star
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition"
            >
              Submit Review
            </button>
          </form>

          <div className="space-y-6">
            {reviews.map((rev, index) => (
              <div key={index} className="bg-white p-5 rounded-xl shadow-md">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-lg">{rev.name}</h3>
                  <span className="text-sm bg-red-100 text-red-700 px-2 py-1 rounded-full">
                    {rev.role}
                  </span>
                </div>

                <div className="text-yellow-500 mb-2">
                  {"⭐".repeat(rev.rating)}
                </div>

                <p className="text-gray-600">{rev.message}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;