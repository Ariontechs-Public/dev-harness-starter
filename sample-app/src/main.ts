import { subtotal } from "./cart";
import type { CartItem } from "./cart";

let items: CartItem[] = [
  { name: "T-shirt", price: 500, qty: 2 },
  { name: "Mug", price: 150, qty: 1 },
];

function render(): void {
  const app = document.getElementById("app");
  if (!app) return;
  app.innerHTML = `
    <h1>購物車</h1>
    <ul>
      ${items
        .map(
          (i, idx) =>
            `<li>${i.name} × ${i.qty} — $${i.price * i.qty}
              <button data-idx="${idx}">移除</button></li>`,
        )
        .join("")}
    </ul>
    <p>總額:$<span id="total">${subtotal(items)}</span></p>
  `;
  app.querySelectorAll<HTMLButtonElement>("button[data-idx]").forEach((btn) =>
    btn.addEventListener("click", () => {
      items.splice(Number(btn.dataset.idx), 1);
      render();
    }),
  );
}

render();
