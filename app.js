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
const loginForm = document.querySelector("#login-form");
const loginScreen = document.querySelector("#login-screen");
const installAppButton = document.querySelector("#install-app-button");
const installAppStatus = document.querySelector("#install-app-status");

let basePrice = 0;
let toastTimer;
let installPrompt;

if ("serviceWorker" in navigator && window.location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch((error) => {
      console.error("The coffee website could not be prepared for offline use.", error);
    });
  });
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPrompt = event;
});

installAppButton.addEventListener("click", async () => {
  if (!installPrompt) {
    installAppStatus.textContent =
      "To install, open your browser menu and choose Install app or Add to Home Screen.";
    installAppStatus.hidden = false;
    return;
  }

  const prompt = installPrompt;
  installPrompt = null;

  try {
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome === "accepted") {
      installAppStatus.hidden = true;
    } else {
      installAppStatus.textContent =
        "No problem. You can install RR Roast & Ritual later from your browser menu.";
      installAppStatus.hidden = false;
    }
  } catch (error) {
    console.error("The app installation prompt could not be opened.", error);
    installAppStatus.textContent =
      "The install prompt could not be opened. Try Install app from your browser menu.";
    installAppStatus.hidden = false;
  }
});

window.addEventListener("appinstalled", () => {
  installPrompt = null;
  installAppButton.hidden = true;
  installAppStatus.hidden = true;
});

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!loginForm.reportValidity()) {
    return;
  }

  loginScreen.hidden = true;
  document.body.classList.remove("logged-out");
  document.querySelector(".hero .button").focus();
});

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
  const design = formData.get("design");
  const quantity = Number(formData.get("quantity"));
  const total = orderTotal.textContent;
  const pickup = formData.get("pickup");
  const orderNumber = `${Date.now().toString().slice(-6)}`;

  orderDialog.close();
  orderToast.replaceChildren();

  const heading = document.createElement("strong");
  heading.textContent = `Order #${orderNumber} placed!`;
  const details = document.createElement("span");
  details.textContent = ` Thanks, ${name} — ${quantity} ${coffee}${quantity === 1 ? "" : "s"} with ${design} art for ${total}. Pickup: ${pickup}.`;

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

const scrollCup = document.querySelector(".scroll-cup-assembly");
const coffeeSplash = document.querySelector(".coffee-splash-overlay");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

if (scrollCup && coffeeSplash && !reduceMotion.matches) {
  let scrollFrame = 0;
  let sparkleTimer;
  let splashTimer;
  let lastScrollEventTime = performance.now();
  let lastScrollEventY = window.scrollY;
  const scrollSamples = [{ time: lastScrollEventTime, position: lastScrollEventY }];

  const updateCupPosition = () => {
    const scrollPosition = window.scrollY;
    scrollCup.style.setProperty("--cup-rotation", `${scrollPosition * 0.18}deg`);
    scrollCup.style.setProperty("--cup-bounce", `${Math.sin(scrollPosition * 0.035) * 2}px`);
    scrollFrame = 0;
  };

  const updateCupWhileScrolling = () => {
    updateCupPosition();
    scrollCup.classList.add("is-scrolling");
    window.clearTimeout(sparkleTimer);
    sparkleTimer = window.setTimeout(() => {
      scrollCup.classList.remove("is-scrolling");
    }, 420);
  };

  updateCupPosition();

  window.addEventListener(
    "scroll",
    () => {
      const now = performance.now();
      const scrollY = window.scrollY;
      const eventElapsed = Math.max(now - lastScrollEventTime, 1);
      const eventSpeed = Math.abs(scrollY - lastScrollEventY) / eventElapsed;
      lastScrollEventTime = now;
      lastScrollEventY = scrollY;
      scrollSamples.push({ time: now, position: scrollY });

      while (scrollSamples.length > 1 && now - scrollSamples[0].time > 220) {
        scrollSamples.shift();
      }

      const sampleDuration = now - scrollSamples[0].time;
      let sampleDistance = 0;
      for (let index = 1; index < scrollSamples.length; index += 1) {
        sampleDistance += Math.abs(
          scrollSamples[index].position - scrollSamples[index - 1].position
        );
      }
      const sampleSpeed = sampleDistance / Math.max(sampleDuration, 1);
      const isFastScroll =
        sampleDuration >= 45 &&
        sampleDuration <= 220 &&
        sampleDistance >= 180 &&
        sampleSpeed >= 1.8 &&
        eventSpeed >= 1.8;

      window.clearTimeout(splashTimer);
      if (isFastScroll) {
        coffeeSplash.classList.add("is-active");
        splashTimer = window.setTimeout(() => {
          coffeeSplash.classList.remove("is-active");
        }, 280);
      } else {
        coffeeSplash.classList.remove("is-active");
      }

      if (!scrollFrame) {
        scrollFrame = window.requestAnimationFrame(updateCupWhileScrolling);
      }
    },
    { passive: true }
  );
}
