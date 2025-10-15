"use client"

import { createContext, useState } from "react"

export const ProductContext = createContext()

export const ProductProvider = ({ children }) => {
  const [cartList, setCartList] = useState([])
  const [authenticated, setAuthenticated] = useState(false)
  const [initialItems, setInitialItems] = useState([])
  const [shouldFetchCart, setShouldFetchCart] = useState(false)
  const [mainLoading, setMainLoading] = useState(true)
  const [localCartLength, setLocalCartLength] = useState(0)
  const [total, setTotal] = useState(0)

  return (
    <ProductContext.Provider
      value={{
        cartList,
        setCartList,
        authenticated,
        setAuthenticated,
        initialItems,
        setInitialItems,
        shouldFetchCart,
        setShouldFetchCart,
        mainLoading,
        setMainLoading,
        localCartLength,
        setLocalCartLength,
        total,
        setTotal,
      }}
    >
      {children}
    </ProductContext.Provider>
  )
}

