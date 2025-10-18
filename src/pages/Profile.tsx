import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, History, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    full_name: "",
    phone_number: "",
  });
  const [medicalHistory, setMedicalHistory] = useState({
    known_conditions: "",
    current_medications: "",
    allergies: "",
    family_history: "",
    notes: "",
  });
  const [analysisHistory, setAnalysisHistory] = useState<any[]>([]);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUser(user);
    await loadProfile(user.id);
    await loadMedicalHistory(user.id);
    await loadAnalysisHistory(user.id);
    setLoading(false);
  };

  const loadProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    
    if (data) {
      setProfile({
        full_name: data.full_name || "",
        phone_number: data.phone_number || "",
      });
    }
  };

  const loadMedicalHistory = async (userId: string) => {
    const { data } = await supabase
      .from("medical_history")
      .select("*")
      .eq("user_id", userId)
      .single();
    
    if (data) {
      setMedicalHistory({
        known_conditions: data.known_conditions || "",
        current_medications: data.current_medications || "",
        allergies: data.allergies || "",
        family_history: data.family_history || "",
        notes: data.notes || "",
      });
    }
  };

  const loadAnalysisHistory = async (userId: string) => {
    const { data } = await supabase
      .from("analysis_history")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    
    if (data) {
      setAnalysisHistory(data);
    }
  };

  const updateProfile = async () => {
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update(profile)
      .eq("id", user.id);

    if (error) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    }
  };

  const saveMedicalHistory = async () => {
    if (!user) return;

    const { error } = await supabase
      .from("medical_history")
      .upsert({
        user_id: user.id,
        ...medicalHistory,
      });

    if (error) {
      toast({
        title: "Error saving medical history",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Medical history saved",
        description: "Your medical history has been saved successfully.",
      });
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-12">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
        </Button>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">My Profile</h1>
            <p className="text-muted-foreground">{user?.email}</p>
          </div>

          <Tabs defaultValue="profile">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">
                <User className="mr-2 h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="medical">
                <Heart className="mr-2 h-4 w-4" />
                Medical History
              </TabsTrigger>
              <TabsTrigger value="history">
                <History className="mr-2 h-4 w-4" />
                Analysis History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Update your personal details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profile.full_name}
                      onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={profile.phone_number}
                      onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })}
                    />
                  </div>
                  <Button onClick={updateProfile}>Save Changes</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="medical">
              <Card>
                <CardHeader>
                  <CardTitle>Medical History</CardTitle>
                  <CardDescription>
                    Store your medical information securely for better analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="conditions">Known Conditions</Label>
                    <Textarea
                      id="conditions"
                      value={medicalHistory.known_conditions}
                      onChange={(e) =>
                        setMedicalHistory({ ...medicalHistory, known_conditions: e.target.value })
                      }
                      placeholder="List any known medical conditions"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="medications">Current Medications</Label>
                    <Textarea
                      id="medications"
                      value={medicalHistory.current_medications}
                      onChange={(e) =>
                        setMedicalHistory({ ...medicalHistory, current_medications: e.target.value })
                      }
                      placeholder="List your current medications"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="allergies">Allergies</Label>
                    <Textarea
                      id="allergies"
                      value={medicalHistory.allergies}
                      onChange={(e) =>
                        setMedicalHistory({ ...medicalHistory, allergies: e.target.value })
                      }
                      placeholder="List any allergies"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="family">Family History</Label>
                    <Textarea
                      id="family"
                      value={medicalHistory.family_history}
                      onChange={(e) =>
                        setMedicalHistory({ ...medicalHistory, family_history: e.target.value })
                      }
                      placeholder="Relevant family medical history"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea
                      id="notes"
                      value={medicalHistory.notes}
                      onChange={(e) =>
                        setMedicalHistory({ ...medicalHistory, notes: e.target.value })
                      }
                      placeholder="Any other relevant information"
                    />
                  </div>
                  <Button onClick={saveMedicalHistory}>Save Medical History</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Analysis History</CardTitle>
                  <CardDescription>Your past vitamin deficiency analyses</CardDescription>
                </CardHeader>
                <CardContent>
                  {analysisHistory.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No analysis history yet. Try the detector to get started!
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {analysisHistory.map((analysis) => (
                        <Card key={analysis.id}>
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-lg capitalize">
                                  {analysis.body_part} Analysis
                                </CardTitle>
                                <CardDescription>
                                  {new Date(analysis.created_at).toLocaleDateString()}
                                </CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground">
                              {analysis.analysis_result.deficiencies?.length || 0} deficiencies detected
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Profile;
