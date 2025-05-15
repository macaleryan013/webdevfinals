// Initialize variables
let cart = [];
let currentPaymentMethod = 'cash';

// DOM Elements
const productsGrid = document.getElementById('productsGrid');
const cartItems = document.getElementById('cartItems');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const subtotalElement = document.getElementById('subtotal');
const taxElement = document.getElementById('tax');
const totalElement = document.getElementById('total');
const amountReceivedInput = document.getElementById('amountReceived');
const changeInput = document.getElementById('change');
const receiptModal = document.getElementById('receiptModal');

// Go to dashboard function
function goToDashboard() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        if (currentUser.role === 'admin') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'staff.html';
        }
    } else {
        window.location.href = 'index.html';
    }
}

// Initialize the POS system
function initializePOS() {
    loadProducts();
    setupEventListeners();
    updateCartSummary();
}

// Load products from localStorage
function loadProducts() {
    const products = JSON.parse(localStorage.getItem('products')) || [];
    displayProducts(products);
    updateCategoryFilter(products);
}

// Display products in the grid
function displayProducts(products) {
    productsGrid.innerHTML = products.map(product => `
        <div class="product-card" onclick="addToCart(${product.id})">
            <h3>${product.name}</h3>
            <div class="price">${formatCurrency(product.price)}</div>
            <div class="stock">Stock: ${product.stock}</div>
        </div>
    `).join('');
}

// Update category filter options
function updateCategoryFilter(products) {
    const categories = [...new Set(products.map(p => p.category))];
    categoryFilter.innerHTML = `
        <option value="">All Categories</option>
        ${categories.map(category => `
            <option value="${category}">${category}</option>
        `).join('')}
    `;
}

// Setup event listeners
function setupEventListeners() {
    // Search functionality
    searchInput.addEventListener('input', filterProducts);
    categoryFilter.addEventListener('change', filterProducts);

    // Payment method selection
    document.querySelectorAll('.payment-method').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.payment-method').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentPaymentMethod = button.dataset.method;
            updatePaymentDetails();
        });
    });

    // Amount received input
    amountReceivedInput.addEventListener('input', calculateChange);
}

// Filter products based on search and category
function filterProducts() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedCategory = categoryFilter.value;
    const products = JSON.parse(localStorage.getItem('products')) || [];

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm);
        const matchesCategory = !selectedCategory || product.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    displayProducts(filteredProducts);
}

// Add product to cart
function addToCart(productId) {
    const products = JSON.parse(localStorage.getItem('products')) || [];
    const product = products.find(p => p.id === productId);

    if (!product || product.stock <= 0) {
        alert('Product is out of stock!');
        return;
    }

    const cartItem = cart.find(item => item.id === productId);
    if (cartItem) {
        if (cartItem.quantity < product.stock) {
            cartItem.quantity++;
        } else {
            alert(`Only ${product.stock} items available in stock!`);
            return;
        }
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1
        });
    }

    updateCart();
}

// Update recent items display
function updateRecentItems(productName, quantity, price) {
    const recentItems = document.getElementById('recentItems');
    const recentItem = document.createElement('div');
    recentItem.className = 'recent-item';
    recentItem.innerHTML = `
        <div>
            <div class="recent-item-name">${productName}</div>
            <div class="recent-item-quantity">Quantity: ${quantity}</div>
        </div>
        <div class="recent-item-price">${formatCurrency(price * quantity)}</div>
    `;

    // Add new item at the top
    recentItems.insertBefore(recentItem, recentItems.firstChild);

    // Keep only the last 3 items
    while (recentItems.children.length > 3) {
        recentItems.removeChild(recentItems.lastChild);
    }

    // Remove item after 5 seconds
    setTimeout(() => {
        if (recentItem.parentNode === recentItems) {
            recentItems.removeChild(recentItem);
        }
    }, 5000);
}

// Update cart display
function updateCart() {
    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <div class="price">${formatCurrency(item.price)} each</div>
            </div>
            <div class="cart-item-quantity">
                <button onclick="updateQuantity(${item.id}, -1)" title="Decrease quantity">
                    <i class="fas fa-minus"></i>
                </button>
                <span>${item.quantity}</span>
                <button onclick="updateQuantity(${item.id}, 1)" title="Increase quantity">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
            <div class="cart-item-total">
                ${formatCurrency(item.price * item.quantity)}
            </div>
        </div>
    `).join('');

    // Update cart badge
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartBadge = document.getElementById('cartBadge');
    cartBadge.textContent = totalItems;
    
    if (totalItems > 0) {
        cartBadge.classList.add('active');
        cartBadge.classList.add('pulse');
        setTimeout(() => cartBadge.classList.remove('pulse'), 500);
    } else {
        cartBadge.classList.remove('active');
    }

    updateCartSummary();
}

// Update item quantity
function updateQuantity(productId, change) {
    const products = JSON.parse(localStorage.getItem('products')) || [];
    const product = products.find(p => p.id === productId);
    const cartItem = cart.find(item => item.id === productId);

    if (!cartItem) return;

    const newQuantity = cartItem.quantity + change;

    if (newQuantity <= 0) {
        if (confirm('Remove this item from cart?')) {
            cart = cart.filter(item => item.id !== productId);
        } else {
            return;
        }
    } else if (newQuantity <= product.stock) {
        cartItem.quantity = newQuantity;
    } else {
        alert(`Only ${product.stock} items available in stock!`);
        return;
    }

    updateCart();
}

// Update cart summary
function updateCartSummary() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal;

    subtotalElement.textContent = formatCurrency(subtotal);
    totalElement.textContent = formatCurrency(total);

    calculateChange();
}

// Calculate change
function calculateChange() {
    if (currentPaymentMethod === 'cash') {
        const amountReceived = parseFloat(amountReceivedInput.value) || 0;
        const total = parseFloat(totalElement.textContent.replace('₱', '').replace(',', ''));
        const change = amountReceived - total;
        changeInput.value = formatCurrency(Math.max(0, change));
    }
}

// Update payment details based on selected method
function updatePaymentDetails() {
    document.querySelectorAll('.payment-detail').forEach(detail => {
        detail.classList.remove('active');
    });

    const selectedDetail = document.getElementById(`${currentPaymentMethod}Payment`);
    if (selectedDetail) {
        selectedDetail.classList.add('active');
    }

    if (currentPaymentMethod !== 'cash') {
        amountReceivedInput.value = totalElement.textContent;
        changeInput.value = formatCurrency(0);
    }
}

// Clear cart
function clearCart() {
    if (confirm('Are you sure you want to clear the cart?')) {
        cart = [];
        updateCart();
    }
}

// Complete sale
function completeSale() {
    if (cart.length === 0) {
        alert('Cart is empty!');
        return;
    }

    const total = parseFloat(totalElement.textContent.replace('₱', '').replace(',', ''));
    const amountReceived = parseFloat(amountReceivedInput.value) || 0;

    if (currentPaymentMethod === 'cash' && amountReceived < total) {
        alert('Insufficient payment!');
        return;
    }

    // Update product stock
    const products = JSON.parse(localStorage.getItem('products')) || [];
    cart.forEach(item => {
        const product = products.find(p => p.id === item.id);
        if (product) {
            product.stock -= item.quantity;
        }
    });
    localStorage.setItem('products', JSON.stringify(products));

    // Save transaction
    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const transaction = {
        id: generateTransactionId(),
        date: new Date().toISOString(),
        items: cart,
        subtotal: parseFloat(subtotalElement.textContent.replace('₱', '').replace(',', '')),
        total: total,
        paymentMethod: currentPaymentMethod,
        amountReceived: amountReceived,
        change: parseFloat(changeInput.value.replace('₱', '').replace(',', '')),
        cashier: currentUser.username
    };
    transactions.push(transaction);
    localStorage.setItem('transactions', JSON.stringify(transactions));

    // Show receipt
    showReceipt(transaction);

    // Clear cart
    cart = [];
    updateCart();
}

// Generate transaction ID
function generateTransactionId() {
    return 'TRX' + Date.now().toString().slice(-6);
}

// Show receipt
function showReceipt(transaction) {
    const receiptBody = document.getElementById('receiptBody');
    const receiptDate = document.getElementById('receiptDate');

    receiptBody.innerHTML = `
        <div style="margin-bottom: 10px;">
            ${transaction.items.map(item => `
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span>${item.name} x${item.quantity}</span>
                    <span>${formatCurrency(item.price * item.quantity)}</span>
                </div>
            `).join('')}
        </div>
        <div style="border-top: 1px dashed #ddd; margin: 10px 0; padding-top: 10px;">
            <div style="display: flex; justify-content: space-between;">
                <span>Subtotal:</span>
                <span>${formatCurrency(transaction.subtotal)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-weight: bold;">
                <span>Total:</span>
                <span>${formatCurrency(transaction.total)}</span>
            </div>
        </div>
        <div style="border-top: 1px dashed #ddd; margin: 10px 0; padding-top: 10px;">
            <div style="display: flex; justify-content: space-between;">
                <span>Payment Method:</span>
                <span>${transaction.paymentMethod.toUpperCase()}</span>
            </div>
            ${transaction.paymentMethod === 'cash' ? `
                <div style="display: flex; justify-content: space-between;">
                    <span>Amount Received:</span>
                    <span>${formatCurrency(transaction.amountReceived)}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>Change:</span>
                    <span>${formatCurrency(transaction.change)}</span>
                </div>
            ` : ''}
        </div>
    `;

    receiptDate.textContent = new Date(transaction.date).toLocaleString();
    receiptModal.style.display = 'block';
}

// Print receipt
function printReceipt() {
    const receiptContent = document.querySelector('.receipt').innerHTML;
    const printWindow = window.open('', '', 'height=600,width=800');
    
    printWindow.document.write(`
        <html>
            <head>
                <title>Receipt</title>
                <style>
                    body { font-family: 'Courier New', monospace; }
                    .receipt { padding: 20px; }
                </style>
            </head>
            <body>
                <div class="receipt">${receiptContent}</div>
            </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
}

// Close receipt
function closeReceipt() {
    receiptModal.style.display = 'none';
}

// Format currency
function formatCurrency(amount) {
    return '₱' + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

// Initialize POS system when DOM is loaded
document.addEventListener('DOMContentLoaded', initializePOS); 