from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from .supabase_client import get_table, insert_row
 
app = FastAPI(title="Aayudh International API")
 
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "https://firstprojectaayudh.vercel.app",
        "https://firstprojectaayudh-git-main-saugat-shrestha-s-projects.vercel.app",
        "https://firstprojectaayudh-92atkuucn-saugat-shrestha-s-projects.vercel.app",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
 
 
class Order(BaseModel):
    customer_name: str
    email: str
    product_name: str
    supplier_name: str
    quantity: int
    total_price: float
    delivery_location: str
    contact_number: str
    payment_method: str | None = None
    payment_status: str | None = None
    payment_reference: str | None = None
    card_last4: str | None = None
 
 
class Buyer(BaseModel):
    buyer_type: str
    organisation_name: str
    contact_person: str
    email: str
    phone: str
    city: str
    district: str
    full_address: str
    business_registration_number: str | None = None
    preferred_delivery_area: str
 
 
@app.get("/health")
def health_check():
    return {"status": "Backend is working", "app": "Aayudh International"}
 
 
@app.get("/products")
def get_products():
    try:
        return get_table("products")
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))
 
 
@app.get("/offers")
def get_offers():
    try:
        return get_table("supplier_offers")
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))
 
 
@app.get("/suppliers")
def get_suppliers():
    try:
        return get_table("suppliers")
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))
 
 
@app.post("/buyers")
def create_buyer(buyer: Buyer):
    try:
        buyer_data = buyer.model_dump() if hasattr(buyer, "model_dump") else buyer.dict()
        insert_row("buyers", buyer_data)
 
        return {
            "success": True,
            "message": "Buyer account created",
        }
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))
 
 
@app.post("/orders")
def create_order(order: Order):
    try:
        order_data = order.model_dump() if hasattr(order, "model_dump") else order.dict()
        order_data["order_status"] = "Pending"
 
        saved_order = insert_row("orders", order_data)
 
        return {
            "message": "Order saved successfully",
            "data": saved_order,
        }
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))
 
 
@app.get("/orders")
def get_orders(email: str | None = Query(default=None)):
    try:
        # When an email is supplied, only that buyer's own orders are returned.
        # This keeps every user's purchase history private at the server level.
        if email:
            return get_table("orders", filters={"email": f"eq.{email}"})
        return get_table("orders")
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))
