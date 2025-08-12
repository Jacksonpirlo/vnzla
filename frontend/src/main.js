import axios from "axios";
// routes
const routes = {

  // Users
  "/users": "../public/template/user/users.html",
  "/newuser": "../public/template/user/addUser.html",

  // Products
  "/products": "../public/template/product/products.html",
  "/newproduct": "../public/template/product/addProduct.html",
  "/editProduct": "../public/template/product/editProduct.html",
  "/uploadData": "../public/template/csv/csv.html",
  // Alias para evitar error por mayúsculas/minúsculas
  "/uploaddata": "../public/template/csv/csv.html",

  // Login and Register
  "/registerUser": "../public/template/auth/registerUser.html",
  "/login": "../public/template/auth/login.html"
};

function isAuth() {
  const result = localStorage.getItem("Auth") || null;
  const resultBool = result === "true";
  return resultBool;
}


function setupNavigation() {
  const nav = document.getElementById("nav");
  
  if (!nav) return;
  
  const userRole = localStorage.getItem("role");

  if (!isAuth()) {
    nav.innerHTML = `
      <a href="/login" data-link>Login</a>
      <a href="/registerUser" data-link>Register</a>
    `;
    return;
  }
  
  if (userRole === "admin") {
    nav.innerHTML = `
      <a href="/products" data-link>Productos</a>
      <a href="/newproduct" data-link>Nuevo Producto</a>
      <a href="/uploadData" data-link>Upload Data</a>
      <a href="/logout" data-link id="close-sesion">Logout</a>
    `;
  } else if (userRole === "user") {
    nav.innerHTML = `
      <a href="/products" data-link>Productos</a>
      <a href="/logout" data-link id="close-sesion">Logout</a>
    `;
  }
}

async function navigate(pathname) {
  // Allow access to login and register pages without authentication
  if (!isAuth() && pathname !== "/login" && pathname !== "/registerUser") {
    pathname = "/login";
  }
  
  // Proteger rutas de administrador
  const userRole = localStorage.getItem("role");
  const adminRoutes = ["/newproduct", "/editProduct", "/users", "/newuser"];
  
  if (isAuth() && userRole === "user" && adminRoutes.includes(pathname)) {
    alert("No tienes permisos para acceder a esta página");
    pathname = "/products"; // Redirigir a productos
  }
  
  const route = routes[pathname];
  const html = await fetch(route).then((res) => res.text());
  document.getElementById("content").innerHTML = html;
  history.pushState({}, "", pathname);

  if (pathname === "/login") setupLoginForm();
  if (pathname === "/registerUser") register();

  // Products
  if (pathname === "/products") setupProducts();
  if (pathname === "/newproduct") setupAddProductForm();
  if (pathname === "/editProduct") setupEditProductForm();

  // CSV Upload
  if (pathname === "/uploadData" || pathname === "/uploaddata") setupCsvUpload();

  // Setup navigation after loading content
  setupNavigation();
}

document.body.addEventListener("click", (e) => {
  if (e.target.matches("[data-link]")) {
    e.preventDefault();
    const path = e.target.getAttribute("href");
    
    // Manejar logout
    if (path === "/logout") {
      localStorage.setItem("Auth", "false");
      localStorage.removeItem("role");
      navigate("/login");
      return;
    }
    
    navigate(path);
  }

  // Manejar botón de editar producto
  if (e.target.matches(".edit-btn")) {
    const userRole = localStorage.getItem("role");
    
    // Verificar si el usuario es admin
    if (userRole !== "admin") {
      alert("No tienes permisos para editar productos");
      return;
    }
    
    const productId = e.target.getAttribute("data-product-id");
    const productDiv = e.target.closest(".product");
    const productName = productDiv.getAttribute("data-product-name");
    const productPrice = productDiv.getAttribute("data-product-price");
    const productAmount = productDiv.getAttribute("data-product-amount");
    const productIsActive = productDiv.getAttribute("data-product-isactive");

    // Guardar datos del producto en localStorage para usar en la página de edición
    localStorage.setItem("editingProduct", JSON.stringify({
      id: productId,
      product: productName,
      price: productPrice,
      amount: productAmount,
      isActive: productIsActive
    }));
    
    navigate('/editProduct');
  }
  
  if (e.target.matches(".delete-btn")) {
    const userRole = localStorage.getItem("role");
    
    // Verificar si el usuario es admin
    if (userRole !== "admin") {
      alert("No tienes permisos para eliminar productos");
      return;
    }
    
    const productDiv = e.target.closest(".product");
    const productName = productDiv.querySelector("h2").textContent;
    const productId = e.target.getAttribute("data-product-id");
    
    if (confirm(`¿Estás seguro de que quieres eliminar el producto: ${productName}?`)) {
      // Eliminar del servidor
      axios.delete(`http://localhost:3000/api/products/${productId}`)
        .then(() => {
          productDiv.remove();
          console.log("Producto eliminado exitosamente");
        })
        .catch(error => {
          console.error("Error al eliminar producto:", error);
          alert("Error al eliminar el producto");
        });
    }
  }
});

async function setupProducts() {
  try {
    const response = await axios.get("http://localhost:3000/api/products");
    const data = response.data || [];
    console.log("Datos de productos recibidos:", data);
    
    // Verificar estructura del primer producto
    if (data.length > 0) {
      console.log("Estructura del primer producto:", data[0]);
      console.log("Propiedades disponibles:", Object.keys(data[0]));
    }
    
    const content = document.getElementById("content");
    
    // Limpiar contenido previo
    content.innerHTML = "";
    const url = "http://localhost:3000/api/products";
    if(localStorage.getItem("role") === "admin"){
      data.forEach(product => {
      const productDiv = document.createElement("div");
      productDiv.classList.add("product");
      productDiv.setAttribute("data-product-id", product.id);
      productDiv.setAttribute("data-product-name", product.product);
      productDiv.setAttribute("data-product-price", product.price);
      productDiv.setAttribute("data-product-amount", product.amount);
      productDiv.setAttribute("data-product-isactive", product.isActive);
      productDiv.innerHTML = `
        <h2>${product.product || 'Sin nombre'}</h2>
        <p>Price: $${product.price || 'Sin precio'}</p>
        <p>Amount: ${product.amount || 'Sin cantidad'}</p>
        <p>Active: ${product.isActive ? 'Sí' : 'No'}</p>
        <button class="edit-btn" data-product-id="${product.id}">Edit</button>
        <button class="delete-btn" data-product-id="${product.id}">Delete</button>
      `;
      content.appendChild(productDiv);
    });
    } else {
      data.forEach(element => {
        const productDiv = document.createElement("div");
        productDiv.classList.add("product");
        productDiv.innerHTML = `
          <h2>${element.product || 'Sin nombre'}</h2>
          <p>Price: $${element.price || 'Sin precio'}</p>
        `;
        content.appendChild(productDiv);
      });
    }
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}



// Setup Add Product Form
function setupAddProductForm() {
  const form = document.getElementById("form_add_product");

  if (!form) {
    console.error("Add Product form not found");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("productName")?.value || "";
    const price = document.getElementById("productPrice")?.value || "";
    const amount = document.getElementById("productAmount")?.value || "";
    const productIsActive = document.getElementById("productIsActive")?.checked || false;

    await axios.post("http://localhost:3000/api/products", { product: name, price, amount, isActive: productIsActive });
    navigate("/products");
  });
}

// Setup Edit Product Form
function setupEditProductForm() {
  const form = document.getElementById("form_update");

  if (!form) {
    console.error("Edit Product form not found");
    return;
  }

  // Obtener datos del producto a editar
  const productData = JSON.parse(localStorage.getItem("editingProduct") || "{}");
  
  // Llenar el formulario con los datos actuales
  const nameInput = document.getElementById("newProduct");
  const priceInput = document.getElementById("newPrice");
  const amountInput = document.getElementById("newAmount");
  const isActiveInput = document.getElementById("newIsActive");
  
  if (nameInput && productData.product) {
    nameInput.value = productData.product;
  }
  if (priceInput && productData.price) {
    priceInput.value = productData.price;
  }
  if (amountInput && productData.amount) {
    amountInput.value = productData.amount;
  }
  if (isActiveInput && productData.isActive !== undefined) {
    isActiveInput.checked = productData.isActive;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const newProductName = document.getElementById("newProduct")?.value || "";
    const newProductPrice = document.getElementById("newPrice")?.value || "";
    const newProductAmount = document.getElementById("newAmount")?.value || "";
    const newIsActive = document.getElementById("newIsActive")?.checked;

    console.log("Actualizando producto:", {
      id: productData.id,
      name: newProductName,
      price: newProductPrice,
      amount: newProductAmount,
      isactive: newIsActive
    });

    try {
      await axios.put(`http://localhost:3000/api/products/${productData.id}`, { 
        product: newProductName, 
        price: newProductPrice,
        amount: newProductAmount,
        isActive: newIsActive
      });
      
      // Limpiar datos temporales
      localStorage.removeItem("editingProduct");
      
      alert("Producto actualizado exitosamente");
      navigate("/products");
    } catch (error) {
      console.error("Error al actualizar producto:", error);
      alert("Error al actualizar el producto");
    }
  });
}

// login
function setupLoginForm() {
  const form = document.getElementById("form_login");
  
  if (!form) {
    console.error("Login form not found");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const user = document.getElementById("user")?.value || "";
    const pass = document.getElementById("password")?.value || "";

    const  data = await axios.get("http://localhost:3000/api/users");
    const users = data.data || [];

    // Buscar usuario que coincida
    const foundUser = users.find(
      (u) => u.name === user && String(u.password) === pass
    );

    if (foundUser) {
      localStorage.setItem("Auth", "true");
      localStorage.setItem("role", foundUser.role);
      setupNavigation();
      
      // Redirigir según el rol del usuario
      if (foundUser.role === "admin") {
        navigate("/products"); // Los admins van a productos donde pueden gestionar
      } else {
        navigate("/products"); // Los users también van a productos pero solo pueden ver
      }
    } else {
      alert("usuario o contraseña son incorrectos");
    }
  });
}

function register() {
  const form = document.getElementById("form_register");
  
  if (!form) {
    console.error("Register form not found");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const user = document.getElementById("user")?.value || "";
    const lastName = document.getElementById("lastName")?.value || "";
    const department = document.getElementById("department")?.value || "";
    const age = document.getElementById("age")?.value || "";
    const salary = document.getElementById("salary")?.value || "";
    const startDate = document.getElementById("startDate")?.value || "";
    const rol = document.getElementById("role")?.value || "user";
    const password = document.getElementById("password")?.value || "";

    const data = await axios.get("http://localhost:3000/api/users");
    const users = data.data || [];

    // Verificar si el usuario ya existe
    const existingUser = users.find((u) => u.name === user);
    
    if (existingUser) {
      alert("El usuario ya existe");
      return;
    }

    // Registrar nuevo usuario
    await axios.post("http://localhost:3000/api/users", { name: user, lastName, department, age, salary, startDate, role: rol, password });
    
    // Guardar en localStorage para mantener sesión iniciada
    localStorage.setItem("Auth", "true");
    localStorage.setItem("role", rol);
    
    alert("Usuario registrado exitosamente");
    setupNavigation();
    
    // Redirigir según el rol del usuario
    if (rol === "admin") {
      navigate("/products");
    } else {
      navigate("/products");
    }
  });
}

// logout - Manejado en el event listener general de clicks

window.addEventListener("DOMContentLoaded", () => {
  navigate(location.pathname);
});

window.addEventListener("popstate", () => {
  console.log("se hizo clic");
  console.log(location);
  navigate(location.pathname);
});

function setupCsvUpload() {
  const form = document.getElementById('csvForm');
  if (!form) return;
  const fileInput = document.getElementById('csvFile');
  const btn = document.getElementById('uploadBtn');
  const out = document.getElementById('output');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!fileInput?.files?.length) return;

    if (btn) { btn.disabled = true; btn.textContent = 'Procesando...'; }
    if (out) { out.hidden = true; out.textContent = ''; }

    const data = new FormData();
    data.append('file', fileInput.files[0]);

    try {
      const res = await fetch('http://localhost:3000/api/csv/upload', {
        method: 'POST',
        body: data
      });
      const json = await res.json();
      if (out) { out.hidden = false; out.textContent = JSON.stringify(json, null, 2); }
    } catch (err) {
      if (out) { out.hidden = false; out.textContent = 'Error: ' + (err?.message || err); }
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Subir y procesar'; }
    }
  });
}