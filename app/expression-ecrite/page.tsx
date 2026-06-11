"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EcritureForm } from "@/components/EcritureForm";
import { EcritureDetailModal } from "@/components/EcritureDetailModal";
import { EcrituresTable } from "@/components/EcrituresTable";
import { useEcritures } from "@/hooks/useEcritures";
import { EcritureEntry } from "@/lib/types";

export default function ExpressionEcritePage() {
  const { ecritures, isLoading, deleteEntry } = useEcritures();
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<EcritureEntry | null>(null);
  const [editingEntry, setEditingEntry] = useState<EcritureEntry | undefined>();

  const handleAdd = () => {
    setEditingEntry(undefined);
    setFormOpen(true);
  };

  const handleEdit = (entry: EcritureEntry) => {
    setEditingEntry(entry);
    setFormOpen(true);
  };

  const handleRowClick = (entry: EcritureEntry) => {
    setSelectedEntry(entry);
    setDetailOpen(true);
  };

  const handleDelete = (entry: EcritureEntry) => {
    deleteEntry(entry.id);
    if (selectedEntry?.id === entry.id) {
      setDetailOpen(false);
      setSelectedEntry(null);
    }
  };

  if (isLoading) {
    return <p className="text-muted-foreground">Loading writings...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Expression écrite
          </h1>
          <p className="text-muted-foreground">
            Save your daily writing practice — prompt and response.
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add
        </Button>
      </div>

      {ecritures.length === 0 ? (
        <Card>
          <CardHeader className="text-center">
            <CardTitle>No writings yet</CardTitle>
            <CardDescription>
              Start saving your Expression écrite practice. Add the task prompt
              and your written response so you can review them later.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-6">
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Add your first writing
            </Button>
          </CardContent>
        </Card>
      ) : (
        <EcrituresTable
          ecritures={ecritures}
          onRowClick={handleRowClick}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      <EcritureForm
        open={formOpen}
        onOpenChange={setFormOpen}
        editEntry={editingEntry}
      />

      <EcritureDetailModal
        entry={selectedEntry}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
