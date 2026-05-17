"use client";

import { useGenerateSystem } from "../hooks/useGenerateSystem";
import { useHistory } from "@/lib/contexts/HistoryContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import MermaidDiagram from "./mermaidDiagram";
import { ArchitectureData } from "../utils/types";
import MicroservicesSection from "./MicroservicesSection";
import EntitiesSection from "./EntitiesSection";
import ApiRoutesSection from "./ApiRoutesSection";
import DatabaseSchemaSection from "./DatabaseSchemaSection";
import InfrastructureSection from "./InfrastructureSection";
import Lottie from "lottie-react";
import animationData from "@/components/loaderLottie.json";

export default function GeneratePage() {
  const { refetch } = useHistory();
  const {
    generate,
    isLoading,
    error: generateError,
  } = useGenerateSystem(refetch);
  const [userInput, setUserInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [generatedData, setGeneratedData] = useState<ArchitectureData | null>(
    null,
  );
  const [streamingProgress, setStreamingProgress] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);

  function cleanMermaidString(input: string | undefined | null): string {
    if (!input || typeof input !== "string") return "";

    return ( 
      input
        // Remove code block markers if present (for backward compatibility)
        .replace(/^```mermaid\n?/g, "")
        .replace(/\n?```$/g, "")
        .replace(/```/g, "")
        // Convert escaped newlines to actual newlines
        .replace(/\\n/g, "\n")
        // Handle any other escaped characters
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'")
        .trim()
    );
  }

  const handleGenerate = async () => {
    setError(null);
    setGeneratedData(null);
    setStreamingProgress("");
    setIsStreaming(true);

    const result = await generate(userInput, (chunk: string) => {
      // Update streaming progress in real-time
      // setStreamingProgress(chunk);
      setStreamingProgress((prev) => prev + chunk);
    });  

    // 👇 ADD THESE DEBUG LOGS RIGHT HERE 
          console.log("FULL RESULT:", result);
          console.log("output:", result?.output);
          console.log("length:", result?.output?.length ?? 0);
    if (result && result.success) {
      setIsStreaming(false); 
      try {
        // More robust parsing: find JSON content between ```json and ```
        let cleanedOutput = result.output;

        // Find the start of JSON code block
        const jsonStartMarker = "```json";
        const jsonStart = cleanedOutput.indexOf(jsonStartMarker);

        if (jsonStart !== -1) {
          // Extract from after the ```json marker
          cleanedOutput = cleanedOutput.slice(
            jsonStart + jsonStartMarker.length,
          );

          // Find the first closing ``` after the JSON start (not the last one in the entire string)
          const jsonEnd = cleanedOutput.indexOf("```");
          if (jsonEnd !== -1) {
            cleanedOutput = cleanedOutput.slice(0, jsonEnd);
          }
        } else {
          // If no ```json marker, try to find JSON object directly
          // Look for first { and matching closing } to extract JSON
          const firstBrace = cleanedOutput.indexOf("{");
          if (firstBrace !== -1) {
            // Find matching closing brace
            let braceCount = 0;
            let lastBrace = -1;
            for (let i = firstBrace; i < cleanedOutput.length; i++) {
              if (cleanedOutput[i] === "{") braceCount++;
              if (cleanedOutput[i] === "}") {
                braceCount--;
                if (braceCount === 0) {
                  lastBrace = i;
                  break;
                }
              }
            }
            if (lastBrace !== -1) {
              cleanedOutput = cleanedOutput.slice(firstBrace, lastBrace + 1);
            }
          }
        }

        // Trim whitespace
        cleanedOutput = cleanedOutput.trim();

        if (!cleanedOutput) {
          throw new Error("No JSON content found in AI response.");
        }

        // const parsedData: ArchitectureData = JSON.parse(cleanedOutput);
        // setGeneratedData(parsedData);
        console.log("FINAL OUTPUT:", cleanedOutput);

        const parsedData: ArchitectureData = JSON.parse(cleanedOutput);

        console.log("PARSED DATA:", parsedData);

        setGeneratedData(parsedData); 
      } catch (parseError) {
        console.error("Failed to parse generated data:", parseError);
        console.error("Raw output length:", result.output.length);
        console.error(
          "Raw output preview:",
          result.output.substring(0, 500) + "...",
        );
        setGeneratedData(null);
      }
    } else {
      setError(generateError); 
      setGeneratedData(null);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex gap-4 items-center">
        <Input
          placeholder="Enter your system architecture prompt..."
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          className="flex-1"
        />
        <Button
          onClick={handleGenerate}
          disabled={isLoading || !userInput.trim()}
        >
          {isLoading ? "Generating..." : "Generate System"}
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <p className="text-red-800">Error: {error}</p>
          </CardContent>
        </Card>
      )}

      {isStreaming && streamingProgress && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg text-blue-900">
              🔄 Generating in Real-Time
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="max-h-48 overflow-auto rounded bg-white p-3 text-xs font-mono text-gray-700 whitespace-pre-wrap break-words">
              {streamingProgress}
              <span className="animate-pulse">▌</span>
            </div>
            <p className="mt-2 text-xs text-blue-700">
              Streaming response in real-time... {streamingProgress.length} characters received
            </p>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <div className="flex justify-center items-center min-h-[400px]">
          <Lottie
            animationData={animationData}
            loop={true}
            style={{ width: 400, height: 400 }}
          />
        </div>
      )}

      {generatedData && !isLoading && (
        <div className="space-y-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-2xl">
                {generatedData.systemName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">{generatedData.summary}</p>
            </CardContent>
          </Card>

          {/* Sections */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Microservices</h2>
            <MicroservicesSection microservices={generatedData.microservices || []} />
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Entities</h2>
            <EntitiesSection entities={generatedData.entities || []} />
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">API Routes</h2>
            <ApiRoutesSection apiRoutes={generatedData.apiRoutes || []} />
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Database Schema</h2>
            <DatabaseSchemaSection schema={generatedData.databaseSchema || {
              type: "",
      collections: [], 
            }} />
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Infrastructure</h2>
            <InfrastructureSection infra={generatedData.infrastructure || {
               hosting: "",
      database: "",
      auth: "",
      cdn: "",
      scaling: "", 
            }} />
          </section>

          {generatedData["Architecture Diagram"] && (
            <section>
              <h2 className="text-2xl font-bold mb-4">Architecture Diagram</h2>
              <MermaidDiagram
                chart={cleanMermaidString(
                  generatedData["Architecture Diagram"],
                )}
              />
            </section>
          )}
        </div>
      )}
    </div>
  );
}
