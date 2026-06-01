import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Factory, Users, Award, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const About = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/10">
      <div className="container mx-auto px-4 py-12">
        <Button
          variant="outline"
          onClick={() => navigate('/')}
          className="mb-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <img src="/logo.png" alt="Vinuthna Agrochemicals Logo" className="w-32 h-32 mx-auto mb-6" />
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold text-gradient-primary mb-4 break-words px-4">
              Vinuthna Agrochemicals
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              Leading the way in agricultural innovation and farmer support since our inception
            </p>
          </div>

          {/* Mission */}
          <Card className="p-8 mb-6 shadow-agricultural">
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-4 rounded-xl">
                <Target className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold mb-3">Our Mission</h2>
                <p className="text-muted-foreground leading-relaxed">
                  At Vinuthna Agrochemicals, we are committed to empowering farmers with innovative
                  agricultural solutions and expert guidance. Our mission is to bridge the gap
                  between traditional farming practices and modern agricultural science, ensuring
                  sustainable and profitable farming for all.
                </p>
              </div>
            </div>
          </Card>

          {/* Values */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="p-6 hover:shadow-agricultural transition-all">
              <div className="bg-accent/10 p-3 rounded-xl w-fit mb-4">
                <Factory className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-display font-bold mb-2">Quality Products</h3>
              <p className="text-muted-foreground text-sm">
                We provide only the highest quality agricultural products, tested and proven
                to deliver results in the field.
              </p>
            </Card>

            <Card className="p-6 hover:shadow-agricultural transition-all">
              <div className="bg-primary/10 p-3 rounded-xl w-fit mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-display font-bold mb-2">Farmer First</h3>
              <p className="text-muted-foreground text-sm">
                Every decision we make puts farmers first. We understand the challenges you
                face and work tirelessly to provide solutions.
              </p>
            </Card>

            <Card className="p-6 hover:shadow-agricultural transition-all">
              <div className="bg-accent/10 p-3 rounded-xl w-fit mb-4">
                <Award className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-display font-bold mb-2">Expert Guidance</h3>
              <p className="text-muted-foreground text-sm">
                Our team of agricultural experts is always available to provide personalized
                recommendations and support.
              </p>
            </Card>
          </div>

          {/* Services */}
          <Card className="p-8 shadow-agricultural">
            <h2 className="text-2xl font-display font-bold mb-6">What We Offer</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                <div>
                  <h3 className="font-semibold mb-1">Crop Diagnosis & Treatment</h3>
                  <p className="text-sm text-muted-foreground">
                    Accurate identification of crop problems with precise treatment recommendations
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                <div>
                  <h3 className="font-semibold mb-1">Premium Agricultural Products</h3>
                  <p className="text-sm text-muted-foreground">
                    Wide range of pesticides, fertilizers, and agricultural solutions
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                <div>
                  <h3 className="font-semibold mb-1">Multilingual Support</h3>
                  <p className="text-sm text-muted-foreground">
                    Services available in English, Telugu, and Hindi for better accessibility
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                <div>
                  <h3 className="font-semibold mb-1">Dosage Calculation Tools</h3>
                  <p className="text-sm text-muted-foreground">
                    Precise dosage recommendations based on your acreage and crop needs
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Contact */}
          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">
              For more information or inquiries
            </p>
            <Button
              size="lg"
              onClick={() => window.open('https://vinuthnaagro.com/', '_blank')}
            >
              Visit Our Website
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
