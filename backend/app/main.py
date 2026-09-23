from pathlib import Path
from uuid import uuid4

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from starlette.concurrency import run_in_threadpool
from pydantic import BaseModel, Field

from .cart import CartService
from .catalog import CatalogService
from .chat import ChatService

ROOT = Path(__file__).parents[2]
app = FastAPI(title="Quant ^ — ekt.kz assistant", version="0.1.0")
catalog = CatalogService()
cart = CartService()
chat = ChatService(catalog)
MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024
ALLOWED_ATTACHMENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv",
}


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    session_id: str = Field(default_factory=lambda: str(uuid4()))


class ConfirmRequest(BaseModel):
    session_id: str
    sku: str
    quantity: int = Field(ge=1, le=1000)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "Quant ^", "site": "ekt.kz"}


@app.get('/api/products')
def get_products():
    return {'products': catalog.products}


@app.post("/api/chat")
def chat_endpoint(request: ChatRequest):
    response = chat.respond(request.session_id, request.message)
    response["session_id"] = request.session_id
    return response


@app.post("/api/chat/upload")
async def chat_upload_endpoint(
    session_id: str = Form(...),
    message: str = Form(""),
    file: UploadFile = File(...),
):
    content_type = (file.content_type or "").lower()
    if content_type not in ALLOWED_ATTACHMENT_TYPES:
        raise HTTPException(
            status_code=415,
            detail="Поддерживаются JPG, PNG, WEBP, PDF, Word, Excel и CSV.",
        )
    data = await file.read(MAX_ATTACHMENT_BYTES + 1)
    await file.close()
    if not data:
        raise HTTPException(status_code=400, detail="Файл пустой.")
    if len(data) > MAX_ATTACHMENT_BYTES:
        raise HTTPException(status_code=413, detail="Файл должен быть не больше 10 МБ.")

    safe_filename = Path(file.filename or "attachment").name
    response = await run_in_threadpool(chat.respond_with_attachment,
        session_id=session_id,
        message=message,
        filename=safe_filename,
        content_type=content_type,
        data=data,
    )
    response["session_id"] = session_id
    response["attachment"] = {"name": safe_filename}
    return response


@app.get("/api/cart/{session_id}")
def get_cart(session_id: str):
    items = cart.get(session_id)
    return {"session_id": session_id, "items": items, "total": cart.total(items), "checkout_url": f"/cart?session_id={session_id}"}


@app.get("/api/certificates/{certificate_name}")
def get_certificate(certificate_name: str):
    certificates = {
        "va4729": ROOT / "backend" / "data" / "certificates" / "va4729.html",
        "vvg": ROOT / "backend" / "data" / "certificates" / "vvg.html",
    }
    certificate_path = certificates.get(certificate_name)
    if not certificate_path:
        raise HTTPException(status_code=404, detail="Сертификат не найден")
    return FileResponse(certificate_path)


@app.post("/api/cart/confirm")
def confirm_cart(request: ConfirmRequest):
    if not chat.take_approved(request.session_id, request.sku, request.quantity):
        raise HTTPException(status_code=403, detail="Сначала подтвердите добавление товара в чате")
    product = next((item for item in catalog.products if item["sku"] == request.sku), None)
    if not product:
        raise HTTPException(status_code=404, detail="Товар не найден")
    current_quantity = cart.quantity(request.session_id, request.sku)
    remaining = max(product["stock"] - current_quantity, 0)
    if request.quantity > remaining:
        raise HTTPException(status_code=400, detail=f"Можно добавить ещё только {remaining} шт.")
    items = cart.add(request.session_id, product, request.quantity)
    return {"message": "Товар добавлен в корзину.", "items": items, "total": cart.total(items), "checkout_url": f"/cart?session_id={request.session_id}"}


@app.get("/")
def index():
    return FileResponse(ROOT / "frontend" / "index.html")


@app.get("/cart")
def cart_page():
    return FileResponse(ROOT / "frontend" / "index.html")


app.mount("/static", StaticFiles(directory=ROOT / "frontend"), name="static")
