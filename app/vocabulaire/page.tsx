"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { VocabEntryForm } from "@/components/VocabEntryForm";
import { useVocab } from "@/hooks/useVocab";
import { VocabEntry } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function VocabulairePage() {
  const {
    categories,
    entries,
    isLoading,
    addCategory,
    deleteCategory,
    deleteEntry,
  } = useVocab();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );
  const [newCategoryName, setNewCategoryName] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<VocabEntry | undefined>();
  const [detailEntry, setDetailEntry] = useState<VocabEntry | null>(null);

  const activeCategoryId = selectedCategoryId ?? categories[0]?.id ?? null;

  const categoryEntries = useMemo(
    () =>
      entries.filter((e) => e.categoryId === activeCategoryId).sort((a, b) =>
        a.french.localeCompare(b.french, "fr")
      ),
    [entries, activeCategoryId]
  );

  const entryCount = (catId: string) =>
    entries.filter((e) => e.categoryId === catId).length;

  const handleAddCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    addCategory(trimmed);
    setNewCategoryName("");
  };

  if (isLoading) {
    return <p className="text-muted-foreground">Loading vocabulary…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Vocabulaire</h1>
        <p className="text-muted-foreground">
          Build your vocabulary bank for Compréhension écrite — words, phrases,
          and expressions by category.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* Categories */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={cn(
                    "flex items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors",
                    activeCategoryId === cat.id
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/50"
                  )}
                >
                  <span className="truncate">{cat.name}</span>
                  <span className="ml-2 shrink-0 text-xs opacity-60">
                    {entryCount(cat.id)}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <Input
                placeholder="New category"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                className="h-8 text-sm"
              />
              <Button size="sm" variant="outline" onClick={handleAddCategory}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Entries */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {categories.find((c) => c.id === activeCategoryId)?.name ??
                "Select a category"}
            </h2>
            {activeCategoryId && (
              <div className="flex gap-2">
                {!categories.find((c) => c.id === activeCategoryId)?.isDefault && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const cat = categories.find(
                        (c) => c.id === activeCategoryId
                      );
                      if (
                        cat &&
                        confirm(`Delete category "${cat.name}" and all its entries?`)
                      ) {
                        deleteCategory(activeCategoryId);
                      }
                    }}
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    Delete category
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingEntry(undefined);
                    setFormOpen(true);
                  }}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add word
                </Button>
              </div>
            )}
          </div>

          {categoryEntries.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No words in this category yet.{" "}
                <button
                  type="button"
                  className="text-primary underline"
                  onClick={() => setFormOpen(true)}
                >
                  Add one
                </button>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>French</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      English
                    </TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryEntries.map((entry) => (
                    <TableRow
                      key={entry.id}
                      className="cursor-pointer"
                      onClick={() => setDetailEntry(entry)}
                    >
                      <TableCell className="font-medium">
                        {entry.french}
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">
                        {entry.english ?? "—"}
                      </TableCell>
                      <TableCell>
                        <div
                          className="flex gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingEntry(entry);
                              setFormOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm("Delete this entry?")) {
                                deleteEntry(entry.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {activeCategoryId && (
        <VocabEntryForm
          open={formOpen}
          onOpenChange={setFormOpen}
          categoryId={activeCategoryId}
          editEntry={editingEntry}
        />
      )}

      {detailEntry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setDetailEntry(null)}
        >
          <Card
            className="max-h-[80vh] w-full max-w-lg overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <CardTitle>{detailEntry.french}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {detailEntry.english && (
                <div>
                  <p className="font-medium text-muted-foreground">English</p>
                  <p>{detailEntry.english}</p>
                </div>
              )}
              {detailEntry.example && (
                <div>
                  <p className="font-medium text-muted-foreground">Example</p>
                  <p className="italic">{detailEntry.example}</p>
                </div>
              )}
              {detailEntry.notes && (
                <div>
                  <p className="font-medium text-muted-foreground">Notes</p>
                  <p>{detailEntry.notes}</p>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDetailEntry(null)}
              >
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
