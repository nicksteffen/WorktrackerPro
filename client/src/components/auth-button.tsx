
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { apiRequest } from "@/lib/utils"
import { useState } from "react"

export function AuthButton() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleAuth = async (action: 'signin' | 'signout') => {
    try {
      setIsLoading(true)
      const res = await apiRequest('GET', `/api/auth/${action}/google`)
      const { url } = await res.json()
      window.location.href = url
    } catch (error) {
      toast({
        title: "Authentication Error",
        description: "Failed to process authentication request",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button 
      onClick={() => handleAuth('signin')} 
      disabled={isLoading}
      variant="outline"
    >
      {isLoading ? "Loading..." : "Sign in with Google"}
    </Button>
  )
}
