import { useState, useEffect } from "react";
import {
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaBan,
  FaSearch,
  FaShield,
  FaAlertTriangle,
  FaChartLine,
  FaFileAlt,
} from "react-icons/fa";
import { toast } from "react-toastify";
import StripeVerificationPanel from "../../component/admin/StripeVerificationPanel";

const OrganizerVerificationSystemEnhanced = () => {
  const [organizers, setOrganizers] = useState([]);
  const [selectedOrganizer, setSelectedOrganizer] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRiskLevel, setFilterRiskLevel] = useState("all");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(null); // null | 'stripe' | 'fraud'
  const [fraudAnalysis, setFraudAnalysis] = useState(null);
  const [stripeInfo, setStripeInfo] = useState(null);

  // API Endpoints
  const API_BASE = "http://localhost:8081/api/v1";

  // Fetch organizers list
  useEffect(() => {
    fetchOrganizers();
  }, []);

  const fetchOrganizers = async () => {
    try {
      setLoading(true);
      // In real implementation, fetch from backend
      // For now, use mock data
      const mockData = [
        {
          id: 1,
          name: "Lagos Events Pro",
          email: "contact@lagosevents.com",
          location: "Lagos, Nigeria",
          verificationStatus: "STRIPE_VERIFIED",
          fraudRiskLevel: "LOW",
          fraudFlags: [],
          verifiedAt: "2024-01-15T10:00:00",
          verifiedByAdminId: null,
          verificationNotes: "",
          lastFraudCheckAt: "2024-01-15T10:00:00",
          stripeAccountId: "acct_test123",
        },
        {
          id: 2,
          name: "Nairobi Music Collective",
          email: "info@nairobimusic.ke",
          location: "Nairobi, Kenya",
          verificationStatus: "PENDING",
          fraudRiskLevel: "MEDIUM",
          fraudFlags: ["VERY_NEW_ACCOUNT", "MINIMAL_PROFILE"],
          verifiedAt: null,
          verifiedByAdminId: null,
          verificationNotes: "",
          lastFraudCheckAt: "2024-01-14T15:30:00",
          stripeAccountId: "acct_test456",
        },
        {
          id: 3,
          name: "Cape Town Events",
          email: "info@capetownev.co.za",
          location: "Cape Town, South Africa",
          verificationStatus: "ADMIN_REJECTED",
          fraudRiskLevel: "HIGH",
          fraudFlags: ["SUSPICIOUS_EMAIL", "HIGH_RISK_COUNTRY"],
          verifiedAt: "2024-01-10T09:00:00",
          verifiedByAdminId: 1,
          verificationNotes: "Rejected due to suspicious email pattern",
          lastFraudCheckAt: "2024-01-10T08:45:00",
          stripeAccountId: "acct_test789",
        },
      ];
      setOrganizers(mockData);
    } catch (error) {
      console.error("Error fetching organizers:", error);
      toast.error("Failed to load organizers");
    } finally {
      setLoading(false);
    }
  };

  const fetchFraudAnalysis = async (organizerId) => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE}/admin/verification/organizer/${organizerId}/fraud-check`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Admin-Id": "1", // In real app, from auth context
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch fraud analysis");
      const data = await response.json();
      setFraudAnalysis(data);
      setActiveTab("fraud");
    } catch (error) {
      console.error("Error fetching fraud analysis:", error);
      toast.error("Failed to load fraud analysis");
    } finally {
      setLoading(false);
    }
  };

  const fetchStripeInfo = async (organizerId) => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE}/admin/verification/organizer/${organizerId}/stripe-info`,
        {
          headers: { "X-Admin-Id": "1" },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch Stripe info");
      const data = await response.json();
      setStripeInfo(data);
      setActiveTab("stripe");
    } catch (error) {
      console.error("Error fetching Stripe info:", error);
      toast.error("Failed to load Stripe verification data");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (organizerId) => {
    try {
      const notes = prompt(
        "Enter approval notes (optional):",
        "Verified via admin review"
      );
      if (notes === null) return;

      const response = await fetch(
        `${API_BASE}/admin/verification/organizer/${organizerId}/approve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Admin-Id": "1",
          },
          body: JSON.stringify({ notes }),
        }
      );

      if (response.ok) {
        toast.success("Organizer approved successfully");
        // Update local state
        setOrganizers(
          organizers.map((org) =>
            org.id === organizerId
              ? { ...org, verificationStatus: "ADMIN_APPROVED" }
              : org
          )
        );
      } else {
        toast.error("Failed to approve organizer");
      }
    } catch (error) {
      console.error("Error approving organizer:", error);
      toast.error("Error approving organizer");
    }
  };

  const handleReject = async (organizerId) => {
    try {
      const reason = prompt("Enter rejection reason:", "Failed verification");
      if (reason === null) return;

      const response = await fetch(
        `${API_BASE}/admin/verification/organizer/${organizerId}/reject`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Admin-Id": "1",
          },
          body: JSON.stringify({ reason }),
        }
      );

      if (response.ok) {
        toast.success("Organizer rejected");
        setOrganizers(
          organizers.map((org) =>
            org.id === organizerId
              ? { ...org, verificationStatus: "ADMIN_REJECTED" }
              : org
          )
        );
      } else {
        toast.error("Failed to reject organizer");
      }
    } catch (error) {
      console.error("Error rejecting organizer:", error);
      toast.error("Error rejecting organizer");
    }
  };

  const handleSuspend = async (organizerId, suspend) => {
    try {
      const reason = prompt(
        `Enter ${suspend ? "suspension" : "unsuspension"} reason:`,
        "Policy violation"
      );
      if (reason === null) return;

      const endpoint = suspend
        ? `${API_BASE}/admin/verification/organizer/${organizerId}/suspend`
        : `${API_BASE}/admin/verification/organizer/${organizerId}/approve`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Id": "1",
        },
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        toast.success(
          suspend ? "Organizer suspended" : "Organizer unsuspended"
        );
        setOrganizers(
          organizers.map((org) =>
            org.id === organizerId
              ? {
                  ...org,
                  verificationStatus: suspend ? "SUSPENDED" : "ADMIN_APPROVED",
                }
              : org
          )
        );
      }
    } catch (error) {
      console.error("Error updating suspension:", error);
      toast.error("Error updating organizer status");
    }
  };

  // Filters
  const filteredOrganizers = organizers.filter((org) => {
    const matchesSearch =
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || org.verificationStatus === filterStatus;
    const matchesRisk = filterRiskLevel === "all" || org.fraudRiskLevel === filterRiskLevel;
    return matchesSearch && matchesStatus && matchesRisk;
  });

  const getRiskColor = (level) => {
    switch (level) {
      case "LOW":
        return "text-green-500 bg-green-500/10";
      case "MEDIUM":
        return "text-yellow-500 bg-yellow-500/10";
      case "HIGH":
        return "text-orange-500 bg-orange-500/10";
      case "CRITICAL":
        return "text-red-500 bg-red-500/10";
      default:
        return "text-zinc-400 bg-zinc-500/10";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "ADMIN_APPROVED":
        return <FaCheckCircle className="text-green-500" />;
      case "PENDING":
      case "STRIPE_VERIFIED":
        return <FaClock className="text-yellow-500" />;
      case "ADMIN_REJECTED":
      case "SUSPENDED":
        return <FaTimesCircle className="text-red-500" />;
      default:
        return <FaShield className="text-blue-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4">
      <div className="max-w-full">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <FaShield className="text-blue-500" /> Organizer Verification System
          </h1>
          <p className="text-zinc-400">
            Manage organizer verification, fraud detection, and approval workflows
          </p>
        </div>

        {/* Controls */}
        <div className="bg-zinc-900 border border-zinc-800 rounded p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm text-zinc-400 block mb-2">
                Search
              </label>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-zinc-100 placeholder-zinc-500"
              />
            </div>

            <div>
              <label className="text-sm text-zinc-400 block mb-2">
                Verification Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-zinc-100"
              >
                <option value="all">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="STRIPE_VERIFIED">Stripe Verified</option>
                <option value="ADMIN_APPROVED">Approved</option>
                <option value="ADMIN_REJECTED">Rejected</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-zinc-400 block mb-2">
                Fraud Risk Level
              </label>
              <select
                value={filterRiskLevel}
                onChange={(e) => setFilterRiskLevel(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-zinc-100"
              >
                <option value="all">All Levels</option>
                <option value="LOW">Low Risk</option>
                <option value="MEDIUM">Medium Risk</option>
                <option value="HIGH">High Risk</option>
                <option value="CRITICAL">Critical Risk</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={fetchOrganizers}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 text-white px-4 py-2 rounded font-medium"
              >
                {loading ? "Loading..." : "Refresh"}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Organizers List */}
          <div className="lg:col-span-2">
            <div className="bg-zinc-900 border border-zinc-800 rounded overflow-hidden">
              <div className="bg-zinc-800 px-4 py-3 border-b border-zinc-700">
                <h2 className="font-bold flex items-center gap-2">
                  <FaChartLine /> Organizers ({filteredOrganizers.length})
                </h2>
              </div>

              <div className="divide-y divide-zinc-800">
                {filteredOrganizers.length > 0 ? (
                  filteredOrganizers.map((org) => (
                    <div
                      key={org.id}
                      className={`p-4 hover:bg-zinc-800/50 cursor-pointer transition ${
                        selectedOrganizer?.id === org.id
                          ? "bg-zinc-800"
                          : ""
                      }`}
                      onClick={() => setSelectedOrganizer(org)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {getStatusIcon(org.verificationStatus)}
                            <h3 className="font-bold text-white">{org.name}</h3>
                          </div>
                          <p className="text-sm text-zinc-400">{org.email}</p>
                          <p className="text-xs text-zinc-500">{org.location}</p>
                        </div>

                        <div className="text-right">
                          <div
                            className={`inline-block px-2 py-1 rounded text-xs font-bold ${getRiskColor(
                              org.fraudRiskLevel
                            )}`}
                          >
                            {org.fraudRiskLevel}
                          </div>
                        </div>
                      </div>

                      {/* Status and Actions */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-700">
                        <div className="text-xs text-zinc-400">
                          <span className="bg-zinc-800 px-2 py-1 rounded">
                            {org.verificationStatus}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          {org.verificationStatus === "STRIPE_VERIFIED" ||
                          org.verificationStatus === "PENDING" ? (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApprove(org.id);
                                }}
                                className="bg-green-700 hover:bg-green-600 text-white px-2 py-1 text-xs rounded font-medium"
                              >
                                Approve
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReject(org.id);
                                }}
                                className="bg-red-700 hover:bg-red-600 text-white px-2 py-1 text-xs rounded font-medium"
                              >
                                Reject
                              </button>
                            </>
                          ) : null}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSuspend(
                                org.id,
                                org.verificationStatus !==
                                  "SUSPENDED"
                              );
                            }}
                            className={`${
                              org.verificationStatus === "SUSPENDED"
                                ? "bg-blue-700 hover:bg-blue-600"
                                : "bg-zinc-700 hover:bg-zinc-600"
                            } text-white px-2 py-1 text-xs rounded font-medium`}
                          >
                            {org.verificationStatus === "SUSPENDED"
                              ? "Unsuspend"
                              : "Suspend"}
                          </button>
                        </div>
                      </div>

                      {/* Fraud Flags */}
                      {org.fraudFlags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {org.fraudFlags.slice(0, 3).map((flag, idx) => (
                            <span
                              key={idx}
                              className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded"
                            >
                              {flag}
                            </span>
                          ))}
                          {org.fraudFlags.length > 3 && (
                            <span className="text-xs bg-zinc-700 text-zinc-300 px-2 py-0.5 rounded">
                              +{org.fraudFlags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-zinc-500">
                    No organizers found matching your filters
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Detail Panel */}
          <div className="lg:col-span-1">
            {selectedOrganizer ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded overflow-hidden">
                <div className="bg-zinc-800 px-4 py-3 border-b border-zinc-700">
                  <h3 className="font-bold flex items-center gap-2">
                    <FaFileAlt /> Details
                  </h3>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-zinc-800">
                  <button
                    onClick={() => setActiveTab(null)}
                    className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition ${
                      activeTab === null
                        ? "border-blue-500 text-blue-400"
                        : "border-transparent text-zinc-400"
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => fetchStripeInfo(selectedOrganizer.id)}
                    className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition ${
                      activeTab === "stripe"
                        ? "border-blue-500 text-blue-400"
                        : "border-transparent text-zinc-400"
                    }`}
                  >
                    Stripe KYC
                  </button>
                  <button
                    onClick={() => fetchFraudAnalysis(selectedOrganizer.id)}
                    className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition ${
                      activeTab === "fraud"
                        ? "border-blue-500 text-blue-400"
                        : "border-transparent text-zinc-400"
                    }`}
                  >
                    <FaAlertTriangle className="inline mr-1" /> Fraud
                  </button>
                </div>

                {/* Tab Content */}
                <div className="p-4 max-h-96 overflow-y-auto">
                  {activeTab === null && (
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-zinc-500 mb-1">
                          Name
                        </p>
                        <p className="text-sm font-medium">
                          {selectedOrganizer.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 mb-1">Email</p>
                        <p className="text-sm font-medium">
                          {selectedOrganizer.email}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 mb-1">Location</p>
                        <p className="text-sm font-medium">
                          {selectedOrganizer.location}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 mb-1">
                          Verification Status
                        </p>
                        <p className="text-sm font-medium">
                          {selectedOrganizer.verificationStatus}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 mb-1">
                          Fraud Risk Level
                        </p>
                        <p
                          className={`text-sm font-medium ${getRiskColor(
                            selectedOrganizer.fraudRiskLevel
                          )}`}
                        >
                          {selectedOrganizer.fraudRiskLevel}
                        </p>
                      </div>
                      {selectedOrganizer.verificationNotes && (
                        <div>
                          <p className="text-xs text-zinc-500 mb-1">Notes</p>
                          <p className="text-sm bg-zinc-800 p-2 rounded">
                            {selectedOrganizer.verificationNotes}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "stripe" && stripeInfo && (
                    <StripeVerificationPanel data={stripeInfo} />
                  )}

                  {activeTab === "stripe" && !stripeInfo && !loading && (
                    <div className="text-center py-4 text-zinc-500">
                      Click "Fetch Data" to load Stripe information
                    </div>
                  )}

                  {activeTab === "fraud" && fraudAnalysis && (
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-zinc-500 mb-1">Risk Level</p>
                        <p
                          className={`inline-block px-3 py-1 rounded font-bold ${getRiskColor(
                            fraudAnalysis.riskLevel
                          )}`}
                        >
                          {fraudAnalysis.riskLevel}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 mb-1">
                          Risk Score
                        </p>
                        <div className="w-full bg-zinc-800 rounded h-2">
                          <div
                            className={`h-2 rounded transition ${
                              fraudAnalysis.riskScore >= 100
                                ? "bg-red-500"
                                : fraudAnalysis.riskScore >= 60
                                ? "bg-orange-500"
                                : fraudAnalysis.riskScore >= 30
                                ? "bg-yellow-500"
                                : "bg-green-500"
                            }`}
                            style={{
                              width: `${Math.min(
                                (fraudAnalysis.riskScore / 100) * 100,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                        <p className="text-xs text-zinc-400 mt-1">
                          Score: {fraudAnalysis.riskScore}/100
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 mb-2">Flags</p>
                        <div className="space-y-1">
                          {fraudAnalysis.fraudFlags.map((flag, idx) => (
                            <div
                              key={idx}
                              className="text-xs bg-yellow-500/10 text-yellow-300 p-2 rounded border border-yellow-500/20 flex items-center gap-2"
                            >
                              <FaAlertTriangle className="flex-shrink-0" />
                              {flag}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 mb-1">
                          Recommended Action
                        </p>
                        <p className="text-sm font-medium bg-zinc-800 p-2 rounded">
                          {fraudAnalysis.recommendedAction}
                        </p>
                      </div>
                    </div>
                  )}

                  {activeTab === "fraud" &&!fraudAnalysis && !loading && (
                    <div className="text-center py-4 text-zinc-500">
                      Click "Run Analysis" to perform fraud detection
                    </div>
                  )}

                  {loading && (
                    <div className="text-center py-4 text-zinc-500">
                      Loading...
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-zinc-900 border border-zinc-800 rounded p-4 text-center text-zinc-500">
                Select an organizer to view details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizerVerificationSystemEnhanced;
