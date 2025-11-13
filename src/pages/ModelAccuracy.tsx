import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, LineChart, CheckCircle2 } from "lucide-react";
import modelAccuracy from "@/assets/model-accuracy.png";

const ModelAccuracy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-12">
        <Button variant="ghost" onClick={() => navigate("/learn-more")} className="mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Learn More
        </Button>

        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Model Accuracy & Performance</h1>
            <p className="text-lg text-muted-foreground">
              Deep dive into our AlexNet model's training results and accuracy metrics
            </p>
          </div>

          {/* Main Accuracy Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-6 w-6" />
                Training & Validation Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <img 
                  src={modelAccuracy} 
                  alt="AlexNet Model Accuracy and Loss Graphs" 
                  className="w-full rounded-lg border border-border shadow-lg"
                />
                
                <div className="bg-primary/5 p-4 rounded-lg">
                  <p className="text-2xl font-bold text-center">93% Model Accuracy</p>
                  <p className="text-center text-muted-foreground mt-2">
                    Achieved after 20 epochs of training
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Explanations */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  Accuracy Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Training Accuracy (Blue Line)</h4>
                  <p className="text-sm text-muted-foreground">
                    Shows how well the model learns from the training dataset over time. 
                    Started at 66% and progressively improved to 96% by epoch 20, demonstrating 
                    strong learning capability.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Validation Accuracy (Orange Line)</h4>
                  <p className="text-sm text-muted-foreground">
                    Measures model performance on unseen data. Reached 93% accuracy, closely 
                    following the training curve, indicating good generalization without significant overfitting.
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    The close alignment between training and validation curves demonstrates that 
                    our model generalizes well to new, unseen images.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Loss Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Training Loss (Blue Line)</h4>
                  <p className="text-sm text-muted-foreground">
                    Decreased from 1.2 to 0.2, showing effective optimization. The smooth decline 
                    indicates stable training without erratic jumps or oscillations.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Validation Loss (Orange Line)</h4>
                  <p className="text-sm text-muted-foreground">
                    Mirrors the training loss closely, dropping from 1.3 to 0.25. The parallel 
                    decrease confirms the model isn't memorizing but truly learning patterns.
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Low and consistent loss values indicate high confidence and reliability in 
                    the model's predictions.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Key Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6" />
                Key Performance Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-semibold">No Overfitting</h4>
                      <p className="text-sm text-muted-foreground">
                        The small gap between training and validation curves indicates the model 
                        generalizes well to new data rather than memorizing training examples.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Stable Learning</h4>
                      <p className="text-sm text-muted-foreground">
                        Smooth curves without erratic fluctuations show stable and consistent 
                        learning throughout the training process.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-semibold">High Accuracy</h4>
                      <p className="text-sm text-muted-foreground">
                        93% validation accuracy demonstrates reliable vitamin deficiency detection 
                        across multiple body parts (skin, eyes, tongue, nails).
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Converged Model</h4>
                      <p className="text-sm text-muted-foreground">
                        Both accuracy and loss plateaued by epoch 20, indicating the model has 
                        fully converged and learned all available patterns.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center">
            <Button size="lg" onClick={() => navigate("/")} className="gap-2">
              Try the Detector Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelAccuracy;
