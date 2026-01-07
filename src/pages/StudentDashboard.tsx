import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CrossLogo } from '@/components/CrossLogo';
import { NotificationButton } from '@/components/NotificationButton';
import { useAuth } from '@/hooks/useAuth';
import { Moon, Sun, LogOut, QrCode, Calendar, User, Star } from 'lucide-react';
import { useEffect, useState } from 'react';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
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
          <p className="mt-4 text-lg text-muted-foreground">Loading your profile...</p>
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
              <h1 className="text-3xl font-bold text-primary">CathoLink</h1>
              <p className="text-sm text-muted-foreground">Student Portal</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <NotificationButton />
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
        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Welcome, {profile.name}!</CardTitle>
            <CardDescription className="text-lg">Section: {profile.section}</CardDescription>
          </CardHeader>
        </Card>

        {/* Action Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card 
            className="shadow-lg hover:shadow-xl smooth-transition cursor-pointer border-2 hover:border-primary"
            onClick={() => navigate('/student/qr-code')}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <QrCode className="h-8 w-8 text-primary" />
                <CardTitle>Generate My QR Code</CardTitle>
              </div>
              <CardDescription>
                Create and download your personal attendance QR code
              </CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="shadow-lg hover:shadow-xl smooth-transition cursor-pointer border-2 hover:border-primary"
            onClick={() => navigate('/student/attendance')}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <Calendar className="h-8 w-8 text-primary" />
                <CardTitle>My Attendance Record</CardTitle>
              </div>
              <CardDescription>
                View your attendance history and records
              </CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="shadow-lg hover:shadow-xl smooth-transition cursor-pointer border-2 hover:border-primary"
            onClick={() => navigate('/student/profile')}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <User className="h-8 w-8 text-primary" />
                <CardTitle>My Profile</CardTitle>
              </div>
              <CardDescription>
                Update your profile and change picture
              </CardDescription>
            </CardHeader>
          </Card>

          <Card 
            className="shadow-lg hover:shadow-xl smooth-transition cursor-pointer border-2 hover:border-primary"
            onClick={() => navigate('/ratings')}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <Star className="h-8 w-8 text-primary" />
                <CardTitle>Rate the App</CardTitle>
              </div>
              <CardDescription>
                Share your feedback for our research
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

export default StudentDashboard;