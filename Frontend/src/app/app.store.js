import { configureStore } from "@reduxjs/toolkit";
import { authReducer } from "../feature/auth/state/auth.slice";
import { productReducer } from "../feature/product/state/product.slice";
import { sellerReducer } from "../feature/seller/state/seller.slice";
import { cartReducer } from "../feature/cart/state/cart.slice";
import { wishlistReducer } from "../feature/wishlist/state/wishlist.slice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    product: productReducer,
    seller: sellerReducer,
    cart: cartReducer,
    wishlist: wishlistReducer,
  },
});



