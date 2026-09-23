import re

from .catalog import CatalogService


class ChatService:
    def __init__(self, catalog: CatalogService):
        self.catalog = catalog
        self.pending: dict[str, dict] = {}
        self.approved: dict[str, dict] = {}

    def respond(self, session_id: str, message: str) -> dict:
        text = message.lower().strip()
        if self._is_confirmation(text) and session_id in self.pending:
            pending = self.pending.pop(session_id)
            self.approved[session_id] = pending
            return {"message": "Подтверждение получено. Можно добавить товар в корзину.", "action": {"type": "confirm_add", **pending}}

        if self._is_conditions(text):
            return {"message": "Оплата: безналичный расчёт и другие доступные способы на этапе оформления. Доставка: по Казахстану, условия и стоимость зависят от города и заказа. Минимальная партия: уточняется по выбранной позиции; для единичных товаров — от 1 штуки."}

        quantity = self._quantity(text)
        product = self.catalog.find_by_sku_or_name(text)
        if product:
            if product["stock"] <= 0:
                alternatives = self.catalog.alternatives(product)
                return {"message": f"{product['name']} сейчас отсутствует на складе. Рекомендую аналог: {alternatives[0]['name']} — совпадает категория и сечение, доступно {alternatives[0]['stock']} шт.", "products": alternatives[:2]}
            if self._is_add_request(text):
                quantity = min(quantity, product["stock"])
                self.pending[session_id] = {"sku": product["sku"], "quantity": quantity}
                return {"message": f"Добавить {quantity} шт. товара «{product['name']}» в корзину? Остаток: {product['stock']} шт. Ответьте «да, добавь», чтобы подтвердить.", "products": [product], "requires_confirmation": True}
            return {"message": self._product_answer(product), "products": [product]}

        return {"message": "Я могу помочь найти товар, проверить наличие, характеристики, сертификат, аналог или условия покупки. Укажите артикул или название позиции."}

    def take_approved(self, session_id: str, sku: str, quantity: int) -> bool:
        approved = self.approved.get(session_id)
        if not approved or approved["sku"] != sku or approved["quantity"] != quantity:
            return False
        self.approved.pop(session_id, None)
        return True

    @staticmethod
    def _product_answer(product: dict) -> str:
        certificate = f" Сертификат: {product['certificate']['name']} — {product['certificate']['url']}" if product.get("certificate") else " Сертификат в демо-каталоге не указан."
        characteristics = "; ".join(f"{key}: {value}" for key, value in product["characteristics"].items())
        return f"{product['name']} — {product['price']} ₸. Наличие: {product['stock']} шт. на складе «{product['warehouse']}». Характеристики: {characteristics}.{certificate}"

    @staticmethod
    def _is_conditions(text: str) -> bool:
        return any(word in text for word in ("оплат", "достав", "минимальн", "услови"))

    @staticmethod
    def _is_add_request(text: str) -> bool:
        return any(word in text for word in ("добав", "положи", "в корзин"))

    @staticmethod
    def _is_confirmation(text: str) -> bool:
        return bool(re.search(r"\b(да|подтверждаю|добавляй|добавь)\b", text))

    @staticmethod
    def _quantity(text: str) -> int:
        match = re.search(r"\b(\d+)\s*(?:шт|штук|ед|единиц)?\b", text)
        return max(1, int(match.group(1))) if match else 1
