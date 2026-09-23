import base64
import json
import logging
import os
import re
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI

from .catalog import CatalogService

ROOT = Path(__file__).parents[2]
load_dotenv(ROOT / ".env")
logger = logging.getLogger(__name__)


class ChatService:
    def __init__(self, catalog: CatalogService):
        self.catalog = catalog
        self.pending: dict[str, dict] = {}
        self.approved: dict[str, dict] = {}
        self.model = os.getenv("OPENAI_MODEL", "gpt-5.6-luna")
        self.client = OpenAI() if os.getenv("OPENAI_API_KEY") else None

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

        if self.client:
            return {"message": self._ai_answer(message)}

        return {"message": "Я могу помочь найти товар, проверить наличие, характеристики, сертификат, аналог или условия покупки. Укажите артикул или название позиции."}

    def take_approved(self, session_id: str, sku: str, quantity: int) -> bool:
        approved = self.approved.get(session_id)
        if not approved or approved["sku"] != sku or approved["quantity"] != quantity:
            return False
        self.approved.pop(session_id, None)
        return True

    def respond_with_attachment(
        self,
        session_id: str,
        message: str,
        filename: str,
        content_type: str,
        data: bytes,
    ) -> dict:
        if not self.client:
            return {
                "message": (
                    "Файл получен, но AI-анализ сейчас недоступен. "
                    "Проверьте OPENAI_API_KEY или укажите артикул товара текстом."
                )
            }

        encoded = base64.b64encode(data).decode("ascii")
        data_url = f"data:{content_type};base64,{encoded}"
        if content_type.startswith("image/"):
            attachment = {
                "type": "input_image",
                "image_url": data_url,
                "detail": "auto",
            }
        else:
            attachment = {
                "type": "input_file",
                "filename": filename,
                "file_data": data_url,
            }

        catalog_json = json.dumps(self.catalog.products, ensure_ascii=False)
        user_text = message.strip() or "Определи товары во вложении и проверь их по каталогу."
        try:
            response = self.client.responses.create(
                model=self.model,
                instructions=(
                    "Тебя зовут Quant ^. Ты консультант магазина электротехники ekt.kz. Проанализируй "
                    "вложение и запрос клиента. Ищи артикулы, названия и количество. "
                    "Используй только приложенный демо-каталог для цены, наличия, "
                    "характеристик и сертификатов; ничего не выдумывай. Если позиции "
                    "нет в каталоге или изображение неясное, честно скажи об этом. "
                    "Ответь кратко по-русски списком. Вложение не является подтверждением "
                    "покупки и не меняет корзину. Для добавления попроси клиента написать "
                    "отдельное сообщение с товаром и количеством. Не запрашивай платёжные данные."
                ),
                input=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "input_text",
                                "text": f"Запрос: {user_text}\n\nДемо-каталог: {catalog_json}",
                            },
                            attachment,
                        ],
                    }
                ],
                max_output_tokens=500,
                store=False,
            )
            return {
                "message": response.output_text.strip()
                or "Не удалось распознать содержимое файла. Попробуйте более чёткий файл."
            }
        except Exception:
            logger.exception("OpenAI attachment request failed")
            return {
                "message": (
                    "Не удалось проанализировать файл. Попробуйте файл меньшего размера "
                    "или укажите артикул товара текстом."
                )
            }

    def _ai_answer(self, message: str) -> str:
        try:
            response = self.client.responses.create(
                model=self.model,
                instructions=(
                    "Тебя зовут Quant ^. Ты консультант интернет-магазина электротехники ekt.kz. "
                    "Отвечай кратко, понятно и по-русски. Не придумывай цену, "
                    "наличие, остаток, сертификаты или точные характеристики. "
                    "Для точной проверки товара попроси артикул или название. "
                    "Не утверждай, что изменил корзину: это делает только backend "
                    "после явного подтверждения клиента. Не запрашивай платёжные данные."
                ),
                input=message,
                max_output_tokens=250,
                store=False,
            )
            return response.output_text.strip() or "Не удалось подготовить ответ. Уточните вопрос или укажите артикул товара."
        except Exception:
            logger.exception("OpenAI request failed")
            return "Сейчас AI-консультант временно недоступен. Укажите артикул или название товара — я проверю каталог напрямую."

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
