import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/context/AuthContext"

const Dashboard = () => {
  const { user } = useAuth()

  return (
    <Card className="w-full max-w-4xl border-dashed bg-card/70 text-center">
      <CardHeader>
        <CardTitle className="text-3xl">Dashboard</CardTitle>
        <CardDescription>
          Welcome back {user?.name || user?.email}! Still working on the dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex min-h-[200px] flex-col items-center justify-center text-muted-foreground">
        <p>No data yet.</p>
      </CardContent>
    </Card>
  )
}

export default Dashboard

