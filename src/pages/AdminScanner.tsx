import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CrossLogo } from '@/components/CrossLogo';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, CheckCircle, Cake } from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import confetti from 'canvas-confetti';

const AdminScanner = () => {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [scanning, setScanning] = useState(true);
  const [scannedStudent, setScannedStudent] = useState<any>(null);
  const [isBirthday, setIsBirthday] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('/happy-birthday.mp3');
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (userRole && userRole !== 'admin') {
      navigate('/dashboard');
    }
  }, [userRole, navigate]);

  if (userRole && userRole !== 'admin') {
    return null;
  }

  const checkIfBirthday = (birthday: string) => {
    if (!birthday) return false;
    const today = new Date();
    const birthDate = new Date(birthday);
    return today.getMonth() === birthDate.getMonth() && 
           today.getDate() === birthDate.getDate();
  };

  const getAttendanceStatus = (): 'present' | 'late' | 'absent' | 'half_day' => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = hours * 60 + minutes;
    
    // 6:00 AM - 7:59 AM (360-479 minutes): Present (morning)
    if (currentTime >= 360 && currentTime < 480) {
      return 'present';
    }
    
    // 8:00 AM - 11:59 AM (480-719 minutes): Late (morning late)
    if (currentTime >= 480 && currentTime < 720) {
      return 'late';
    }
    
    // 12:00 PM - 1:15 PM (720-795 minutes): Present (afternoon)
    if (currentTime >= 720 && currentTime <= 795) {
      return 'present';
    }
    
    // 4:30 PM onwards (1050+ minutes): Absent
    if (currentTime >= 1050) {
      return 'absent';
    }
    
    // Default for other times
    return 'present';
  };

  const playBirthdayAnimation = () => {
    // Play birthday audio
    if (audioRef.current) {
      audioRef.current.play().catch(err => console.error('Audio play error:', err));
    }

    // Trigger confetti
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd']
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  };

  const handleScan = async (result: any) => {
    if (!result || !scanning) return;

    console.log('[QR] scan result:', result);

    try {
      setScanning(false);

      const rawValue = Array.isArray(result) ? result[0]?.rawValue : result?.rawValue;
      if (!rawValue) {
        throw new Error('Invalid scan result (missing rawValue)');
      }

      const studentData = JSON.parse(rawValue);
      console.log('[QR] parsed studentData:', studentData);

      // Fetch full student profile including birthday
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', studentData.user_id)
        .single();

      if (!profile) {
        throw new Error('Student profile not found');
      }

      // Check if it's their birthday
      const birthdayToday = checkIfBirthday(profile.birthday);
      setIsBirthday(birthdayToday);

      if (birthdayToday) {
        playBirthdayAnimation();
      }

      // Check if already scanned today
      const today = new Date().toISOString().split('T')[0];
      const { data: existingAttendance } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', studentData.user_id)
        .gte('scanned_at', `${today}T00:00:00`)
        .lte('scanned_at', `${today}T23:59:59`);

      // Determine attendance status
      const status = getAttendanceStatus();
      const now = new Date();
      const hours = now.getHours();

      // Check for half-day scenario
      let finalStatus: 'present' | 'late' | 'absent' | 'half_day' = status;
      if (existingAttendance && existingAttendance.length > 0) {
        const morningScans = existingAttendance.filter(a => {
          const scanHour = new Date(a.scanned_at).getHours();
          return scanHour >= 6 && scanHour < 12;
        });
        const afternoonScans = existingAttendance.filter(a => {
          const scanHour = new Date(a.scanned_at).getHours();
          return scanHour >= 12 && scanHour < 16;
        });

        // If scanning now and already scanned in the other session
        const currentlyMorning = hours >= 6 && hours < 12;
        const currentlyAfternoon = hours >= 12 && hours < 16;

        if ((currentlyMorning && afternoonScans.length > 0) ||
            (currentlyAfternoon && morningScans.length > 0)) {
          // Both sessions attended - already recorded
          toast({
            title: birthdayToday ? '🎂 Happy Birthday!' : 'Already Recorded',
            description: birthdayToday
              ? `${studentData.name} - Happy Birthday! Already marked present today.`
              : `${studentData.name} has already been marked present today.`,
            variant: birthdayToday ? 'default' : 'destructive',
          });

          setTimeout(() => {
            setScanning(true);
            setIsBirthday(false);
          }, birthdayToday ? 5000 : 3000);
          return;
        } else if ((currentlyMorning && morningScans.length > 0) ||
                   (currentlyAfternoon && afternoonScans.length > 0)) {
          // Already scanned this session
          toast({
            title: birthdayToday ? '🎂 Happy Birthday!' : 'Already Recorded',
            description: birthdayToday
              ? `${studentData.name} - Happy Birthday! Already marked for this session.`
              : `${studentData.name} has already been marked for this session.`,
            variant: birthdayToday ? 'default' : 'destructive',
          });

          setTimeout(() => {
            setScanning(true);
            setIsBirthday(false);
          }, birthdayToday ? 5000 : 3000);
          return;
        }
      }

      // Record attendance
      const { error } = await supabase
        .from('attendance')
        .insert([{
          student_id: studentData.user_id,
          student_name: studentData.name,
          section: studentData.section,
          scanned_by: user?.id || '',
          status: finalStatus,
          parent_notified: !!profile.parent_number,
        }]);

      if (error) throw error;

      setScannedStudent({
        ...studentData,
        status: finalStatus,
        birthday: profile.birthday,
        parent_number: profile.parent_number,
        parent_email: profile.email,
      });

      const statusMessage = finalStatus === 'late' ? ' (Late)' :
                           finalStatus === 'half_day' ? ' (Half Day)' :
                           finalStatus === 'absent' ? ' (Absent)' : '';
      toast({
        title: birthdayToday ? '🎂 Happy Birthday & Attendance Recorded!' : 'Attendance Recorded',
        description: `${studentData.name} from ${studentData.section}${statusMessage} has been marked ${finalStatus}.`,
      });

      // Send email notification
      if (profile.email) {
        const emailPayload = {
          to_email: profile.email,
          to_name: profile.parent_guardian_name || 'Parent/Guardian',
          student_name: studentData.name,
          status: finalStatus,
          time: new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' }),
        };

        console.log('[EMAIL] invoking send-email with:', emailPayload);
        const { data, error } = await supabase.functions.invoke('send-email', {
          body: emailPayload,
        });
        if (error) {
          console.error('[EMAIL] send-email failed:', error);
        } else {
          console.log('[EMAIL] send-email response:', data);
        }
      }

      // Send push notification for late/absent/half_day (for app users)
      if (finalStatus === 'late' || finalStatus === 'absent' || finalStatus === 'half_day') {
        const notificationTitle = finalStatus === 'late'
          ? '⚠️ Late Arrival Alert'
          : finalStatus === 'absent'
            ? '🚫 Absence Alert'
            : '📝 Half Day Alert';

        const notificationBody = finalStatus === 'late'
          ? `Good Day! Your child ${studentData.name} has arrived late to school today.`
          : finalStatus === 'absent'
            ? `Good Day! Your child ${studentData.name} has been marked absent today.`
            : `Good Day! Your child ${studentData.name} attended only half day today.`;

        try {
          console.log('[PUSH] invoking send-notification');
          const { data, error } = await supabase.functions.invoke('send-notification', {
            body: {
              user_ids: [studentData.user_id],
              title: notificationTitle,
              body: notificationBody,
              notification_type: 'attendance_alert',
              data: {
                student_id: studentData.user_id,
                student_name: studentData.name,
                status: finalStatus,
              }
            }
          });

          if (error) {
            console.error('[PUSH] send-notification failed:', error);
          } else {
            console.log('[PUSH] send-notification response:', data);
          }
        } catch (notifError) {
          console.error('[PUSH] unexpected error:', notifError);
        }
      }

      // Send SMS to parent's phone number (ALL statuses, including "present")
      if (profile.parent_number) {
        try {
          const smsMessage = finalStatus === 'present'
            ? `Good day, Ma’am/Sir. We would like to inform you that your son/daughter, ${studentData.name}, has safely entered the school premises. - Holy Cross of Davao College`
            : finalStatus === 'late'
              ? `Good Day! Your child ${studentData.name} from ${studentData.section} has arrived late to school today at ${new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}. - Holy Cross of Davao College`
              : finalStatus === 'absent'
                ? `Good Day! Your child ${studentData.name} from ${studentData.section} has been marked absent today. Please contact the school if you have any concerns. - Holy Cross of Davao College`
                : `Good Day! Your child ${studentData.name} from ${studentData.section} attended only half day today. - Holy Cross of Davao College`;

          const smsPayload = {
            phone_number: profile.parent_number,
            message: smsMessage,
            student_id: studentData.user_id,
            notification_type: 'attendance_sms',
          };

          console.log('[SMS] invoking send-sms with:', smsPayload);
          const { data, error } = await supabase.functions.invoke('send-sms', {
            body: smsPayload,
          });

          if (error) {
            console.error('[SMS] send-sms failed:', error);
          } else {
            console.log('[SMS] send-sms response:', data);
          }
        } catch (smsError) {
          console.error('[SMS] unexpected error:', smsError);
        }
      }

      // Reset after animation / processing
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        setScannedStudent(null);
        setScanning(true);
        setIsBirthday(false);
      }, birthdayToday ? 5000 : 3000);
    } catch (error: any) {
      console.error('Scan error:', error);
      toast({
        variant: 'destructive',
        title: 'Scan Failed',
        description: error.message || 'Invalid QR code',
      });

      setTimeout(() => {
        setScanning(true);
        setIsBirthday(false);
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen gradient-bg p-6">
      <div className="max-w-2xl mx-auto">
        <Button 
          variant="outline" 
          className="mb-6"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CrossLogo size={80} clickable={false} />
            </div>
            <CardTitle className="text-2xl">Student QR Scanner</CardTitle>
            <CardDescription>
              Scan student QR codes to record attendance
            </CardDescription>
          </CardHeader>
          
          <CardContent className="flex flex-col items-center gap-6">
            {scannedStudent ? (
              <div className="w-full max-w-md text-center space-y-4 py-8">
                <CheckCircle className="h-24 w-24 text-green-500 mx-auto animate-scale-in" />
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-green-600">Attendance Recorded!</h3>
                  <p className="text-lg font-semibold">{scannedStudent.name}</p>
                  <p className="text-muted-foreground">Section: {scannedStudent.section}</p>
                  <p className="text-sm text-muted-foreground">Parent notified at: {scannedStudent.parent_number}</p>
                </div>
              </div>
            ) : scanning ? (
              <div className="w-full max-w-md">
                <Scanner
                  onScan={handleScan}
                  components={{
                    finder: true,
                  }}
                  styles={{
                    container: {
                      width: '100%',
                      borderRadius: '0.75rem',
                      overflow: 'hidden',
                    },
                  }}
                />
                <p className="text-center text-sm text-muted-foreground mt-4">
                  Position the QR code within the frame
                </p>
              </div>
            ) : (
              <div className="w-full max-w-md text-center py-8">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Processing...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminScanner;