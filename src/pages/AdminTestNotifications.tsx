import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CrossLogo } from '@/components/CrossLogo';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Send, Mail, Phone, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StudentProfile {
  user_id: string;
  name: string;
  email: string;
  section: string | null;
  parent_number: string | null;
  parent_guardian_name: string | null;
}

interface NotificationResult {
  type: 'email' | 'sms';
  success: boolean;
  response: unknown;
  error?: string;
}

const AdminTestNotifications = () => {
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const { toast } = useToast();

  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendingSms, setSendingSms] = useState(false);
  const [results, setResults] = useState<NotificationResult[]>([]);

  useEffect(() => {
    if (userRole && userRole !== 'admin') {
      navigate('/dashboard');
    }
  }, [userRole, navigate]);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('user_id, name, email, section, parent_number, parent_guardian_name')
          .order('name');

        if (error) throw error;
        setStudents(data || []);
      } catch (error) {
        console.error('Error fetching students:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load student profiles',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [toast]);

  const selectedStudent = students.find(s => s.user_id === selectedStudentId);

  const handleSendEmail = async () => {
    if (!selectedStudent) return;

    setSendingEmail(true);
    const startTime = Date.now();

    try {
      const payload = {
        to_email: selectedStudent.email,
        to_name: selectedStudent.parent_guardian_name || 'Parent/Guardian',
        student_name: selectedStudent.name,
        status: 'present',
        time: new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' }),
      };

      console.log('[TEST EMAIL] sending:', payload);

      const { data, error } = await supabase.functions.invoke('send-email', {
        body: payload,
      });

      const duration = Date.now() - startTime;

      const result: NotificationResult = {
        type: 'email',
        success: !error,
        response: error ? { error: error.message, context: error.context } : data,
        error: error?.message,
      };

      setResults(prev => [result, ...prev]);

      toast({
        variant: error ? 'destructive' : 'default',
        title: error ? 'Email Failed' : 'Email Sent',
        description: error ? error.message : `Email sent in ${duration}ms`,
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setResults(prev => [{
        type: 'email',
        success: false,
        response: { error: errorMessage },
        error: errorMessage,
      }, ...prev]);

      toast({
        variant: 'destructive',
        title: 'Email Failed',
        description: errorMessage,
      });
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSendSms = async () => {
    if (!selectedStudent || !selectedStudent.parent_number) return;

    setSendingSms(true);
    const startTime = Date.now();

    try {
      const payload = {
        phone_number: selectedStudent.parent_number,
        message: `[TEST] Good day! This is a test notification for ${selectedStudent.name} from CathoLink. - Holy Cross of Davao College`,
        student_id: selectedStudent.user_id,
        notification_type: 'test_sms',
      };

      console.log('[TEST SMS] sending:', payload);

      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: payload,
      });

      const duration = Date.now() - startTime;

      const result: NotificationResult = {
        type: 'sms',
        success: !error,
        response: error ? { error: error.message, context: error.context } : data,
        error: error?.message,
      };

      setResults(prev => [result, ...prev]);

      toast({
        variant: error ? 'destructive' : 'default',
        title: error ? 'SMS Failed' : 'SMS Sent',
        description: error ? error.message : `SMS sent in ${duration}ms`,
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setResults(prev => [{
        type: 'sms',
        success: false,
        response: { error: errorMessage },
        error: errorMessage,
      }, ...prev]);

      toast({
        variant: 'destructive',
        title: 'SMS Failed',
        description: errorMessage,
      });
    } finally {
      setSendingSms(false);
    }
  };

  if (userRole && userRole !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen gradient-bg p-6">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="outline"
          className="mb-6"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="shadow-lg mb-6">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CrossLogo size={80} clickable={false} />
            </div>
            <CardTitle className="text-2xl">Test Notifications</CardTitle>
            <CardDescription>
              Send test email and SMS notifications to verify the system is working
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Student Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Student</label>
              {loading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading students...
                </div>
              ) : (
                <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a student profile" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map(student => (
                      <SelectItem key={student.user_id} value={student.user_id}>
                        {student.name} {student.section ? `(${student.section})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Selected Student Info */}
            {selectedStudent && (
              <Card className="bg-muted/50">
                <CardContent className="pt-4 space-y-2">
                  <p><strong>Name:</strong> {selectedStudent.name}</p>
                  <p><strong>Email:</strong> {selectedStudent.email}</p>
                  <p><strong>Section:</strong> {selectedStudent.section || 'N/A'}</p>
                  <p><strong>Parent/Guardian:</strong> {selectedStudent.parent_guardian_name || 'N/A'}</p>
                  <p><strong>Parent Number:</strong> {selectedStudent.parent_number || 'Not set'}</p>
                </CardContent>
              </Card>
            )}

            {/* Send Buttons */}
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={handleSendEmail}
                disabled={!selectedStudent || sendingEmail}
                className="flex-1 min-w-[200px]"
              >
                {sendingEmail ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                {sendingEmail ? 'Sending Email...' : 'Send Test Email'}
              </Button>

              <Button
                onClick={handleSendSms}
                disabled={!selectedStudent || !selectedStudent.parent_number || sendingSms}
                variant="secondary"
                className="flex-1 min-w-[200px]"
              >
                {sendingSms ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Phone className="h-4 w-4 mr-2" />
                )}
                {sendingSms ? 'Sending SMS...' : 'Send Test SMS'}
              </Button>
            </div>

            {!selectedStudent?.parent_number && selectedStudent && (
              <p className="text-sm text-destructive">
                ⚠️ This student has no parent phone number set. SMS cannot be sent.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Results Log */}
        {results.length > 0 && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Send className="h-5 w-5" />
                Response Log
              </CardTitle>
              <CardDescription>
                Backend responses from notification attempts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    result.success
                      ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800'
                      : 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className="font-semibold uppercase">
                      {result.type} - {result.success ? 'Success' : 'Failed'}
                    </span>
                  </div>
                  <pre className="text-xs bg-background/50 p-3 rounded overflow-x-auto">
                    {JSON.stringify(result.response, null, 2)}
                  </pre>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminTestNotifications;
