
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Github, Linkedin, Code } from "lucide-react";

export function DeveloperInfo() {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Code className="h-5 w-5" />
          Developer
        </CardTitle>
        <CardDescription>Created with passion for music and emotion</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Mayansh Bangali</h3>
          <Badge variant="secondary" className="mt-1">Full Stack Developer</Badge>
        </div>
        
        <div className="flex justify-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <a
              href="https://github.com/Mayanshh"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <Github className="h-4 w-4" />
              GitHub
            </a>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <a
              href="https://in.linkedin.com/in/mayansh-bangali"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <Linkedin className="h-4 w-4" />
              LinkedIn
            </a>
          </Button>
        </div>
        
        <div className="text-center text-sm text-muted-foreground">
          <p>Emotion-based music recommendation system</p>
          <p>Built with React, Express, and Spotify API</p>
        </div>
      </CardContent>
    </Card>
  );
}
