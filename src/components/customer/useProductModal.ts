import { useCallback, useState } from "react";
import type { Product } from "@/lib/types";

export function useProductModal() {
  const [modalState, setModalState] = useState<{
    product: Product | null;
    open: boolean;
  }>({ product: null, open: false });

  const openModal = useCallback((product: Product) => {
    setModalState({ product, open: true });
  }, []);

  const closeModal = useCallback(() => {
    setModalState({ product: null, open: false });
  }, []);

  return { openModal, closeModal, modalState };
}
