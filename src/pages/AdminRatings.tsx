import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CrossLogo } from '@/components/CrossLogo';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Download, BarChart3, Users, Star, TrendingUp } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Rating {
  id: string;
  user_id: string;
  user_name: string;
  user_section: string | null;
  ease_of_use: number | null;
  interface_design: number | null;
  qr_code_functionality: number | null;
  attendance_tracking: number | null;
  response_speed: number | null;
  reliability: number | null;
  overall_satisfaction: number | null;
  would_recommend: number | null;
  suggestions: string | null;
  additional_comments: string | null;
  created_at: string;
}

const questionLabels: Record<string, string> = {
  ease_of_use: 'Ease of Use',
  interface_design: 'Interface Design',
  qr_code_functionality: 'QR Code Functionality',
  attendance_tracking: 'Attendance Tracking',
  response_speed: 'Response Speed',
  reliability: 'Reliability',
  overall_satisfaction: 'Overall Satisfaction',
  would_recommend: 'Would Recommend',
};

const questionKeys = Object.keys(questionLabels);

const AdminRatings = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRatings();
  }, []);

  const fetchRatings = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('app_ratings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching ratings:', error);
      toast({
        title: "Error",
        description: "Failed to load ratings data.",
        variant: "destructive"
      });
    } else {
      setRatings(data || []);
    }
    setIsLoading(false);
  };

  const statistics = useMemo(() => {
    if (ratings.length === 0) return null;

    const stats: Record<string, { sum: number; count: number; avg: number }> = {};
    
    questionKeys.forEach(key => {
      stats[key] = { sum: 0, count: 0, avg: 0 };
    });

    ratings.forEach(rating => {
      questionKeys.forEach(key => {
        const value = rating[key as keyof Rating];
        if (typeof value === 'number') {
          stats[key].sum += value;
          stats[key].count += 1;
        }
      });
    });

    questionKeys.forEach(key => {
      if (stats[key].count > 0) {
        stats[key].avg = stats[key].sum / stats[key].count;
      }
    });

    // Overall average
    let totalSum = 0;
    let totalCount = 0;
    questionKeys.forEach(key => {
      totalSum += stats[key].sum;
      totalCount += stats[key].count;
    });

    return {
      byQuestion: stats,
      overallAvg: totalCount > 0 ? totalSum / totalCount : 0,
      totalResponses: ratings.length,
    };
  }, [ratings]);

  const sectionStats = useMemo(() => {
    const sections: Record<string, number> = {};
    ratings.forEach(r => {
      const section = r.user_section || 'Unknown';
      sections[section] = (sections[section] || 0) + 1;
    });
    return sections;
  }, [ratings]);

  const exportToCSV = () => {
    if (ratings.length === 0) {
      toast({
        title: "No Data",
        description: "There are no ratings to export.",
        variant: "destructive"
      });
      return;
    }

    const headers = [
      'Respondent Name',
      'Section',
      'Ease of Use',
      'Interface Design',
      'QR Code Functionality',
      'Attendance Tracking',
      'Response Speed',
      'Reliability',
      'Overall Satisfaction',
      'Would Recommend',
      'Suggestions',
      'Additional Comments',
      'Submitted At'
    ];

    const rows = ratings.map(r => [
      r.user_name,
      r.user_section || '',
      r.ease_of_use || '',
      r.interface_design || '',
      r.qr_code_functionality || '',
      r.attendance_tracking || '',
      r.response_speed || '',
      r.reliability || '',
      r.overall_satisfaction || '',
      r.would_recommend || '',
      `"${(r.suggestions || '').replace(/"/g, '""')}"`,
      `"${(r.additional_comments || '').replace(/"/g, '""')}"`,
      new Date(r.created_at).toLocaleString()
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `app_ratings_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: "Export Successful",
      description: `Exported ${ratings.length} ratings to CSV.`
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-green-600 dark:text-green-400';
    if (score >= 3) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-4">
              <CrossLogo size={50} />
              <div>
                <h1 className="text-2xl font-bold text-primary">App Ratings Dashboard</h1>
                <p className="text-sm text-muted-foreground">Research Data Analysis</p>
              </div>
            </div>
          </div>
          <Button onClick={exportToCSV} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading ratings data...</p>
          </div>
        ) : (
          <>
            {/* Summary Statistics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <Card className="shadow-lg">
                <CardHeader className="pb-2">
                  <CardDescription>Total Responses</CardDescription>
                  <CardTitle className="text-3xl flex items-center gap-2">
                    <Users className="h-6 w-6 text-primary" />
                    {statistics?.totalResponses || 0}
                  </CardTitle>
                </CardHeader>
              </Card>

              <Card className="shadow-lg">
                <CardHeader className="pb-2">
                  <CardDescription>Overall Average</CardDescription>
                  <CardTitle className={`text-3xl flex items-center gap-2 ${statistics ? getScoreColor(statistics.overallAvg) : ''}`}>
                    <Star className="h-6 w-6" />
                    {statistics?.overallAvg.toFixed(2) || '0.00'} / 5
                  </CardTitle>
                </CardHeader>
              </Card>

              <Card className="shadow-lg">
                <CardHeader className="pb-2">
                  <CardDescription>Highest Rated</CardDescription>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    {statistics ? (
                      <>
                        {questionLabels[
                          Object.entries(statistics.byQuestion).sort((a, b) => b[1].avg - a[1].avg)[0]?.[0]
                        ] || 'N/A'}
                        <span className="text-green-600 dark:text-green-400 ml-1">
                          ({Object.entries(statistics.byQuestion).sort((a, b) => b[1].avg - a[1].avg)[0]?.[1].avg.toFixed(2) || '0'})
                        </span>
                      </>
                    ) : 'N/A'}
                  </CardTitle>
                </CardHeader>
              </Card>

              <Card className="shadow-lg">
                <CardHeader className="pb-2">
                  <CardDescription>Sections Covered</CardDescription>
                  <CardTitle className="text-3xl flex items-center gap-2">
                    <BarChart3 className="h-6 w-6 text-primary" />
                    {Object.keys(sectionStats).length}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* Average Scores by Question */}
            <Card className="shadow-lg mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Average Scores by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {statistics && Object.entries(statistics.byQuestion).map(([key, data]) => (
                    <div key={key} className="flex items-center gap-4">
                      <div className="w-48 text-sm font-medium">{questionLabels[key]}</div>
                      <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            data.avg >= 4 ? 'bg-green-500' : data.avg >= 3 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${(data.avg / 5) * 100}%` }}
                        />
                      </div>
                      <div className={`w-16 text-right font-bold ${getScoreColor(data.avg)}`}>
                        {data.avg.toFixed(2)}
                      </div>
                      <div className="w-20 text-right text-sm text-muted-foreground">
                        ({data.count} resp.)
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Responses by Section */}
            <Card className="shadow-lg mb-8">
              <CardHeader>
                <CardTitle>Responses by Section</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(sectionStats).map(([section, count]) => (
                    <div key={section} className="bg-muted px-4 py-2 rounded-lg">
                      <span className="font-medium">{section}:</span>
                      <span className="ml-2 text-primary font-bold">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Individual Responses Table */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>All Responses ({ratings.length})</CardTitle>
                <CardDescription>Individual rating submissions from students</CardDescription>
              </CardHeader>
              <CardContent>
                {ratings.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No ratings submitted yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Section</TableHead>
                          {questionKeys.map(key => (
                            <TableHead key={key} className="text-center min-w-[60px]">
                              {questionLabels[key].split(' ').map((w, i) => (
                                <span key={i}>{w}<br/></span>
                              ))}
                            </TableHead>
                          ))}
                          <TableHead>Submitted</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ratings.map((rating) => (
                          <TableRow key={rating.id}>
                            <TableCell className="font-medium">{rating.user_name}</TableCell>
                            <TableCell>{rating.user_section || '-'}</TableCell>
                            {questionKeys.map(key => {
                              const value = rating[key as keyof Rating];
                              return (
                                <TableCell key={key} className={`text-center font-bold ${typeof value === 'number' ? getScoreColor(value) : ''}`}>
                                  {typeof value === 'number' ? value : '-'}
                                </TableCell>
                              );
                            })}
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(rating.created_at).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Suggestions & Comments */}
            {ratings.some(r => r.suggestions || r.additional_comments) && (
              <Card className="shadow-lg mt-8">
                <CardHeader>
                  <CardTitle>Open-Ended Feedback</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {ratings.filter(r => r.suggestions || r.additional_comments).map((rating) => (
                    <div key={rating.id} className="border-b border-border pb-4 last:border-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{rating.user_name}</span>
                        <span className="text-sm text-muted-foreground">({rating.user_section || 'No section'})</span>
                      </div>
                      {rating.suggestions && (
                        <div className="mb-2">
                          <span className="text-sm font-medium text-primary">Suggestions:</span>
                          <p className="text-sm text-muted-foreground mt-1">{rating.suggestions}</p>
                        </div>
                      )}
                      {rating.additional_comments && (
                        <div>
                          <span className="text-sm font-medium text-primary">Additional Comments:</span>
                          <p className="text-sm text-muted-foreground mt-1">{rating.additional_comments}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>CathoLink — Research Data Analysis Dashboard</p>
        </div>
      </div>
    </div>
  );
};

export default AdminRatings;