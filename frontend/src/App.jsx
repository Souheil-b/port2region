import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "react-hot-toast"
import Navbar from "./components/Navbar.jsx"
import PremiumToggle from "./components/PremiumToggle.jsx"
import ChatBot from "./components/ChatBot.jsx"
import RouteGuard from "./components/RouteGuard.jsx"
import RoleSelect from "./pages/RoleSelect.jsx"
import Home from "./pages/Home.jsx"
import SMERegister from "./pages/SMERegister.jsx"
import PMEAuth from "./pages/PMEAuth.jsx"
import SMEDashboard from "./pages/SMEDashboard.jsx"
import SMEList from "./pages/SMEList.jsx"
import SMEProfile from "./pages/SMEProfile.jsx"
import NeedPublish from "./pages/NeedPublish.jsx"
import NeedList from "./pages/NeedList.jsx"
import NeedDetail from "./pages/NeedDetail.jsx"

import InvestorDashboard from "./pages/InvestorDashboard.jsx"
import MarketDashboard from "./pages/MarketDashboard.jsx"
import PropTypes from "prop-types"

function Layout({ children }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f8fafc" }}>
      <Navbar />
      <main>{children}</main>
      <PremiumToggle />
    </div>
  )
}

Layout.propTypes = { children: PropTypes.node.isRequired }

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <ChatBot />
      <Routes>
        <Route path="/" element={<RoleSelect />} />
        <Route path="/role-select" element={<RoleSelect />} />
        <Route path="/home" element={<Layout><Home /></Layout>} />
        <Route path="/pme-auth" element={<PMEAuth />} />

        {/* PME-only */}
        <Route path="/smes-dashboard" element={
          <RouteGuard allowedRoles={["pme"]}>
            <Layout><SMEDashboard /></Layout>
          </RouteGuard>
        } />

        {/* Port-only */}
        <Route path="/needs/publish" element={
          <RouteGuard allowedRoles={["port"]}>
            <Layout><NeedPublish /></Layout>
          </RouteGuard>
        } />

        {/* Investor-only */}
        <Route path="/dashboard" element={
          <RouteGuard allowedRoles={["investisseur"]}>
            <Layout><InvestorDashboard /></Layout>
          </RouteGuard>
        } />
        <Route path="/dashboard/market" element={
          <RouteGuard allowedRoles={["investisseur"]}>
            <Layout><MarketDashboard /></Layout>
          </RouteGuard>
        } />

        {/* Shared — all authenticated roles */}
        <Route path="/smes" element={
          <RouteGuard allowedRoles={["pme", "port", "investisseur"]}>
            <Layout><SMEList /></Layout>
          </RouteGuard>
        } />
        <Route path="/smes/:sme_id" element={
          <RouteGuard allowedRoles={["pme", "port", "investisseur"]}>
            <Layout><SMEProfile /></Layout>
          </RouteGuard>
        } />
        <Route path="/needs" element={
          <RouteGuard allowedRoles={["pme", "port", "investisseur"]}>
            <Layout><NeedList /></Layout>
          </RouteGuard>
        } />
        <Route path="/needs/:need_id" element={
          <RouteGuard allowedRoles={["pme", "port", "investisseur"]}>
            <Layout><NeedDetail /></Layout>
          </RouteGuard>
        } />
        {/* /matching removed — matching is in NeedDetail (Port) and SMEDashboard premium (PME) */}
        <Route path="/register" element={
          <RouteGuard allowedRoles={["pme", "port"]}>
            <Layout><SMERegister /></Layout>
          </RouteGuard>
        } />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
