from app.catalog import CatalogService
from app.chat import ChatService


def test_catalog_product_answer():
    result = ChatService(CatalogService()).respond("product", "Есть ли автомат ВА47-29 2P C16?")
    assert result["products"][0]["sku"] == "EK-VA4729-C16"
    assert result["products"][0]["stock"] == 42
    assert "Сертификат" in result["message"]


def test_empty_stock_returns_available_alternative():
    result = ChatService(CatalogService()).respond("alternative", "Есть ли кабель ВВГнг-LS 3x2.5?")
    assert "отсутствует" in result["message"]
    assert result["products"]
    assert result["products"][0]["stock"] > 0


def test_cart_requires_explicit_confirmation():
    service = ChatService(CatalogService())
    pending = service.respond("cart", "добавь 2 штуки ВА47-29 2P C16 в корзину")
    assert pending["requires_confirmation"] is True
    confirmed = service.respond("cart", "да, добавь")
    assert confirmed["action"] == {"type": "confirm_add", "sku": "EK-VA4729-C16", "quantity": 2}
    assert service.take_approved("cart", "EK-VA4729-C16", 2) is True
    assert service.take_approved("cart", "EK-VA4729-C16", 2) is False
