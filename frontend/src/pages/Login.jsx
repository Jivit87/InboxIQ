import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiRequest } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"

const Login = () => {
  const [formState, setFormState] = useState({ email: "", password: "" })
  const [status, setStatus] = useState({ loading: false, error: "", success: "" })
  const { saveAuth } = useAuth()
  const navigate = useNavigate()

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormState((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus({ loading: true, error: "", success: "" })

    try {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: formState,
      })

      saveAuth({ user: data.user, token: data.token })
      setStatus({ loading: false, error: "", success: data.message || "Login successful" })
      navigate("/dashboard")
    } catch (error) {
      setStatus({ loading: false, error: error.message, success: "" })
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl">Login</CardTitle>
        <CardDescription>Enter your credentials to continue.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2 text-left">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={formState.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2 text-left">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formState.password}
              onChange={handleChange}
              required
            />
          </div>
          <Button className="w-full" disabled={status.loading} type="submit">
            Sign in
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Need an account?{" "}
          <Link className="text-primary underline-offset-4 hover:underline" to="/register">
            Register
          </Link>
        </p>
        {status.error && (
          <p className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
            {status.error}
          </p>
        )}
        {status.success && (
          <p className="mt-4 rounded-md bg-secondary px-3 py-2 text-center text-sm text-secondary-foreground">
            {status.success}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export default Login

