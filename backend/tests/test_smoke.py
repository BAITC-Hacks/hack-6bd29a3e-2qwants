import pytest
from fastapi.testclient import TestClient

from app.cart import CartService
from app.catalog import CatalogService
from app.chat import ChatService
from app.main import app


def test_products_endpoint_uses_backend_catalog():
    response = TestClient(app).get('/api/products')
    assert response.status_code == 200
    products = response.json()['products']
    assert any(item['sku'] == 'EK-VA4729-C16' for item in products)
    assert any(item['sku'] == 'DEMO-DRILL' and item['synthetic'] for item in products)


def test_catalog_product_answer():
    result = ChatService(CatalogService()).respond("product", "Есть ли автомат ВА47-29 2P C16?")
    assert result["products"][0]["sku"] == "EK-VA4729-C16"
    assert result["products"][0]["stock"] == 42
    assert "Сертификат" in result["message"]


def test_demo_certificate_links_are_available():
    client = TestClient(app)

    assert client.get("/api/certificates/va4729").status_code == 200
    assert client.get("/api/certificates/vvg").status_code == 200
    assert client.get("/api/certificates/unknown").status_code == 404


def test_empty_stock_returns_available_alternative():
    result = ChatService(CatalogService()).respond("alternative", "Есть ли кабель ВВГнг-LS 3x2.5?")
    assert "отсутствует" in result["message"]
    assert result["products"]
    assert result["products"][0]["stock"] > 0
    assert "совпадает" in result["message"]


def test_purchase_conditions_are_answered():
    result = ChatService(CatalogService()).respond(
        "conditions", "Какие условия оплаты, доставки и минимальная партия?"
    )

    assert "Оплата:" in result["message"]
    assert "Доставка:" in result["message"]
    assert "Минимальная партия:" in result["message"]


def test_cart_requires_explicit_confirmation():
    service = ChatService(CatalogService())
    pending = service.respond("cart", "добавь 2 штуки ВА47-29 2P C16 в корзину")
    assert pending["requires_confirmation"] is True
    confirmed = service.respond("cart", "да, добавь")
    assert confirmed["action"] == {"type": "confirm_add", "sku": "EK-VA4729-C16", "quantity": 2}
    assert service.take_approved("cart", "EK-VA4729-C16", 2) is True
    assert service.take_approved("cart", "EK-VA4729-C16", 2) is False


def test_general_question_does_not_match_product_by_short_word():
    results = CatalogService().search("Чем вы можете помочь покупателю?")
    assert results == []


def test_cart_total_quantity_never_exceeds_stock():
    catalog = CatalogService()
    product = catalog.find_by_sku_or_name("ВА47-29 2P C16")
    cart = CartService()

    cart.add("stock-limit", product, 40)
    with pytest.raises(ValueError, match="Доступно только 42 шт"):
        cart.add("stock-limit", product, 3)

    assert cart.quantity("stock-limit", product["sku"]) == 40


def test_upload_rejects_unsupported_file_type():
    client = TestClient(app)
    response = client.post(
        "/api/chat/upload",
        data={"session_id": "upload-test", "message": "проверь файл"},
        files={"file": ("video.mp4", b"not-a-video", "video/mp4")},
    )

    assert response.status_code == 415
    assert "Поддерживаются" in response.json()["detail"]


def test_cart_api_rejects_add_without_chat_confirmation():
    client = TestClient(app)
    response = client.post(
        "/api/cart/confirm",
        json={
            "session_id": "no-confirmation",
            "sku": "EK-VA4729-C16",
            "quantity": 1,
        },
    )

    assert response.status_code == 403
    cart_response = client.get("/api/cart/no-confirmation")
    assert cart_response.json()["items"] == []


def test_cart_page_and_checkout_link_are_available():
    client = TestClient(app)
    cart_response = client.get("/api/cart/link-test")

    assert cart_response.status_code == 200
    assert cart_response.json()["checkout_url"] == "/cart?session_id=link-test"
    assert client.get("/cart?session_id=link-test").status_code == 200


def test_full_chat_confirmation_and_cart_api_flow():
    client = TestClient(app)
    session_id = "full-api-flow"

    request_add = client.post(
        "/api/chat",
        json={
            "session_id": session_id,
            "message": "добавь 2 штуки ВА47-29 2P C16 в корзину",
        },
    )
    assert request_add.status_code == 200
    assert request_add.json()["requires_confirmation"] is True
    assert client.get(f"/api/cart/{session_id}").json()["items"] == []

    approval = client.post(
        "/api/chat",
        json={"session_id": session_id, "message": "да, добавь"},
    )
    action = approval.json()["action"]
    confirmed = client.post(
        "/api/cart/confirm",
        json={"session_id": session_id, "sku": action["sku"], "quantity": action["quantity"]},
    )

    assert confirmed.status_code == 200
    assert confirmed.json()["items"][0]["quantity"] == 2
    assert confirmed.json()["checkout_url"] == f"/cart?session_id={session_id}"
