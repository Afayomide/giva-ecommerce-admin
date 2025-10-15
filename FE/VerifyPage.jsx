"use client"

import { useContext, useState, useEffect } from "react"
import { ProductContext } from "../productContext"
import { useLocation, useNavigate } from "react-router-dom"
import { Link } from "react-router-dom"
import axios from "axios"
import { toast } from "react-hot-toast"
import "./Checkout.css"
import { CheckCircle, Loader, Home, ShoppingBag, Mail, AlertTriangle } from "lucide-react"

function VerifyPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const reference = new URLSearchParams(location.search).get("reference")

  const { total, setTotal, authenticated, setLocalCartLength, setShouldFetchCart } = useContext(ProductContext)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const apiUrl = process.env.REACT_APP_API_URL

  useEffect(() => {
    setTotal(localStorage.getItem("total"))
  }, [])

  useEffect(() => {
    async function verify() {
      if (!reference) {
        navigate("/")
        toast.error("No reference found")
        return
      }

      try {
        await toast.promise(axios.get(`${apiUrl}/api/verify/${reference}`), {
          loading: "Verifying payment...",
          success: "Payment verified successfully!",
          error: "Error verifying payment. Please try again.",
        })
        setIsLoading(false)
        setShouldFetchCart(true)

        // Clear cart from localStorage after successful payment
        localStorage.removeItem("localCartList")
        localStorage.setItem("total", "0")
      } catch (error) {
        console.error("Error verifying payment:", error)
        setIsLoading(false)
        setIsError(true)
      }
    }

    if (reference) {
      verify()
    } else {
      navigate("/")
      toast.error("No reference")
    }
  }, [reference])

  return (
    <div className="verify-page">
      <div className="verify-container">
        {isLoading ? (
          <div className="verify-status loading">
            <div className="loader-wrapper">
              <Loader size={50} className="loader-icon" />
            </div>
            <h2>Verifying Your Payment</h2>
            <p>Please wait while we confirm your transaction...</p>
          </div>
        ) : isError ? (
          <div className="verify-status error">
            <AlertTriangle size={50} className="error-icon" />
            <h2>Payment Verification Failed</h2>
            <p>We couldn't verify your payment. Please try again or contact customer support.</p>
            <div className="verify-actions">
              <Link to="/checkout" className="verify-button">
                <ShoppingBag size={18} />
                <span>Return to Checkout</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="verify-status success">
            <div className="success-icon-wrapper">
              <CheckCircle size={50} className="success-icon" />
            </div>
            <h2>Payment Successful!</h2>
            <p>Thank you for your purchase. Your order has been confirmed.</p>
            <div className="success-details">
              <div className="success-detail">
                <Mail size={18} />
                <p>A receipt has been sent to your email address.</p>
              </div>
              <div className="success-detail">
                <ShoppingBag size={18} />
                <p>Your order is being processed and will be shipped soon.</p>
              </div>
            </div>
            <div className="verify-actions">
              <Link to="/" className="verify-button">
                <Home size={18} />
                <span>Return to Home</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default VerifyPage

