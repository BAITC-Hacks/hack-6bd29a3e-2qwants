import json
import re
from pathlib import Path


class CatalogService:
    def __init__(self, path: str | None = None):
        catalog_path = Path(path or Path(__file__).parents[1] / "data" / "products.json")
        self.products = json.loads(catalog_path.read_text(encoding="utf-8"))

    @staticmethod
    def normalize(text: str) -> str:
        return re.sub(r"[^a-zа-яё0-9]+", " ", text.lower()).strip()

    def search(self, query: str) -> list[dict]:
        normalized = self.normalize(query)
        # Короткие служебные слова вроде «вы», «ли» и «на» не должны
        # случайно совпадать с частями названий товаров (например, «выключатель»).
        terms = [term for term in normalized.split() if len(term) > 2]
        scored = []
        for product in self.products:
            haystack = self.normalize(" ".join([
                product["sku"], product["name"], product["category"],
                " ".join(product["tags"]),
            ]))
            score = sum(1 for term in terms if term in haystack)
            if score:
                scored.append((score, product))
        return [product for _, product in sorted(scored, key=lambda item: item[0], reverse=True)]

    def find_by_sku_or_name(self, query: str) -> dict | None:
        results = self.search(query)
        return results[0] if results else None

    def alternatives(self, product: dict) -> list[dict]:
        candidates = []
        for item in self.products:
            if item["sku"] == product["sku"] or item["stock"] <= 0:
                continue
            same_category = item["category"] == product["category"]
            shared_tags = len(set(item["tags"]) & set(product["tags"]))
            if same_category or shared_tags:
                candidates.append((int(same_category) * 10 + shared_tags, item))
        return [item for _, item in sorted(candidates, key=lambda pair: pair[0], reverse=True)]
