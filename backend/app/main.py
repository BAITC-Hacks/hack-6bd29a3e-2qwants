from pathlib import Path
from uuid import uuid4

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from .cart import CartService
from .catalog import CatalogService
from .chat import ChatService

ROOT = Path(__file__).parents[2]
app = FastAPI(title="HACKALEM AI — ekt.kz assistant", version="0.1.0")
catalog = CatalogService()
cart = CartService()
chat = ChatService(catalog)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    session_id: str = Field(default_factory=lambda: str(uuid4()))


class ConfirmRequest(BaseModel):
    session_id: str
    sku: str
    quantity: int = Field(ge=1, le=1000)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "ekt-assistant"}


@app.post("/api/chat")
def chat_endpoint(request: ChatRequest):
    response = chat.respond(request.session_id, request.message)
    response["session_id"] = request.session_id
    return response


@app.get("/api/cart/{session_id}")
def get_cart(session_id: str):
    items = cart.get(session_id)
    return {"session_id": session_id, "items": items, "total": cart.total(items), "checkout_url": f"/cart?session_id={session_id}"}


@app.post("/api/cart/confirm")
def confirm_cart(request: ConfirmRequest):
    if not chat.take_approved(request.session_id, request.sku, request.quantity):
        raise HTTPException(status_code=403, detail="Сначала подтвердите добавление товара в чате")
    product = next((item for item in catalog.products if item["sku"] == request.sku), None)
    if not product:
        raise HTTPException(status_code=404, detail="Товар не найден")
    if request.quantity > product["stock"]:
        raise HTTPException(status_code=400, detail=f"Доступно только {product['stock']} шт.")
    items = cart.add(request.session_id, product, request.quantity)
    return {"message": "Товар добавлен в корзину.", "items": items, "total": cart.total(items), "checkout_url": f"/cart?session_id={request.session_id}"}


@app.get("/")
def index():
    return FileResponse(ROOT / "frontend" / "index.html")


app.mount("/static", StaticFiles(directory=ROOT / "frontend"), name="static")
