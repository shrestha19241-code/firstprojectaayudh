const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
 
async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })
 
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || `API error: ${response.status}`)
  }
 
  return response.json()
}
 
export function getProducts() {
  return request('/products')
}
 
export function getOffers() {
  return request('/offers')
}
 
export function getSuppliers() {
  return request('/suppliers')
}
 
export async function createBuyer(data) {
  return request('/buyers', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
 
export function createOrder(orderData) {
  return request('/orders', {
    method: 'POST',
    body: JSON.stringify(orderData),
  })
}
 
export function getOrders(email) {
  const query = email ? `?email=${encodeURIComponent(email)}` : ''
  return request(`/orders${query}`)
}
