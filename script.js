// Initialize localStorage with default data if not exists
function initializeLocalStorage() {
    if (!localStorage.getItem('users')) {
        const defaultUsers = [
            { username: 'admin', password: 'admin123', role: 'admin' },
            { username: 'staff', password: 'staff123', role: 'staff' }
        ];
        localStorage.setItem('users', JSON.stringify(defaultUsers));
    }

    if (!localStorage.getItem('products')) {
        const defaultProducts = [
            { id: 1, name: 'Product 1', price: 100, category: 'Category 1', stock: 50 },
            { id: 2, name: 'Product 2', price: 200, category: 'Category 2', stock: 30 },
            { id: 3, name: 'Product 3', price: 150, category: 'Category 1', stock: 40 }
        ];
        localStorage.setItem('products', JSON.stringify(defaultProducts));
    }

    if (!localStorage.getItem('transactions')) {
        localStorage.setItem('transactions', JSON.stringify([]));
    }
}

// Get current user from localStorage
function getCurrentUser() {
    return JSON.parse(localStorage.getItem('currentUser'));
}

// Check if user is logged in
function checkAuth() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    // Update user info in header
    const userInfo = document.querySelector('.user-info');
    if (userInfo) {
        userInfo.textContent = `Welcome, ${currentUser.username}`;
    }
}

// Logout function
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// Format currency
function formatCurrency(amount) {
    return '₱' + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// Show alert message
function showAlert(message, type = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;

    const mainContent = document.querySelector('.main-content');
    mainContent.insertBefore(alertDiv, mainContent.firstChild);

    // Remove alert after 3 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}

// Handle navigation
function handleNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const target = item.getAttribute('data-target');
            
            // Update active states
            navItems.forEach(nav => nav.classList.remove('active'));
            sections.forEach(section => section.classList.remove('active'));
            
            item.classList.add('active');
            document.getElementById(target).classList.add('active');
        });
    });
}

// Initialize dashboard
function initializeDashboard() {
    // Check authentication
    checkAuth();
    
    // Set up navigation
    setupNavigation();
    
    // Set up logout button
    setupLogout();
    
    // Show default section
    showSection('monitoring');
}

// Setup logout button
function setupLogout() {
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
}

// Setup navigation
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const target = item.dataset.target;
            if (target) {
                showSection(target);
            }
        });
    });
}

// Show selected section
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });

    // Show selected section
    const selectedSection = document.getElementById(sectionId);
    if (selectedSection) {
        selectedSection.classList.add('active');
    }

    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.target === sectionId) {
            item.classList.add('active');
        }
    });
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeDashboard);

// Initialize supplies in localStorage if not exists
if (!localStorage.getItem('supplies')) {
    localStorage.setItem('supplies', JSON.stringify([]));
}

// Load supplies
function loadSupplies() {
    const supplies = JSON.parse(localStorage.getItem('supplies')) || [];
    const tbody = document.querySelector('#suppliesTable tbody');
    
    if (supplies.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No supplies found</td></tr>';
        return;
    }
    
    tbody.innerHTML = supplies.map(supply => `
        <tr>
            <td>${supply.supplier}</td>
            <td>${supply.product}</td>
            <td>${supply.quantity}</td>
            <td>${new Date(supply.date).toLocaleDateString()}</td>
            <td>
                <span class="status-badge ${getSupplyStatusClass(supply)}">
                    ${supply.status}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="updateSupplyStatus(${supply.id}, 'Received')">
                    <i class="fas fa-check"></i> Mark Received
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteSupply(${supply.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Show add supply modal
function showAddSupplyModal() {
    const modal = document.getElementById('addSupplyModal');
    const productSelect = document.getElementById('supplyProduct');
    const products = JSON.parse(localStorage.getItem('products')) || [];
    
    // Populate product select
    productSelect.innerHTML = '<option value="">Select Product</option>' +
        products.map(product => `
            <option value="${product.name}">${product.name}</option>
        `).join('');
    
    // Set default date to today
    document.getElementById('supplyDate').valueAsDate = new Date();
    
    modal.style.display = 'block';
}

// Handle add supply form submission
document.getElementById('addSupplyForm').onsubmit = function(e) {
    e.preventDefault();
    
    const supplies = JSON.parse(localStorage.getItem('supplies')) || [];
    const newSupply = {
        id: Date.now(),
        supplier: document.getElementById('supplierName').value,
        product: document.getElementById('supplyProduct').value,
        quantity: parseInt(document.getElementById('supplyQuantity').value),
        date: document.getElementById('supplyDate').value,
        status: 'Pending'
    };
    
    supplies.push(newSupply);
    localStorage.setItem('supplies', JSON.stringify(supplies));
    
    document.getElementById('addSupplyModal').style.display = 'none';
    loadSupplies();
    showAlert('Supply added successfully');
};

// Update supply status
function updateSupplyStatus(supplyId, newStatus) {
    const supplies = JSON.parse(localStorage.getItem('supplies')) || [];
    const supplyIndex = supplies.findIndex(s => s.id === supplyId);
    
    if (supplyIndex !== -1) {
        supplies[supplyIndex].status = newStatus;
        
        // If status is "Received", update product stock
        if (newStatus === 'Received') {
            const products = JSON.parse(localStorage.getItem('products')) || [];
            const productIndex = products.findIndex(p => p.name === supplies[supplyIndex].product);
            
            if (productIndex !== -1) {
                products[productIndex].stock += supplies[supplyIndex].quantity;
                localStorage.setItem('products', JSON.stringify(products));
            }
        }
        
        localStorage.setItem('supplies', JSON.stringify(supplies));
        loadSupplies();
        showAlert('Supply status updated successfully');
    }
}

// Delete supply
function deleteSupply(supplyId) {
    if (confirm('Are you sure you want to delete this supply?')) {
        const supplies = JSON.parse(localStorage.getItem('supplies')) || [];
        const updatedSupplies = supplies.filter(s => s.id !== supplyId);
        localStorage.setItem('supplies', JSON.stringify(updatedSupplies));
        loadSupplies();
        showAlert('Supply deleted successfully');
    }
}

// Get supply status class
function getSupplyStatusClass(supply) {
    switch (supply.status) {
        case 'Pending':
            return 'status-pending';
        case 'Received':
            return 'status-received';
        default:
            return '';
    }
}

// Add event listener for supplies section
document.querySelector('[data-target="supplies"]').addEventListener('click', function() {
    showSection('supplies');
    loadSupplies();
});

// Add styles for supplies
const suppliesStyle = document.createElement('style');
suppliesStyle.textContent = `
    .status-badge {
        padding: 5px 10px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
    }

    .status-pending {
        background: #fff3cd;
        color: #856404;
    }

    .status-received {
        background: #d4edda;
        color: #155724;
    }
`;
document.head.appendChild(suppliesStyle); 