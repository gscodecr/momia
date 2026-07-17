import json
import models
from database import SessionLocal

db = SessionLocal()

# Find payments that are from store (description contains "Compra Tienda") but don't have an order
payments = db.query(models.Payment).filter(models.Payment.description.like("Compra Tienda%")).all()

for p in payments:
    order_exists = db.query(models.Order).filter(models.Order.payment_id == p.id).first()
    if not order_exists:
        # Create a mock items_json from the description
        # e.g. "Compra Tienda: 2x Test Producto"
        desc_parts = p.description.split("Compra Tienda: ")
        items_json = "[]"
        if len(desc_parts) > 1:
            items_str = desc_parts[1]
            items = []
            for item_str in items_str.split(", "):
                qty_name = item_str.split("x ", 1)
                if len(qty_name) == 2:
                    items.append({
                        "product_id": -1, # Dummy ID for reconstructed
                        "quantity": int(qty_name[0]),
                        "name_fallback": qty_name[1] # We can't really do this properly but let's try
                    })
            items_json = json.dumps(items)
        
        # We need the product name to show up in the frontend.
        # Frontend relies on `product_id` to lookup the name in `products`. 
        # If product is deleted, it says "Producto Eliminado" but shows the quantity, color, etc.
        # So we'll just put it in and let the frontend say "Producto Eliminado" or we can try to find the product ID.
        
        # Let's see if we can find the product ID by name
        for item in items:
            prod = db.query(models.Product).filter(models.Product.name == item.get("name_fallback")).first()
            if prod:
                item["product_id"] = prod.id
        
        items_json = json.dumps(items)

        order = models.Order(
            user_id=p.user_id,
            payment_id=p.id,
            items_json=items_json,
            total_amount=p.amount,
            status="PENDIENTE"
        )
        db.add(order)
        print(f"Created order for payment {p.id}")

db.commit()
print("Backfill complete.")
