import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CrossLogo } from '@/components/CrossLogo';
import { useAuth } from '@/hooks/useAuth';
import { Moon, Sun, LogOut, ScanLine, ClipboardList, Clock, Star, Bell } from 'lucide-react';
import { useEffect, useState } from 'react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
  }, []);

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
    setDarkMode(!darkMode);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (!profile) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <CrossLogo size={120} />
          <p className="mt-4 text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <CrossLogo size={60} />
            <div>
              <h1 className="text-3xl font-bold text-primary">CathoLink Admin</h1>
              <p className="text-sm text-muted-foreground">Administrative Portal</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={toggleDarkMode}>
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Welcome Card */}
        <Card className="mb-6 shadow-lg gradient-primary text-primary-foreground">
          <CardHeader>
            <CardTitle className="text-2xl">Welcome, Administrator {profile.name}</CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Manage student attendance and records
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Action Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card 
            className="shadow-lg hover:shadow-xl smooth-transition cursor-pointer border-2 hover:border-primary"
            onClick={() => navigate('/admin/scanner')}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <ScanLine className="h-8 w-8 text-primary" />
                <CardTitle>Scan Student QR</CardTitle>
              </div>
              <CardDescription>
                Scan student QR codes to record attendance
              </CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="shadow-lg hover:shadow-xl smooth-transition cursor-pointer border-2 hover:border-primary"
            onClick={() => navigate('/admin/attendance')}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <ClipboardList className="h-8 w-8 text-primary" />
                <CardTitle>View Attendance Logs</CardTitle>
              </div>
              <CardDescription>
                View all attendance records and statistics
              </CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="shadow-lg hover:shadow-xl smooth-transition cursor-pointer border-2 hover:border-destructive"
            onClick={() => navigate('/admin/late-comers')}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-destructive" />
                <CardTitle>Late Comers</CardTitle>
              </div>
              <CardDescription>
                View students who arrived late (Morning & Afternoon)
              </CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="shadow-lg hover:shadow-xl smooth-transition cursor-pointer border-2 hover:border-primary"
            onClick={() => navigate('/admin/ratings')}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <Star className="h-8 w-8 text-primary" />
                <CardTitle>App Ratings</CardTitle>
              </div>
              <CardDescription>
                View all student feedback and research data
              </CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="shadow-lg hover:shadow-xl smooth-transition cursor-pointer border-2 hover:border-amber-500"
            onClick={() => navigate('/admin/test-notifications')}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <Bell className="h-8 w-8 text-amber-500" />
                <CardTitle>Test Notifications</CardTitle>
              </div>
              <CardDescription>
                Send test email & SMS to verify the system
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Info Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>CathoLink — Faith. Attendance. Connection.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;