from copy import deepcopy


class CartService:
    def __init__(self):
        self._carts: dict[str, list[dict]] = {}

    def get(self, session_id: str) -> list[dict]:
        return deepcopy(self._carts.get(session_id, []))

    def add(self, session_id: str, product: dict, quantity: int) -> list[dict]:
        cart = self._carts.setdefault(session_id, [])
        for line in cart:
            if line["sku"] == product["sku"]:
                line["quantity"] += quantity
                break
        else:
            cart.append({"sku": product["sku"], "name": product["name"], "price": product["price"], "quantity": quantity})
        return self.get(session_id)

    @staticmethod
    def total(cart: list[dict]) -> int:
        return sum(item["price"] * item["quantity"] for item in cart)

