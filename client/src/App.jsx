import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Product from "./pages/Product";
import Cart from "./pages/Cart";
import Library from "./pages/Library";
import SellerDashboard from "./pages/SellerDashboard";

const App = () => (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/p/:slug" element={<Product />} />
    <Route path="/cart" element={<Cart />} />
    <Route path="/library" element={<Library />} />
    <Route path="/dashboard/seller" element={<SellerDashboard />} />
  </Routes>
);

export default App;
