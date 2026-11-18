import { Routes, Route } from "react-router-dom"
import { Toaster } from "./components/ui/toaster"
import { ToastContainer } from "react-toastify"
import HomePage from "./pages/HomePage"
import AboutPage from "./pages/AboutPage"
import ExhibitionsPage from "./pages/ExhibitionsPage"
import EventsPage from "./pages/EventsPage"
import ServicesPage from "./pages/ServicesPage"
import ContactPage from "./pages/ContactPage"
import TicketsPage from "./pages/TicketsPage"
import MyTicketsPage from "./pages/MyTicketsPage"
//import TicketDetailsPage from "./pages/TicketDetailsPage"
import SignInPage from "./pages/SignInPage"
import SignUpPage from "./pages/SignUpPage"
import AdvertisementPage from "./pages/AdvertisementPage"
import EventTicketsPage from "./pages/EventTicketsPage"
import ConfirmationPage from "./pages/ConfirmationPage"
import EventConfirmationPage from "./pages/EventConfirmationPage"
import ForgotPasswordPage from "./pages/ForgotPasswordPage"
import ResetPasswordPage from "./pages/ResetPasswordPage"
import ServiceConfirmationPage from "./pages/ServiceConfirmationPage"
import VisitorFeedbackpage from "./pages/visitorfeedbackpage"
import NewsPage from "./pages/NewsPage"
import NewsDetail from "./pages/NewsDetail"
function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<HomePage />} />
        
        <Route path="/about" element={<AboutPage />} />
        <Route path="/exhibitions" element={<ExhibitionsPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/:id/tickets" element={<EventTicketsPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/tickets" element={<TicketsPage />} />
        <Route path="/my-tickets" element={<MyTicketsPage />} />
        {/* <Route path="/my-tickets/:id" element={<TicketDetailsPage />} /> */}
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />}/>
        <Route path="/advertisements/:id" element={<AdvertisementPage />} />
        <Route path="/confirmation/:tx_ref" element={<ConfirmationPage />} />
        <Route path="/eventConfirmation/:tx_ref" element={<EventConfirmationPage />} />
        {/* New route for service confirmation */}
        <Route path="/serviceConfirmation/:tx_ref" element={<ServiceConfirmationPage />} />
        <Route path="/visitor-feedback" element={<VisitorFeedbackpage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/news/:id" element={<NewsDetail />} />
        
  
      </Routes>
       <Toaster />
      <ToastContainer position="top-right" autoClose={5000} />
    </div>
  )
}

export default App
