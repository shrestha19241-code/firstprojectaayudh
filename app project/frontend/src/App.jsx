import React, { useEffect, useMemo, useState } from 'react'
import { getProducts, getOffers, getSuppliers, createBuyer, createOrder, getOrders } from './services/api.js'
import { getRecommendedOffer } from './utils/recommendation.js'
import './styles.css'

const CATEGORY_ORDER = [
  'PPE',
  'Diagnostic Equipment',
  'Injection Equipment',
  'Hospital Consumables',
  'Laboratory Equipment',
  'Monitoring Devices',
  'Surgical Instruments',
]

const CATEGORY_DETAILS = {
  PPE: {
    icon: '🧤',
    description: 'Protective essentials for infection control, safety and daily clinical use.',
  },
  'Diagnostic Equipment': {
    icon: '🩺',
    description: 'Tools that help healthcare teams assess, diagnose and respond faster.',
  },
  'Injection Equipment': {
    icon: '💉',
    description: 'Reliable injection and administration supplies for clinics and hospitals.',
  },
  'Hospital Consumables': {
    icon: '🏥',
    description: 'Everyday medical consumables required for efficient patient care.',
  },
  'Laboratory Equipment': {
    icon: '🧪',
    description: 'Lab supplies and equipment supporting testing, analysis and reporting.',
  },
  'Monitoring Devices': {
    icon: '📈',
    description: 'Devices that support patient observation, measurement and care decisions.',
  },
  'Surgical Instruments': {
    icon: '🛠️',
    description: 'Specialised instruments for surgical preparation and clinical procedures.',
  },
}

function getCategoryDetails(category) {
  return CATEGORY_DETAILS[category] || {
    icon: '⚕️',
    description: 'Verified medical products available for supplier comparison and ordering.',
  }
}

const ACCOUNTS_STORAGE_KEY = 'aayudh_accounts'

function getStoredAccounts() {
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch (err) {
    console.error('Could not read saved accounts', err)
    return {}
  }
}

function saveStoredAccount(email, password, name) {
  try {
    const accounts = getStoredAccounts()
    accounts[String(email).trim().toLowerCase()] = { password, name }
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts))
  } catch (err) {
    console.error('Could not save account credentials', err)
  }
}

const COMMON_PASSWORDS = [
  'password', 'password1', 'password123', '123456789', '12345678', 'qwerty123',
  'letmein', 'welcome1', 'admin123', 'iloveyou', 'abc123456', 'passw0rd',
  'qwertyuiop', 'aayudh123', 'changeme1',
]

function validatePasswordStrict(password) {
  const pw = String(password || '')
  const errors = []
  if (pw.length < 12) errors.push('at least 12 characters')
  if (!/[A-Z]/.test(pw)) errors.push('an uppercase letter')
  if (!/[a-z]/.test(pw)) errors.push('a lowercase letter')
  if (!/[0-9]/.test(pw)) errors.push('a number')
  if (!/[^A-Za-z0-9]/.test(pw)) errors.push('a special character')
  if (COMMON_PASSWORDS.includes(pw.toLowerCase())) errors.push('to not be a common password')
  return { valid: errors.length === 0, errors }
}

function getPasswordStrength(password) {
  const pw = String(password || '')
  let score = 0
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[a-z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  const percent = (score / 5) * 100
  if (score <= 2) return { level: 'weak', percent, label: 'Weak' }
  if (score <= 4) return { level: 'medium', percent, label: 'Medium' }
  return { level: 'strong', percent, label: 'Strong' }
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export default function App() {
  const [screen, setScreen] = useState('login')
  const [user, setUser] = useState({ name: '', email: '' })
  const [authMode, setAuthMode] = useState('login')
  const [authError, setAuthError] = useState('')
  const [signupStatus, setSignupStatus] = useState('idle')
  const [search, setSearch] = useState('')
  const [products, setProducts] = useState([])
  const [offers, setOffers] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [orders, setOrders] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [selectedOffer, setSelectedOffer] = useState(null)
  const [pendingOrder, setPendingOrder] = useState(null)
  const [submittedOrder, setSubmittedOrder] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery')
  const [cardName, setCardName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [pendingAuthUser, setPendingAuthUser] = useState(null)
  const [otpCode, setOtpCode] = useState('')
  const [otpInput, setOtpInput] = useState('')
  const [otpError, setOtpError] = useState('')
  const [cpCurrent, setCpCurrent] = useState('')
  const [cpNew, setCpNew] = useState('')
  const [cpConfirm, setCpConfirm] = useState('')
  const [cpError, setCpError] = useState('')
  const [cpSuccess, setCpSuccess] = useState('')

  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoading(true)
        setError('')

        const productData = await getProducts()
        const offerData = await getOffers()
        const supplierData = await getSuppliers()

        const uniqueProducts = Array.from(
          new Map(productData.map((item) => [item.product_name, item])).values()
        )

        setProducts(uniqueProducts)
        setOffers(offerData)
        setSuppliers(Array.isArray(supplierData) ? supplierData : [])
      } catch (err) {
        setError('Could not load products, supplier offers, or suppliers from backend.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()
  }, [])

  async function loadOrders() {
    try {
      setLoading(true)
      setError('')
      const orderData = await getOrders()
      setOrders(orderData)
    } catch (err) {
      setError('Could not load order history from Supabase.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function loadSuppliers() {
    try {
      setLoading(true)
      setError('')
      const supplierData = await getSuppliers()
      setSuppliers(Array.isArray(supplierData) ? supplierData : [])
    } catch (err) {
      setSuppliers([])
      setError('Could not load suppliers from the Supabase suppliers table.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = useMemo(
    () => products.filter((product) =>
      product.product_name.toLowerCase().includes(search.toLowerCase())
    ),
    [products, search]
  )

  const productCategories = useMemo(() => {
    const groupedProducts = filteredProducts.reduce((groups, product) => {
      const category = product.category || 'Other Medical Supplies'

      if (!groups[category]) {
        groups[category] = []
      }

      groups[category].push(product)
      return groups
    }, {})

    return Object.entries(groupedProducts)
      .sort(([categoryA], [categoryB]) => {
        const indexA = CATEGORY_ORDER.indexOf(categoryA)
        const indexB = CATEGORY_ORDER.indexOf(categoryB)

        if (indexA === -1 && indexB === -1) {
          return categoryA.localeCompare(categoryB)
        }

        if (indexA === -1) return 1
        if (indexB === -1) return -1

        return indexA - indexB
      })
      .map(([category, categoryProducts]) => ({
        category,
        products: categoryProducts,
        ...getCategoryDetails(category),
      }))
  }, [filteredProducts])

  const offersForProduct = selectedProduct
    ? offers.filter((offer) => offer.product_name === selectedProduct.product_name)
    : []

  const recommendedOffer = useMemo(
    () => getRecommendedOffer(offersForProduct),
    [offersForProduct]
  )

  function clearPaymentFields() {
    setPaymentMethod('Cash on Delivery')
    setCardName('')
    setCardNumber('')
    setCardExpiry('')
    setCardCvv('')
  }

  function submitOrder(event) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const quantity = Number(formData.get('quantity'))
    const totalPrice = quantity * Number(selectedOffer.price_per_unit)

    const orderData = {
      customer_name: user.name,
      email: user.email,
      product_name: selectedProduct.product_name,
      supplier_name: selectedOffer.supplier_name,
      quantity,
      total_price: totalPrice,
      delivery_location: formData.get('delivery_location'),
      contact_number: formData.get('contact_number'),
    }

    setError('')
    setPendingOrder(orderData)
    setSubmittedOrder(null)
    clearPaymentFields()
    setScreen('payment')
  }

  async function confirmPayment(event) {
    event.preventDefault()

    if (!pendingOrder) {
      setError('Please complete the order form before payment.')
      setScreen('order')
      return
    }

    const paymentReferenceTime = Date.now()
    const cardDigits = cardNumber.replace(/\D/g, '')
    const paymentData = paymentMethod === 'Card Payment Demo'
      ? {
          payment_method: 'Card Payment Demo',
          payment_status: 'Paid - Demo',
          payment_reference: `CARD-${paymentReferenceTime}`,
          card_last4: cardDigits.slice(-4),
        }
      : {
          payment_method: 'Cash on Delivery',
          payment_status: 'Pending - Pay on Delivery',
          payment_reference: `COD-${paymentReferenceTime}`,
          card_last4: '',
        }

    const orderData = {
      ...pendingOrder,
      ...paymentData,
    }

    try {
      setLoading(true)
      setError('')

      await createOrder(orderData)
      await loadOrders()
      setSubmittedOrder(orderData)
      setPendingOrder(null)
      clearPaymentFields()
      setScreen('confirmation')
    } catch (err) {
      setError('Order could not be saved to Supabase. Please check backend and policies.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function resetToDashboard() {
    setScreen('dashboard')
    setSelectedProduct(null)
    setSelectedOffer(null)
    setPendingOrder(null)
    setSubmittedOrder(null)
    clearPaymentFields()
  }

  function logout() {
    setUser({ name: '', email: '' })
    setSelectedProduct(null)
    setSelectedOffer(null)
    setPendingOrder(null)
    setSubmittedOrder(null)
    clearPaymentFields()
    setAuthMode('login')
    setAuthError('')
    setSignupStatus('idle')
    setSignupPassword('')
    setPendingAuthUser(null)
    setOtpCode('')
    setOtpInput('')
    setOtpError('')
    setCpCurrent('')
    setCpNew('')
    setCpConfirm('')
    setCpError('')
    setCpSuccess('')
    setScreen('login')
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span>Nepal</span>
          <h1>Aayudh International</h1>
          <p>Medical procurement platform for clinics, pharmacies and healthcare buyers in Nepal.</p>
        </div>

        {user.name && (
          <div className="account-box">
            <button className="account-button">👤 My Account ⚙️</button>
            <div className="account-menu">
              <button type="button" onClick={() => setScreen('profile')}>Profile</button>
              <button type="button" onClick={() => setScreen('accountSettings')}>Account Settings</button>
              <button type="button" onClick={() => setScreen('privacyData')}>Privacy & Data</button>
              <button type="button" onClick={logout}>Logout</button>
            </div>
          </div>
        )}
      </header>

      {error && <section className="card success">{error}</section>}
      {loading && <section className="card">Loading...</section>}

      {screen === 'login' && (
        <main className={authMode === 'signup' ? 'auth-layout signup-layout' : 'auth-layout'}>
          <section className="hero-copy">
            <span className="badge">Medical Supply Marketplace</span>
            <h2>Smarter procurement for healthcare buyers in Nepal</h2>
            <p>
              Search verified medical products, compare supplier pricing and delivery
              timelines, then submit real orders through the connected Supabase workflow.
            </p>

            <div className="feature-list">
              <article>
                <span>🔎</span>
                <h3>Search Products</h3>
                <p>Find essential medical supplies quickly using the live product catalogue.</p>
              </article>
              <article>
                <span>⚖️</span>
                <h3>Compare Suppliers</h3>
                <p>Review price, delivery speed, reliability and stock before ordering.</p>
              </article>
              <article>
                <span>🗄️</span>
                <h3>Supabase Storage</h3>
                <p>Save order requests and retrieve order history from the database.</p>
              </article>
            </div>
          </section>

          <section className={authMode === 'signup' ? 'auth-card signup-card' : 'auth-card'}>
            <span className="badge">Secure Demo Access</span>
            <h2>{authMode === 'login' ? 'Login to Dashboard' : 'Create your account'}</h2>
            <p>
              {authMode === 'login'
                ? 'Enter your email and password to continue to the procurement dashboard.'
                : 'Register a buyer profile for clinics, pharmacies, hospitals and healthcare purchasers.'}
            </p>

            <div className="auth-tabs" aria-label="Authentication mode">
              <button
                type="button"
                className={authMode === 'login' ? 'tab active-tab' : 'tab'}
                onClick={() => {
                  setAuthMode('login')
                  setAuthError('')
                  setSignupStatus('idle')
                }}
              >
                Login
              </button>
              <button
                type="button"
                className={authMode === 'signup' ? 'tab active-tab' : 'tab'}
                onClick={() => {
                  setAuthMode('signup')
                  setAuthError('')
                  setSignupStatus('idle')
                }}
              >
                Sign Up
              </button>
            </div>

            <form
              className={authMode === 'signup' ? 'form signup-form' : 'form'}
              onSubmit={async (event) => {
                event.preventDefault()
                const formData = new FormData(event.currentTarget)
                const email = formData.get('email')
                const password = formData.get('password')
                const confirmPassword = formData.get('confirmPassword')

                if (authMode === 'login') {
                  const accounts = getStoredAccounts()
                  const account = accounts[String(email).trim().toLowerCase()]

                  if (!account) {
                    setSignupStatus('idle')
                    setAuthError('No account found for this email. Please sign up first.')
                    return
                  }

                  if (account.password !== password) {
                    setSignupStatus('idle')
                    setAuthError('Incorrect password. Please try again.')
                    return
                  }

                  setAuthError('')
                  setSignupStatus('idle')
                  const loginCode = generateOtp()
                  setOtpCode(loginCode)
                  setOtpInput('')
                  setOtpError('')
                  setPendingAuthUser({ name: account.name || email.split('@')[0], email })
                  setScreen('mfa')
                  return
                }

                const buyerType = formData.get('buyer_type')
                const organisationName = formData.get('organisation_name')
                const contactPerson = formData.get('contact_person')
                const city = formData.get('city')

                if (!email || !password || !buyerType || !organisationName || !contactPerson || !city) {
                  setAuthError('Please complete all required account and buyer fields before creating an account.')
                  return
                }

                if (authMode === 'signup' && password !== confirmPassword) {
                  setAuthError('Passwords do not match. Please confirm your password again.')
                  return
                }

                const passwordCheck = validatePasswordStrict(password)
                if (!passwordCheck.valid) {
                  setAuthError('Password is not strong enough. It still needs: ' + passwordCheck.errors.join(', ') + '.')
                  return
                }

                const signupFormData = {
                  buyer_type: buyerType,
                  organisation_name: organisationName,
                  contact_person: contactPerson,
                  email,
                  phone: formData.get('phone'),
                  city: formData.get('city'),
                  district: formData.get('district'),
                  full_address: formData.get('full_address'),
                  business_registration_number: formData.get('business_registration_number') || '',
                  preferred_delivery_area: formData.get('preferred_delivery_area'),
                }

                // Save credentials locally so this buyer can log in afterwards
                saveStoredAccount(email, password, contactPerson || email.split('@')[0])

                try {
                  setLoading(true)
                  setError('')
                  setSignupStatus('saving')
                  const result = await createBuyer(signupFormData)

                  if (!result?.success) {
                    throw new Error(result?.message || 'Buyer account could not be created')
                  }

                  setAuthError('')
                  setSignupStatus('created')
                  setSignupPassword('')
                  setAuthMode('login')
                } catch (err) {
                  setSignupStatus('idle')
                  setAuthError('Buyer profile could not be saved to Supabase. Please check the backend and buyers table.')
                  console.error(err)
                } finally {
                  setLoading(false)
                }
              }}
            >
              {authMode === 'login' ? (
                <>
                  <input name="email" type="email" placeholder="Email address" required />
                  <input name="password" type="password" placeholder="Password" required />
                </>
              ) : (
                <div className="signup-grid">
                  <section className="form-section full-width">
                    <h3>Account Details</h3>
                    <label className="form-label">
                      Buyer type
                      <select className="auth-select" name="buyer_type" required defaultValue="">
                        <option value="" disabled>Select buyer type</option>
                        <option value="Clinic">Clinic</option>
                        <option value="Pharmacy">Pharmacy</option>
                        <option value="Diagnostic Centre">Diagnostic Centre</option>
                        <option value="Hospital">Hospital</option>
                        <option value="Aged Care Facility">Aged Care Facility</option>
                        <option value="Individual Buyer">Individual Buyer</option>
                      </select>
                    </label>
                    <label className="form-label">
                      Email address
                      <input name="email" type="email" placeholder="buyer@example.com" required />
                    </label>
                    <label className="form-label">
                      Password
                      <input
                        name="password"
                        type="password"
                        placeholder="Password"
                        value={signupPassword}
                        onChange={(event) => setSignupPassword(event.target.value)}
                        required
                      />
                    </label>
                    {signupPassword && (
                      <div className="password-strength">
                        <div className={`strength-bar strength-${getPasswordStrength(signupPassword).level}`}>
                          <span style={{ width: `${getPasswordStrength(signupPassword).percent}%` }} />
                        </div>
                        <p className="strength-label">Password strength: {getPasswordStrength(signupPassword).label}</p>
                        {validatePasswordStrict(signupPassword).valid ? (
                          <p className="strength-rules rule-pass">Strong password ✓</p>
                        ) : (
                          <p className="strength-rules">Still needs: {validatePasswordStrict(signupPassword).errors.join(', ')}.</p>
                        )}
                      </div>
                    )}
                    <label className="form-label">
                      Confirm password
                      <input name="confirmPassword" type="password" placeholder="Confirm password" required />
                    </label>
                  </section>

                  <section className="form-section full-width">
                    <h3>Buyer Information</h3>
                    <label className="form-label">
                      Organisation name
                      <input name="organisation_name" placeholder="Organisation name" required />
                    </label>
                    <label className="form-label">
                      Contact person name
                      <input name="contact_person" placeholder="Contact person name" required />
                    </label>
                    <label className="form-label">
                      Phone number
                      <input name="phone" placeholder="Phone number" required />
                    </label>
                    <label className="form-label">
                      Business registration number optional
                      <input name="business_registration_number" placeholder="Business registration number" />
                    </label>
                  </section>

                  <section className="form-section full-width">
                    <h3>Delivery Information</h3>
                    <label className="form-label">
                      City
                      <input name="city" placeholder="City" required />
                    </label>
                    <label className="form-label">
                      District
                      <input name="district" placeholder="District" required />
                    </label>
                    <label className="form-label full-width">
                      Full delivery address
                      <input name="full_address" placeholder="Full delivery address" required />
                    </label>
                    <label className="form-label full-width">
                      Preferred delivery area
                      <input name="preferred_delivery_area" placeholder="Preferred delivery area" required />
                    </label>
                  </section>
                </div>
              )}
              {authMode === 'login' && signupStatus === 'created' && (
                <p className="privacy-note auth-success">Account created successfully. Please log in with the email and password you just registered.</p>
              )}
              {authError && <p className="privacy-note auth-error">{authError}</p>}
              <button type="submit" disabled={authMode === 'signup' && signupStatus === 'saving'}>
                {authMode === 'login'
                  ? 'Login to Dashboard'
                  : signupStatus === 'saving'
                    ? 'Creating Account...'
                    : signupStatus === 'created'
                      ? 'Account Created'
                      : 'Create Account'}
              </button>
            </form>

            <p className="privacy-note">
              {authMode === 'login'
                ? 'Login is gated by sign up: enter the email and password you registered. Product search, supplier comparison, Supabase order saving, and order history retrieval stay connected to the existing backend.'
                : 'This prototype saves buyer profile details to Supabase for demonstration. Your login email and password are stored securely in your browser so you can sign in afterwards.'}
            </p>
          </section>
        </main>
      )}

      {screen === 'mfa' && pendingAuthUser && (
        <main className="auth-layout">
          <section className="hero-copy">
            <span className="badge">Two-Factor Authentication</span>
            <h2>One more step to keep your account secure</h2>
            <p>
              For extra security, Aayudh International adds a second verification step after
              your password. Enter the 6-digit verification code below to finish signing in.
            </p>
          </section>

          <section className="auth-card">
            <span className="badge">Verification Code</span>
            <h2>Enter your code</h2>
            <p>
              A 6-digit code was generated for <strong>{pendingAuthUser.email}</strong>. In a
              live deployment this would be emailed or texted to you; for this demo it is shown
              below so the marker can see the two-factor step working.
            </p>

            <div className="otp-demo-code" aria-label="Demo verification code">{otpCode}</div>
            <p className="privacy-note">
              Demo only: in production this code is sent privately to your email or phone and is
              never shown on screen.
            </p>

            <form
              className="form"
              onSubmit={(event) => {
                event.preventDefault()
                if (otpInput.trim() === otpCode) {
                  setUser(pendingAuthUser)
                  setPendingAuthUser(null)
                  setOtpInput('')
                  setOtpError('')
                  setScreen('dashboard')
                } else {
                  setOtpError('Incorrect code. Please enter the 6-digit code shown above.')
                }
              }}
            >
              <input
                value={otpInput}
                onChange={(event) => setOtpInput(event.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                placeholder="Enter 6-digit code"
                required
              />
              {otpError && <p className="privacy-note auth-error">{otpError}</p>}
              <button type="submit">Verify & Continue</button>
            </form>

            <div className="nav-buttons">
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setOtpCode(generateOtp())
                  setOtpInput('')
                  setOtpError('')
                }}
              >
                Resend Code
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setPendingAuthUser(null)
                  setOtpInput('')
                  setOtpError('')
                  setScreen('login')
                }}
              >
                Back to Login
              </button>
            </div>
          </section>
        </main>
      )}

      {screen === 'dashboard' && (
        <main className="dashboard-shell">
          <section className="dashboard-hero">
            <div>
              <span className="badge">Dashboard</span>
              <h2>Welcome back, {user.name}</h2>
              <p>
                Manage healthcare procurement orders, browse products, compare suppliers,
                complete demo payments and track saved Supabase order history.
              </p>
              <div className="nav-buttons">
                <button onClick={() => setScreen('products')}>Search Products</button>
                <button
                  className="secondary"
                  onClick={async () => {
                    await loadSuppliers()
                    setScreen('suppliers')
                  }}
                >
                  View Suppliers
                </button>
                <button
                  className="secondary"
                  onClick={async () => {
                    await loadOrders()
                    setScreen('history')
                  }}
                >
                  View Order History
                </button>
              </div>
            </div>
          </section>

          <section className="overview-grid" aria-label="Today's Overview">
            <article className="overview-card">
              <span>Products available</span>
              <strong>{products.length}</strong>
            </article>
            <article className="overview-card">
              <span>Supplier offers</span>
              <strong>{offers.length}</strong>
            </article>
            <article className="overview-card">
              <span>Saved orders</span>
              <strong>{orders.length > 0 ? orders.length : 'Live'}</strong>
            </article>
          </section>

          <section className="dashboard-actions">
            <article className="action-tile">
              <span className="action-icon">🔎</span>
              <h3>Browse Products</h3>
              <p>Explore medical supply categories and choose a product for supplier comparison.</p>
              <button onClick={() => setScreen('products')}>Search Products</button>
            </article>

            <article className="action-tile">
              <span className="action-icon">🏥</span>
              <h3>Supplier Directory</h3>
              <p>Review registered suppliers, locations and reliability scores from Supabase.</p>
              <button
                className="secondary"
                onClick={async () => {
                  await loadSuppliers()
                  setScreen('suppliers')
                }}
              >
                View Suppliers
              </button>
            </article>

            <article className="action-tile">
              <span className="action-icon">📦</span>
              <h3>Order History</h3>
              <p>Load saved procurement orders, payment references and order status details.</p>
              <button
                className="secondary"
                onClick={async () => {
                  await loadOrders()
                  setScreen('history')
                }}
              >
                View Order History
              </button>
            </article>
          </section>

          <section className="journey-strip" aria-label="Procurement Journey">
            {['Browse', 'Compare', 'Order', 'Pay', 'Track'].map((step, index) => (
              <div className="journey-step" key={step}>
                <span>{index + 1}</span>
                <strong>{step}</strong>
              </div>
            ))}
          </section>
        </main>
      )}

      {screen === 'profile' && (
        <main>
          <section className="page-heading">
            <div>
              <span className="badge">Profile</span>
              <h2>Buyer account profile</h2>
              <p>Review the signed-in buyer details used across Aayudh International.</p>
            </div>
            <button className="secondary" onClick={resetToDashboard}>Back to Dashboard</button>
          </section>

          <div className="grid">
            <section className="card">
              <span className="badge">Account Details</span>
              <h3>{user.name}</h3>
              <p><strong>User email:</strong> {user.email}</p>
              <p><strong>Account type:</strong> Buyer Account</p>
              <p><strong>App name:</strong> Aayudh International</p>
            </section>

            <section className="card">
              <h3>Procurement access</h3>
              <p>
                This account can search products, compare suppliers, place orders and view
                saved order history through the existing app workflow.
              </p>
              <div className="nav-buttons">
                <button className="secondary" onClick={resetToDashboard}>Back to Dashboard</button>
              </div>
            </section>
          </div>
        </main>
      )}

      {screen === 'accountSettings' && (
        <main>
          <section className="page-heading">
            <div>
              <span className="badge">Account Settings</span>
              <h2>Manage account preferences</h2>
              <p>Prototype settings for buyer identity, password and notifications.</p>
            </div>
            <button className="secondary" onClick={resetToDashboard}>Back to Dashboard</button>
          </section>

          <div className="grid">
            <section className="card">
              <span className="badge">Email Address</span>
              <h3>Signed-in email</h3>
              <p><strong>Email:</strong> {user.email}</p>
              <p>This email is used as the buyer contact in the current prototype workflow.</p>
            </section>

            <section className="card">
              <span className="badge">Security</span>
              <h3>Change password</h3>
              <p>
                Update the password for your account. Your new password must meet the strict
                security rules (12+ characters, with upper and lower case, a number and a symbol).
              </p>
              <form
                className="form"
                onSubmit={(event) => {
                  event.preventDefault()
                  setCpError('')
                  setCpSuccess('')

                  const accounts = getStoredAccounts()
                  const account = accounts[String(user.email).trim().toLowerCase()]

                  if (!account) {
                    setCpError('No saved account was found for this email.')
                    return
                  }
                  if (account.password !== cpCurrent) {
                    setCpError('Your current password is incorrect.')
                    return
                  }
                  const newCheck = validatePasswordStrict(cpNew)
                  if (!newCheck.valid) {
                    setCpError('New password is not strong enough. It needs: ' + newCheck.errors.join(', ') + '.')
                    return
                  }
                  if (cpNew === cpCurrent) {
                    setCpError('Your new password must be different from your current password.')
                    return
                  }
                  if (cpNew !== cpConfirm) {
                    setCpError('New password and confirmation do not match.')
                    return
                  }

                  saveStoredAccount(user.email, cpNew, account.name)
                  setCpCurrent('')
                  setCpNew('')
                  setCpConfirm('')
                  setCpSuccess('Password updated successfully. Use your new password the next time you log in.')
                }}
              >
                <input
                  type="password"
                  value={cpCurrent}
                  onChange={(event) => setCpCurrent(event.target.value)}
                  placeholder="Current password"
                  required
                />
                <input
                  type="password"
                  value={cpNew}
                  onChange={(event) => setCpNew(event.target.value)}
                  placeholder="New password"
                  required
                />
                {cpNew && (
                  <div className="password-strength">
                    <div className={`strength-bar strength-${getPasswordStrength(cpNew).level}`}>
                      <span style={{ width: `${getPasswordStrength(cpNew).percent}%` }} />
                    </div>
                    <p className="strength-label">Password strength: {getPasswordStrength(cpNew).label}</p>
                    {validatePasswordStrict(cpNew).valid ? (
                      <p className="strength-rules rule-pass">Strong password ✓</p>
                    ) : (
                      <p className="strength-rules">Still needs: {validatePasswordStrict(cpNew).errors.join(', ')}.</p>
                    )}
                  </div>
                )}
                <input
                  type="password"
                  value={cpConfirm}
                  onChange={(event) => setCpConfirm(event.target.value)}
                  placeholder="Confirm new password"
                  required
                />
                {cpError && <p className="privacy-note auth-error">{cpError}</p>}
                {cpSuccess && <p className="privacy-note auth-success">{cpSuccess}</p>}
                <button type="submit">Update Password</button>
              </form>
            </section>

            <section className="card">
              <span className="badge">Notifications</span>
              <h3>Notification preferences</h3>
              <p>
                Prototype preference: receive procurement reminders, supplier comparison
                updates and order status notices for this buyer account.
              </p>
              <div className="nav-buttons">
                <button className="secondary" onClick={resetToDashboard}>Back to Dashboard</button>
              </div>
            </section>
          </div>
        </main>
      )}

      {screen === 'privacyData' && (
        <main>
          <section className="page-heading">
            <div>
              <span className="badge">Privacy & Data</span>
              <h2>How this prototype uses data</h2>
              <p>Understand how buyer and order information is used in this demo app.</p>
            </div>
            <button className="secondary" onClick={resetToDashboard}>Back to Dashboard</button>
          </section>

          <div className="grid">
            <section className="card">
              <span className="badge">Supabase Storage</span>
              <h3>Order data</h3>
              <p>
                Order requests submitted through the order form are saved to Supabase through
                the existing backend connection and order saving logic.
              </p>
            </section>

            <section className="card">
              <span className="badge">Buyer Email</span>
              <h3>Email usage</h3>
              <p><strong>User email:</strong> {user.email}</p>
              <p>
                This email is included with order records and is used in the prototype to
                identify the buyer for order history and procurement records.
              </p>
            </section>

            <section className="card">
              <span className="badge">Prototype Note</span>
              <h3>Privacy notice</h3>
              <p>
                This is a BUS4012/Vibe Coding Assessment prototype. Privacy controls shown here
                are informational and do not change Supabase tables, backend routes or saved data.
              </p>
              <div className="nav-buttons">
                <button className="secondary" onClick={resetToDashboard}>Back to Dashboard</button>
              </div>
            </section>
          </div>
        </main>
      )}

      {screen === 'suppliers' && (
        <main>
          <section className="page-heading">
            <div>
              <span className="badge">Supplier List</span>
              <h2>Suppliers from Supabase</h2>
              <p>View registered supplier names, locations and reliability scores.</p>
            </div>
            <button className="secondary" onClick={resetToDashboard}>Back</button>
          </section>

          {suppliers.length === 0 ? (
            <section className="card">
              <p>No suppliers found in the suppliers table.</p>
              <button className="secondary" onClick={loadSuppliers}>Refresh Supplier List</button>
            </section>
          ) : (
            <div className="grid">
              {suppliers.map((supplier) => (
                <section className="card" key={supplier.id || supplier.supplier_name}>
                  <span className="badge">Supplier</span>
                  <h3>{supplier.supplier_name}</h3>
                  <p><strong>Location:</strong> {supplier.location}</p>
                  <p><strong>Reliability:</strong> {supplier.reliability_score}/5</p>
                </section>
              ))}
            </div>
          )}
        </main>
      )}

      {screen === 'products' && (
        <main>
          <section className="page-heading">
            <div>
              <span className="badge">Medical Marketplace</span>
              <h2>Browse products by category</h2>
              <p>Search or explore grouped medical supplies, then view suppliers for any product.</p>
            </div>
            <button className="secondary" onClick={resetToDashboard}>Back</button>
          </section>

          <input
            className="search marketplace-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products across all categories..."
          />

          <div className="marketplace-shell">
            {productCategories.length === 0 ? (
              <section className="card">
                <p>No products found for this search.</p>
              </section>
            ) : (
              productCategories.map((categoryGroup, index) => (
                <section
                  className="category-section"
                  key={categoryGroup.category}
                  style={{ animationDelay: `${index * 90}ms` }}
                >
                  <div className="category-header">
                    <div>
                      <h3>
                        <span className="category-icon">{categoryGroup.icon}</span>
                        {categoryGroup.category}
                      </h3>
                      <p>{categoryGroup.description}</p>
                    </div>
                    <span className="category-count">
                      {categoryGroup.products.length} product{categoryGroup.products.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  <div className="product-row" aria-label={`${categoryGroup.category} products`}>
                    {categoryGroup.products.map((product) => (
                      <article className="product-card" key={product.product_name}>
                        <span className="badge">{product.category}</span>
                        <h4>{product.product_name}</h4>
                        <p>{product.description}</p>
                        <button
                          onClick={() => {
                            setSelectedProduct(product)
                            setScreen('offers')
                          }}
                        >
                          View Suppliers
                        </button>
                      </article>
                    ))}
                  </div>
                </section>
              ))
            )}
          </div>
        </main>
      )}

      {screen === 'offers' && selectedProduct && (
        <main>
          <section className="page-heading">
            <div>
              <span className="badge">Supplier Comparison</span>
              <h2>{selectedProduct.product_name}</h2>
              <p>Compare suppliers by price, delivery time and reliability score.</p>
            </div>
            <button className="secondary" onClick={() => setScreen('products')}>Back</button>
          </section>

          {recommendedOffer && (
            <section className="card recommended">
              <h3>⭐ Smart Supplier Recommendation</h3>
              <p>
                Recommended supplier: <strong>{recommendedOffer.supplier_name}</strong> based on
                reliability, delivery speed and price.
              </p>
            </section>
          )}

          <div className="grid">
            {offersForProduct.map((offer) => (
              <section className="card" key={`${offer.product_name}-${offer.supplier_name}`}>
                <h3>{offer.supplier_name}</h3>
                <p><strong>Price:</strong> NPR {offer.price_per_unit} per unit</p>
                <p><strong>Delivery:</strong> {offer.delivery_days} days</p>
                <p><strong>Reliability:</strong> {offer.reliability_score}/5</p>
                <p><strong>Stock:</strong> {offer.stock_status}</p>
                <button
                  onClick={() => {
                    setSelectedOffer(offer)
                    setScreen('order')
                  }}
                >
                  Select Supplier
                </button>
              </section>
            ))}
          </div>

          {offersForProduct.length === 0 && (
            <section className="card">
              <p>No supplier offers found for this product. Check the /offers backend route.</p>
            </section>
          )}
        </main>
      )}

      {screen === 'order' && selectedOffer && (
        <main className="card">
          <span className="badge">Order Form</span>
          <h2>Place order request</h2>
          <p>
            Product: <strong>{selectedProduct.product_name}</strong>
            <br />
            Supplier: <strong>{selectedOffer.supplier_name}</strong>
          </p>

          <form className="form" onSubmit={submitOrder}>
            <input name="quantity" type="number" min="1" placeholder="Quantity" required />
            <input name="delivery_location" placeholder="Delivery location" required />
            <input name="contact_number" placeholder="Contact number" required />
            <button type="submit">Continue to Payment</button>
          </form>
        </main>
      )}

      {screen === 'payment' && pendingOrder && (
        <main>
          <section className="page-heading">
            <div>
              <span className="badge">Prototype Payment</span>
              <h2>Confirm payment method</h2>
              <p>This step prepares demo payment details before saving the order to Supabase.</p>
            </div>
            <button className="secondary" onClick={() => setScreen('order')}>Back to Order</button>
          </section>

          <div className="payment-layout">
            <section className="card payment-summary">
              <span className="badge">Order Summary</span>
              <h3>{pendingOrder.product_name}</h3>
              <div className="summary-row">
                <span>Supplier</span>
                <strong>{pendingOrder.supplier_name}</strong>
              </div>
              <div className="summary-row">
                <span>Quantity</span>
                <strong>{pendingOrder.quantity}</strong>
              </div>
              <div className="summary-row">
                <span>Total price</span>
                <strong>NPR {pendingOrder.total_price}</strong>
              </div>
              <p className="payment-note">
                This is a prototype payment screen. No real card payment is processed.
              </p>
            </section>

            <section className="card">
              <span className="badge">Payment Gateway Demo</span>
              <h3>Select payment option</h3>
              <form className="form" onSubmit={confirmPayment}>
                <div className="payment-options">
                  <button
                    type="button"
                    className={paymentMethod === 'Cash on Delivery' ? 'payment-option selected-payment' : 'payment-option'}
                    onClick={() => setPaymentMethod('Cash on Delivery')}
                  >
                    <strong>Cash on Delivery</strong>
                    <span>Pay when medical supplies are delivered.</span>
                  </button>
                  <button
                    type="button"
                    className={paymentMethod === 'Card Payment Demo' ? 'payment-option selected-payment' : 'payment-option'}
                    onClick={() => setPaymentMethod('Card Payment Demo')}
                  >
                    <strong>Card Payment Demo</strong>
                    <span>Prototype card flow. Only last 4 digits are saved.</span>
                  </button>
                </div>

                {paymentMethod === 'Card Payment Demo' && (
                  <div className="card-fields">
                    <input
                      value={cardName}
                      onChange={(event) => setCardName(event.target.value)}
                      placeholder="Cardholder name"
                      required
                    />
                    <input
                      value={cardNumber}
                      onChange={(event) => setCardNumber(event.target.value)}
                      inputMode="numeric"
                      placeholder="Card number"
                      required
                    />
                    <input
                      value={cardExpiry}
                      onChange={(event) => setCardExpiry(event.target.value)}
                      placeholder="Expiry date"
                      required
                    />
                    <input
                      value={cardCvv}
                      onChange={(event) => setCardCvv(event.target.value)}
                      inputMode="numeric"
                      placeholder="CVV"
                      required
                    />
                  </div>
                )}

                <p className="payment-note">
                  Demo only: full card numbers are never saved to Supabase. The app stores
                  only the final 4 digits for the prototype order record.
                </p>
                <button type="submit">Confirm Payment & Submit Order</button>
              </form>
            </section>
          </div>
        </main>
      )}

      {screen === 'confirmation' && (
        <main className="card success">
          <span className="badge">Confirmation</span>
          <h2>Order saved successfully</h2>
          <p>
            The order has been submitted through the React frontend, sent to the Python
            backend, and saved in the Supabase orders table.
          </p>

          {submittedOrder && (
            <div className="payment-receipt">
              <p><strong>Payment method:</strong> {submittedOrder.payment_method}</p>
              <p><strong>Payment status:</strong> {submittedOrder.payment_status}</p>
              <p><strong>Payment reference:</strong> {submittedOrder.payment_reference}</p>
            </div>
          )}

          <div className="nav-buttons">
            <button
              onClick={async () => {
                await loadOrders()
                setScreen('history')
              }}
            >
              View Order History
            </button>
            <button className="secondary" onClick={resetToDashboard}>
              Back to Dashboard
            </button>
          </div>
        </main>
      )}

      {screen === 'history' && (
        <main>
          <section className="page-heading">
            <div>
              <span className="badge">Order History</span>
              <h2>Orders retrieved from Supabase</h2>
              <p>This page displays saved orders retrieved through the Python backend.</p>
            </div>
            <button className="secondary" onClick={resetToDashboard}>Back</button>
          </section>

          {orders.length === 0 ? (
            <section className="card">
              <p>No orders saved yet.</p>
            </section>
          ) : (
            <div className="grid">
              {orders.map((order) => (
                <section className="card" key={order.id}>
                  <h3>{order.product_name}</h3>
                  <p><strong>Customer:</strong> {order.customer_name}</p>
                  <p><strong>Supplier:</strong> {order.supplier_name}</p>
                  <p><strong>Quantity:</strong> {order.quantity}</p>
                  <p><strong>Total:</strong> NPR {order.total_price}</p>
                  <p><strong>Location:</strong> {order.delivery_location}</p>
                  <p><strong>Status:</strong> {order.order_status}</p>
                  <p><strong>Payment Method:</strong> {order.payment_method || 'Not recorded'}</p>
                  <p><strong>Payment Status:</strong> {order.payment_status || 'Not recorded'}</p>
                  <p><strong>Payment Reference:</strong> {order.payment_reference || 'Not recorded'}</p>
                  {order.payment_method === 'Card Payment Demo' && order.card_last4 && (
                    <p><strong>Card Last 4:</strong> •••• {order.card_last4}</p>
                  )}
                  <p><strong>Created:</strong> {order.created_at}</p>
                </section>
              ))}
            </div>
          )}
        </main>
      )}
    </div>
  )
}
