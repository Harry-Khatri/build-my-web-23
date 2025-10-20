import { useState, useEffect } from "react";
import { Upload, Eye, Droplet, HandMetal, Microscope, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import medicalBackground from "@/assets/medical-background.jpg";

type BodyPart = "skin" | "eyes" | "tongue" | "nails";

interface AnalysisResult {
  deficiencies: Array<{
    vitamin: string;
    severity: "low" | "moderate" | "severe";
    confidence: number;
    signs: string[];
    recommendations: string[];
  }>;
  overall_health: string;
}

const Index = () => {
  const [selectedPart, setSelectedPart] = useState<BodyPart | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const bodyParts = [
    { id: "skin" as BodyPart, label: "Skin", icon: Droplet, description: "Analyze skin texture & color" },
    { id: "eyes" as BodyPart, label: "Eyes", icon: Eye, description: "Check eye health indicators" },
    { id: "tongue" as BodyPart, label: "Tongue", icon: Microscope, description: "Examine tongue appearance" },
    { id: "nails" as BodyPart, label: "Nails", icon: HandMetal, description: "Inspect nail condition" },
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const analyzeImage = async () => {
    if (!imagePreview || !selectedPart) return;

    setIsAnalyzing(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("analyze-vitamin-deficiency", {
        body: {
          image: imagePreview,
          bodyPart: selectedPart,
        },
      });

      if (error) throw error;

      setResult(data);

      // Save to analysis history if user is logged in
      if (user) {
        await supabase.from('analysis_history').insert({
          user_id: user.id,
          body_part: selectedPart,
          image_url: imagePreview.substring(0, 100), // Store preview of base64
          analysis_result: data
        });
      }

      toast({
        title: "Analysis Complete",
        description: "Your results are ready",
      });
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: "Analysis Failed",
        description: "Please try again or use a different image",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out successfully",
    });
  };

  const reset = () => {
    setSelectedPart(null);
    setImagePreview(null);
    setResult(null);
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: `url(${medicalBackground})` }}
    >
      {/* Overlay for better readability */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm"></div>
      
      {/* Content wrapper */}
      <div className="relative z-10">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <h2 className="text-xl font-bold">Vitamin Detector</h2>
              <div className="hidden md:flex gap-6">
                <Button variant="ghost" onClick={() => navigate("/")}>Home</Button>
                <Button variant="ghost" onClick={() => navigate("/learn-more")}>Learn More</Button>
                <Button variant="ghost" onClick={() => navigate("/contact")}>Contact</Button>
                {user && <Button variant="ghost" onClick={() => navigate("/profile")}>Profile</Button>}
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <>
                  <span className="text-sm text-muted-foreground">{user.email}</span>
                  <Button onClick={handleSignOut} variant="outline">Sign Out</Button>
                </>
              ) : (
                <Button onClick={() => navigate("/auth")}>Sign In</Button>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-2">
              <Button variant="ghost" className="w-full" onClick={() => { navigate("/"); setMobileMenuOpen(false); }}>Home</Button>
              <Button variant="ghost" className="w-full" onClick={() => { navigate("/learn-more"); setMobileMenuOpen(false); }}>Learn More</Button>
              <Button variant="ghost" className="w-full" onClick={() => { navigate("/contact"); setMobileMenuOpen(false); }}>Contact</Button>
              {user && <Button variant="ghost" className="w-full" onClick={() => { navigate("/profile"); setMobileMenuOpen(false); }}>Profile</Button>}
              {user ? (
                <Button onClick={handleSignOut} variant="outline" className="w-full">Sign Out</Button>
              ) : (
                <Button onClick={() => { navigate("/auth"); setMobileMenuOpen(false); }} className="w-full">Sign In</Button>
              )}
            </div>
          )}
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Vitamin Deficiency Detector
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Deep neural network using AlexNet and RCNN to detect potential vitamin deficiencies by examining your skin, eyes, tongue, and nails
          </p>
        </div>

        {!result ? (
          <>
            {/* Body Part Selection */}
            {!selectedPart && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {bodyParts.map((part) => (
                  <Card
                    key={part.id}
                    className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 border-2 hover:border-primary"
                    onClick={() => setSelectedPart(part.id)}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-center mb-4">
                        <div className="p-4 bg-primary/10 rounded-full">
                          <part.icon className="w-8 h-8 text-primary" />
                        </div>
                      </div>
                      <CardTitle className="text-center">{part.label}</CardTitle>
                      <CardDescription className="text-center">{part.description}</CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}

            {/* Upload Section */}
            {selectedPart && !imagePreview && (
              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle>Upload {bodyParts.find((p) => p.id === selectedPart)?.label} Image</CardTitle>
                  <CardDescription>
                    Take a clear, well-lit photo for the best results (max 5MB)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-12 h-12 mb-4 text-muted-foreground" />
                      <p className="mb-2 text-sm text-muted-foreground">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">PNG, JPG or WEBP (MAX. 5MB)</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </label>
                  <Button variant="outline" className="w-full mt-4" onClick={() => setSelectedPart(null)}>
                    Choose Different Body Part
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Image Preview & Analysis */}
            {imagePreview && (
              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle>Ready to Analyze</CardTitle>
                  <CardDescription>
                    Review your image and click analyze when ready
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex gap-4">
                    <Button
                      onClick={analyzeImage}
                      disabled={isAnalyzing}
                      className="flex-1"
                    >
                      {isAnalyzing ? "Analyzing..." : "Analyze Image"}
                    </Button>
                    <Button variant="outline" onClick={reset}>
                      Start Over
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          /* Results Section */
          <div className="max-w-4xl mx-auto space-y-6">
            <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur">
              <CardHeader>
                <CardTitle>Vitamin Deficiency Analysis Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {result.deficiencies.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
                      No deficiency detected
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Your analysis shows no signs of vitamin deficiencies. Keep up the good health!
                    </p>
                  </div>
                ) : (
                  result.deficiencies.map((deficiency, index) => (
                    <Card key={index} className="border-l-4 border-l-primary">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xl">{deficiency.vitamin}</CardTitle>
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              deficiency.severity === "severe"
                                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                                : deficiency.severity === "moderate"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                            }`}
                          >
                            {deficiency.severity.toUpperCase()}
                          </span>
                        </div>
                        <CardDescription>
                          Confidence: {Math.round(deficiency.confidence * 100)}%
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2">Observed Signs:</h4>
                          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                            {deficiency.signs.map((sign, i) => (
                              <li key={i}>{sign}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Recommendations:</h4>
                          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                            {deficiency.recommendations.map((rec, i) => (
                              <li key={i}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button onClick={reset} className="flex-1">
                New Analysis
              </Button>
            </div>

            <Card className="bg-secondary/50">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  <strong>Disclaimer:</strong> This tool provides preliminary insights based on visual analysis
                  and should not replace professional medical diagnosis. Please consult a healthcare provider
                  for accurate diagnosis and treatment.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* How It Works */}
        {!selectedPart && !result && (
          <Card className="max-w-4xl mx-auto mt-12">
            <CardHeader>
              <CardTitle className="text-center">How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { step: "1", title: "Select", desc: "Choose the body part to analyze" },
                  { step: "2", title: "Upload", desc: "Take or upload a clear photo" },
                  { step: "3", title: "Analyze", desc: "AI examines for deficiency signs" },
                  { step: "4", title: "Results", desc: "Get detailed insights & advice" },
                ].map((item) => (
                  <div key={item.step} className="text-center">
                    <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                      {item.step}
                    </div>
                    <h3 className="font-semibold mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      </div>
    </div>
  );
};

export default Index;
