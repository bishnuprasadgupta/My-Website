const orderDialog = document.querySelector("#order-dialog");
const orderForm = document.querySelector("#order-form");
const selectedCoffeeName = document.querySelector("#selected-coffee-name");
const selectedCoffeePrice = document.querySelector("#selected-coffee-price");
const orderSize = document.querySelector("#order-size");
const orderQuantity = document.querySelector("#order-quantity");
const orderTotal = document.querySelector("#order-total");
const orderToast = document.querySelector("#order-toast");
const shareButton = document.querySelector("#share-button");
const shareDialog = document.querySelector("#share-dialog");
const shareUrl = document.querySelector("#share-url");
const shareDescription = document.querySelector("#share-description");
const copyLinkButton = document.querySelector("#copy-link-button");

let basePrice = 0;
let toastTimer;

const formatPrice = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const updateOrderTotal = () => {
  const sizeExtra = Number(orderSize.selectedOptions[0].dataset.extra);
  const quantity = Number(orderQuantity.value) || 1;
  orderTotal.textContent = formatPrice((basePrice + sizeExtra) * quantity);
};

document.querySelectorAll("[data-order]").forEach((button) => {
  button.addEventListener("click", () => {
    const card = button.closest(".coffee-card");
    const name = card.querySelector(".card-title h3").textContent.trim();
    const priceText = card.querySelector(".card-price").textContent;
    basePrice = Number(priceText.replace(/[^\d]/g, ""));

    selectedCoffeeName.textContent = name;
    selectedCoffeePrice.textContent = formatPrice(basePrice);
    orderForm.reset();
    orderSize.value = "Regular";
    orderQuantity.value = "1";
    updateOrderTotal();
    orderDialog.showModal();
    document.querySelector("#order-name").focus();
  });
});

document.querySelector("[data-close-order]").addEventListener("click", () => {
  orderDialog.close();
});

orderSize.addEventListener("change", updateOrderTotal);
orderQuantity.addEventListener("input", updateOrderTotal);

orderForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!orderForm.reportValidity()) {
    return;
  }

  const formData = new FormData(orderForm);
  const name = formData.get("customerName").trim();
  const coffee = selectedCoffeeName.textContent;
  const quantity = Number(formData.get("quantity"));
  const total = orderTotal.textContent;
  const pickup = formData.get("pickup");
  const orderNumber = `${Date.now().toString().slice(-6)}`;

  orderDialog.close();
  orderToast.replaceChildren();

  const heading = document.createElement("strong");
  heading.textContent = `Order #${orderNumber} placed!`;
  const details = document.createElement("span");
  details.textContent = ` Thanks, ${name} — ${quantity} ${coffee}${quantity === 1 ? "" : "s"} for ${total}. Pickup: ${pickup}.`;

  orderToast.append(heading, details);
  orderToast.hidden = false;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    orderToast.hidden = true;
  }, 8000);
});

const showShareDialog = () => {
  shareUrl.value = window.location.href;
  shareDescription.textContent =
    window.location.protocol === "file:"
      ? "This page is opened from a local file. Publish it online first so other people can open the link."
      : "Send this link to someone who loves coffee.";
  copyLinkButton.textContent = "Copy link";
  shareDialog.showModal();
};

shareButton.addEventListener("click", async () => {
  if (window.location.protocol !== "file:" && typeof navigator.share === "function") {
    try {
      await navigator.share({
        title: document.title,
        text: "Take a look at RR-Roast & Ritual by Bishnu Prasad Gupta.",
        url: window.location.href,
      });
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
    }
  }

  showShareDialog();
});

document.querySelector("[data-close-share]").addEventListener("click", () => {
  shareDialog.close();
});

copyLinkButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(shareUrl.value);
    copyLinkButton.textContent = "Copied!";
  } catch {
    shareUrl.focus();
    shareUrl.select();
    copyLinkButton.textContent = "Press Ctrl+C";
  }
});
