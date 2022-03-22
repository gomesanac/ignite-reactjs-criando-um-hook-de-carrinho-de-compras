import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const storagedProduct = cart.find(({ id }) => productId === id);
      const { amount: totalStock }: Stock = await api
        .get(`stock/${productId}`)
        .then(({ data }) => data);

      if (storagedProduct) {
        if (storagedProduct.amount + 1 <= totalStock) {
          storagedProduct.amount += 1;

          const updatedStorageCart = [
            ...cart.filter(({ id }) => productId !== id),
            storagedProduct,
          ];

          setCart(updatedStorageCart);
          localStorage.setItem(
            '@RocketShoes:cart',
            JSON.stringify(updatedStorageCart)
          );
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }
      } else {
        const product = await api
          .get(`products/${productId}`)
          .then(({ data }) => data);

        if (1 <= totalStock) {
          const updatedStorageCart = [...cart, { ...product, amount: 1 }];

          setCart(updatedStorageCart);
          localStorage.setItem(
            '@RocketShoes:cart',
            JSON.stringify(updatedStorageCart)
          );
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const storagedProduct = cart.find(({ id }) => productId === id);

      if (storagedProduct) {
        const updatedStorageCart = [
          ...cart.filter(({ id }) => productId !== id),
        ];

        setCart(updatedStorageCart);
        localStorage.setItem(
          '@RocketShoes:cart',
          JSON.stringify(updatedStorageCart)
        );
      } else {
        toast.error('Erro na remoção do produto');
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const { amount: totalStock }: Stock = await api
        .get(`stock/${productId}`)
        .then(({ data }) => data);

      if (amount <= totalStock && amount > 0) {
        const updatedStorageCart = cart.map((product) => {
          if (productId !== product.id) return product;
          return { ...product, amount };
        });

        setCart(updatedStorageCart);
        localStorage.setItem(
          '@RocketShoes:cart',
          JSON.stringify(updatedStorageCart)
        );
      } else {
        toast.error('Quantidade solicitada fora de estoque');
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
