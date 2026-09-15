import Home from './pages/user/Home'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import About from './pages/user/About'
import Contact from './pages/user/Contact'
import Product from './pages/user/Product'
import ProductDetail from './pages/user/ProductDetail'
import Cart from './pages/user/Cart'
import Wishlist from './pages/user/Wishlist'
import Login from './pages/user/Login'
import Register from './pages/user/Register'
import DashboardLayout from './pages/admin/DashboardLayout'
import DashboardOverview from './pages/admin/DashboardOverview'
import Categories from './pages/admin/Categories'
import AddCategory from './pages/admin/AddCategory'
import Products from './pages/admin/Products'
import Orders from './pages/admin/Orders'
import OrderDetail from './pages/admin/OrderDetail'
import UsersList from './pages/admin/UsersList'
import Inventory from './pages/admin/Inventory'
import Complaints from './pages/admin/Complaints'
import InvoicePreview from './pages/admin/InvoicePreview'
import AdminAddresses from './pages/admin/Addresses'
import { CartProvider } from './context/CartContext'

import AdminLogin from './pages/admin/AdminLogin'
import AdminProtectedRoute from './components/AdminProtectedRoute'
import AddProduct from './pages/admin/AddProduct'

import Addresses from './pages/user/Addresses'
import Profile from './pages/user/Profile'
import Payment from './pages/user/Payment'
import OrderSuccess from './pages/user/OrderSuccess'

export const App = () => {
  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Home />}></Route>
          <Route path='/about' element={<About />}></Route>
          <Route path='/contact' element={<Contact />}></Route>
          <Route path='/Product' element={<Product />}></Route>
          <Route path='/product/:id' element={<ProductDetail />}></Route>
          <Route path='/cart' element={<Cart />}></Route>
          <Route path='/wishlist' element={<Wishlist />}></Route>
          <Route path='/addresses' element={<Addresses />}></Route>
          <Route path='/payment' element={<Payment />}></Route>
          <Route path='/order-success' element={<OrderSuccess />}></Route>
          <Route path='/profile' element={<Profile />}></Route>
          <Route path='/account' element={<Profile />}></Route>
          <Route path='/login' element={<Login />}></Route>
          <Route path='/register' element={<Register />}></Route>
          <Route path='/dashboard' element={
              <AdminProtectedRoute>
                <DashboardLayout />
              </AdminProtectedRoute>
            }
          >
            <Route index element={<DashboardOverview />} />
            <Route path='categories' element={<Categories />} />
            <Route path='categories/add' element={<AddCategory />} />
            <Route path='add-category' element={<AddCategory />} />
            <Route path='categories/edit/:id' element={<AddCategory />} />
            <Route path='products' element={<Products />} />
            <Route path='products/add' element={<AddProduct />} />
            <Route path='add-product' element={<AddProduct />} />
            <Route path='products/edit/:id' element={<AddProduct isEditMode={true} />} />
            <Route path='orders' element={<Orders />} />
            <Route path='orders/:id' element={<OrderDetail />} />
            <Route path='invoices' element={<InvoicePreview />} />
            <Route path='invoice-preview' element={<InvoicePreview />} />
            <Route path='invoice-preview/:id' element={<InvoicePreview />} />
            <Route path='users' element={<UsersList />} />
            <Route path='inventory' element={<Inventory />} />
            <Route path='addresses' element={<AdminAddresses />} />
            <Route path='complaints' element={<Complaints />} />
          </Route>
          <Route path='/admin/login' element={<AdminLogin/>} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  )
}
export default App


