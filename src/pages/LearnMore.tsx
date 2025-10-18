import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Brain, Camera, Shield, Zap } from "lucide-react";

const LearnMore = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-12">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
        </Button>

        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h1>
            <p className="text-lg text-muted-foreground">
              Advanced deep learning technology for vitamin deficiency detection
            </p>
          </div>

          {/* Technology Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-6 w-6" />
                Deep Neural Network Technology
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Our system uses state-of-the-art deep neural networks, specifically AlexNet and RCNN 
                (Region-based Convolutional Neural Networks), to analyze visual indicators of vitamin deficiencies.
              </p>
              
              <div className="grid md:grid-cols-2 gap-6 mt-6">
                <div>
                  <h3 className="font-semibold mb-2">AlexNet Architecture</h3>
                  <p className="text-sm text-muted-foreground">
                    AlexNet is a pioneering deep learning architecture that excels at image classification. 
                    It uses multiple convolutional layers to extract hierarchical features from images, 
                    making it ideal for detecting subtle visual patterns associated with vitamin deficiencies.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">RCNN Technology</h3>
                  <p className="text-sm text-muted-foreground">
                    Region-based Convolutional Neural Networks (RCNN) allow precise localization and 
                    identification of specific areas of concern in images. This helps pinpoint exact 
                    regions showing signs of deficiency.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <Camera className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Image Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Upload clear photos of skin, eyes, tongue, or nails. Our neural network analyzes 
                  color, texture, and visual patterns.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Fast Results</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Get instant analysis powered by optimized neural networks running on high-performance 
                  cloud infrastructure.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Privacy First</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Your images are processed securely and not stored permanently. We prioritize your 
                  privacy and data security.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* What We Detect */}
          <Card>
            <CardHeader>
              <CardTitle>Detectable Vitamin Deficiencies</CardTitle>
              <CardDescription>
                Our system can identify visual indicators of various vitamin and mineral deficiencies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Skin Analysis</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Vitamin A: Dry, rough skin texture</li>
                    <li>• Vitamin C: Bruising and slow wound healing</li>
                    <li>• Vitamin D: Pale or dull skin tone</li>
                    <li>• Vitamin E: Skin inflammation</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-3">Eye Analysis</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Vitamin A: Night blindness indicators</li>
                    <li>• Vitamin B12: Pale conjunctiva</li>
                    <li>• Iron: Pale inner eyelids</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-3">Tongue Analysis</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Vitamin B12: Smooth, red tongue</li>
                    <li>• Iron: Pale tongue appearance</li>
                    <li>• Folate: Tongue inflammation</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-3">Nail Analysis</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Iron: Spoon-shaped nails</li>
                    <li>• Biotin: Brittle, cracked nails</li>
                    <li>• Zinc: White spots on nails</li>
                    <li>• Vitamin C: Nail splitting</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Medical Disclaimer */}
          <Card className="border-orange-500/50 bg-orange-50 dark:bg-orange-950/20">
            <CardHeader>
              <CardTitle>Important Medical Disclaimer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                This tool is designed for preliminary screening and educational purposes only. 
                It should not be used as a substitute for professional medical advice, diagnosis, or treatment.
              </p>
              <p>
                <strong>Always consult a qualified healthcare provider</strong> if you suspect you have 
                a vitamin deficiency or any health concern. Laboratory tests are required for accurate 
                diagnosis of vitamin deficiencies.
              </p>
              <p>
                Self-diagnosis and self-medication can be dangerous. The recommendations provided by this 
                tool are general guidelines and may not be suitable for everyone.
              </p>
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button size="lg" onClick={() => navigate("/")}>
              Try the Detector
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearnMore;
