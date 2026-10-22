import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import '../app/globals.css'
import '../app/motion.css'
import Header from '../app/components/Header'
import Footer from '../app/components/Footer'
import Home from '../app/page'
import AboutPage from '../app/about/page'
import BookingPage from '../app/booking/page'
import CheckoutPage from '../app/checkout/page'
import ContactPage from '../app/contact/page'
import HairExtensionsPage from '../app/hair-extensions/page'
import PaymentResult from '../app/payment-result/page'
import PrivacyPage from '../app/privacy/page'
import ProductsPage from '../app/products/page'
import ReviewsPage from '../app/reviews/page'
import ServicesPage from '../app/services/page'
import LocationOverviewPage from '../app/locations/page'
import HaatsoPage from '../app/locations/haatso/page'
import AtomicPage from '../app/locations/atomic/page'
import LegonPage from '../app/locations/legon/page'
import MadinaPage from '../app/locations/madina/page'
import SitemapPage from '../app/sitemap/page'
import TermsPage from '../app/terms/page'
import NotFound from '../app/not-found'
import AdminLayout from '../app/admin/layout'
import AdminAuditLogsPage from '../app/admin/audit-logs/page'
import AdminCatalogPage from '../app/admin/catalog/page'
import AdminDashboard from '../app/admin/dashboard/page'
import ForgotPasswordPage from '../app/admin/forgot-password/page'
import AdminLogin from '../app/admin/login/page'
import AdminProductOrdersPage from '../app/admin/product-orders/page'
import ResetPasswordPage from '../app/admin/reset-password/page'
import { apiFetch } from '../lib/api-client'
import { PageSEO } from './seo'
import { MotionEnhancer } from './motion'

function PageShell() {
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  useEffect(() => {
    if (isAdmin) {
      apiFetch('/api/csrf').catch(() => {})
    }
  }, [isAdmin])

  const routes = (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/home" element={<Home />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/booking" element={<BookingPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/cart" element={<CheckoutPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/hair-extensions" element={<HairExtensionsPage />} />
      <Route path="/payment-result" element={<PaymentResult />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/reviews" element={<ReviewsPage />} />
      <Route path="/services" element={<ServicesPage />} />
      <Route path="/locations" element={<LocationOverviewPage />} />
      <Route path="/locations/haatso" element={<HaatsoPage />} />
      <Route path="/locations/atomic" element={<AtomicPage />} />
      <Route path="/locations/legon" element={<LegonPage />} />
      <Route path="/locations/madina" element={<MadinaPage />} />
      <Route path="/sitemap" element={<SitemapPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
      <Route path="/admin/catalog" element={<AdminCatalogPage />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/product-orders" element={<AdminProductOrdersPage />} />
      <Route path="/admin/reset-password" element={<ResetPasswordPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )

  if (isAdmin) {
    return <AdminLayout>{routes}</AdminLayout>
  }

  return (
    <>
      <Header />
      <PageSEO />
      <MotionEnhancer path={location.pathname} />
      <main className="min-h-screen">{routes}</main>
      <Footer />
    </>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <PageShell />
    </BrowserRouter>
  </StrictMode>
)
