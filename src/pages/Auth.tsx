import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CrossLogo } from '@/components/CrossLogo';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const sendWelcomeEmail = async (email: string, name: string) => {
  try {
    const payload = {
      to_email: email,
      to_name: name,
      student_name: name,
      status: 'welcome',
      time: new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' }),
    };

    console.log('[EMAIL] invoking send-email (welcome) with:', payload);
    const { data, error } = await supabase.functions.invoke('send-email', { body: payload });

    if (error) {
      console.error('[EMAIL] welcome email failed:', error);
      return;
    }

    console.log('[EMAIL] welcome email response:', data);
  } catch (error) {
    console.error('[EMAIL] unexpected error sending welcome email:', error);
  }
};

const SECTIONS = [
  '12 ABM JOY', '12 STEM COUNSEL', '12 STEM TEMPERANCE', '12 STEM INTEGRITY',
  '12 HUMSS PEACE', '12 HUMSS CHARITY', '12 HUMSS HUMILITY', '12 HUMSS FAITH',
  '12 TVL BP', '12 TVL ICT',
  '11 DILIGENCE', '11 WISDOM', '11 KNOWLEDGE', '11 PRUDENCE',
  '11 PIETY', '11 HOPE', '11 FORTITUDE'
];

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [parentGuardianName, setParentGuardianName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [role, setRole] = useState<'student' | 'admin'>('student');
  const [section, setSection] = useState('');
  const [adviserName, setAdviserName] = useState('');
  const [parentNumber, setParentNumber] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      });

      navigate('/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login failed',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!name || !email || !password || !phone || !birthday) {
        throw new Error('Please fill in all required fields.');
      }

      // Validate password confirmation
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match.');
      }

      // Validate student-specific fields only for students
      if (role === 'student' && (!section || !parentNumber || !parentGuardianName || !adviserName)) {
        throw new Error('Please fill in all required fields for students.');
      }

      // Validate terms acceptance
      if (!termsAccepted) {
        throw new Error('Please accept the Terms & Conditions to continue.');
      }

      const redirectUrl = `${window.location.origin}/dashboard`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name,
            phone,
            parent_guardian_name: parentGuardianName,
            birthday,
            role,
            adviser_name: adviserName,
            terms_accepted: termsAccepted,
            section: role === 'student' ? section : null,
            parent_number: role === 'student' ? parentNumber : null,
          },
        },
      });

      if (error) throw error;

      // Send welcome email
      await sendWelcomeEmail(email, name);

      toast({
        title: 'Account created!',
        description: 'Welcome to CathoLink. A welcome email has been sent to you.',
      });

      navigate('/dashboard');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Signup failed',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CrossLogo size={100} />
          </div>
          <CardTitle className="text-3xl font-bold text-primary">CathoLink</CardTitle>
          <CardDescription>Faith. Attendance. Connection.</CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={isLogin ? 'login' : 'signup'} onValueChange={(v) => setIsLogin(v === 'login')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Logging in...' : 'Login'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone/Contact Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Your phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="birthday">Birthday (MM/DD/YYYY)</Label>
                  <Input
                    id="birthday"
                    type="date"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={role} onValueChange={(v: 'student' | 'admin') => setRole(v)}>
                    <SelectTrigger id="role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {role === 'student' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="parent-guardian">Parent/Guardian Name</Label>
                      <Input
                        id="parent-guardian"
                        type="text"
                        placeholder="Parent/Guardian full name"
                        value={parentGuardianName}
                        onChange={(e) => setParentGuardianName(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="section">Section</Label>
                      <Select value={section} onValueChange={setSection}>
                        <SelectTrigger id="section">
                          <SelectValue placeholder="Select your section" />
                        </SelectTrigger>
                        <SelectContent>
                          {SECTIONS.map((sec) => (
                            <SelectItem key={sec} value={sec}>
                              {sec}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="adviser-name">Adviser Name</Label>
                      <Input
                        id="adviser-name"
                        type="text"
                        placeholder="Your adviser's name"
                        value={adviserName}
                        onChange={(e) => setAdviserName(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="parent-number">Parent's Phone Number</Label>
                      <Input
                        id="parent-number"
                        type="tel"
                        placeholder="Enter parent's phone number"
                        value={parentNumber}
                        onChange={(e) => setParentNumber(e.target.value)}
                        required
                      />
                    </div>
                  </>
                )}
                
                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-1 h-4 w-4"
                    required
                  />
                  <Label htmlFor="terms" className="text-sm cursor-pointer">
                    I accept the{' '}
                    <a href="/terms" target="_blank" className="text-primary underline hover:text-primary/80">
                      Terms & Conditions
                    </a>
                  </Label>
                </div>
                
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating account...' : 'Sign Up'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;