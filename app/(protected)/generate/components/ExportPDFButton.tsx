"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import generatePDF from "../utils/exportPDF";
import { ArchitectureData } from "../utils/types";
import { useState } from "react";

interface ExportPDFButtonProps {
  data: ArchitectureData;
  diagramElement?: HTMLElement | null;
}

export default function ExportPDFButton({
  data,
  diagramElement,
}: ExportPDFButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      await generatePDF({
        data,
        diagramElement,
      });
    } catch (error) {
      console.error("Failed to export PDF:", error);
      alert("Failed to export PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExportPDF}
      disabled={isExporting}
      variant="outline"
      size="sm"
      className="rounded-xl transition-all duration-300"
    >
      {isExporting ? (
        <>
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
          Exporting...
        </>
      ) : (
        <>
          <Download className="w-4 h-4 mr-2" />
          Export PDF
        </>
      )}
    </Button>
  );
}
