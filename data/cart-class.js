class Cart {
  cartItems;
  #localStorageKey;

  constructor(localStorageKey) {
    this.#localStorageKey = localStorageKey;
    this.#loadFromStorage();
  }

  #loadFromStorage() {
    this.cartItems = JSON.parse(localStorage.getItem(this.#localStorageKey));

    if (!Array.isArray(this.cartItems)) this.cartItems = [];
  }

  saveToStorage() {
    localStorage.setItem(this.#localStorageKey, JSON.stringify(this.cartItems));
  }

  addToCart(productId, quantity) {
    const matchingItem = this.getMatchingItem(productId);

    if (matchingItem) {
      matchingItem.quantity += quantity;
    } else {
      this.cartItems.push({
        productId,
        quantity,
        deliveryOptionId: '1'
      });
    }

    this.saveToStorage();
  }

  updateDeliveryOption(productId, deliveryOptionId) {
    const matchingItem = this.getMatchingItem(productId);

    matchingItem.deliveryOptionId = deliveryOptionId;
    this.saveToStorage();
  }

  getMatchingItem(productId) {
    let matchingItem;

    this.cartItems.forEach((cartItem) => {
      if (productId === cartItem.productId) {
        matchingItem = cartItem;
      }
    });
    return matchingItem;
  }

  removeFromCart(productId) {
    const newCart = [];

    this.cartItems.forEach((cartItem) => {
      if (productId !== cartItem.productId) {
        newCart.push(cartItem);
      }
    });

    this.cartItems = newCart;
    this.saveToStorage();
  }

  updateQuantity(productId, newQuantity) {
    const matchingItem = this.getMatchingItem(productId);

    matchingItem.quantity = newQuantity;
    this.saveToStorage();
  }

  calculateCartQuantity() {
    let cartQuantity = 0;

    this.cartItems.forEach((cartItem) => {
      cartQuantity += cartItem.quantity;
    });
    return cartQuantity;
  }

  removeUnavailableItems(availableProductIds) {
    const availableIds = new Set(availableProductIds);
    const availableItems = this.cartItems.filter((item) => availableIds.has(item.productId));

    if (availableItems.length !== this.cartItems.length) {
      this.cartItems = availableItems;
      this.saveToStorage();
    }
  }

  resetCart() {
    const cart = [];
    this.cartItems = cart;
    this.saveToStorage();
  }
}

export const cart = new Cart('rogontra-cart-v1');
